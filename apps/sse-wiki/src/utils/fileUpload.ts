/**
 * 文件上传工具
 *
 * 分块上传实现，支持秒传、断点续传
 *
 */

import { ALLOWED_FILE_TYPES, CHUNK_SIZE, MAX_CONCURRENT, MAX_FILE_SIZE } from '@/constants/upload'

export interface FileInfo {
  fileId: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other'
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

/**
 * 判断文件类别
 */
export function getFileCategory(mimeType: string): FileInfo['category'] {
  if (mimeType.startsWith('image/'))
    return 'image'
  if (mimeType.startsWith('video/'))
    return 'video'
  if (mimeType.startsWith('audio/'))
    return 'audio'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar')) {
    return 'archive'
  }
  if (
    mimeType.includes('javascript')
    || mimeType.includes('json')
    || mimeType.includes('xml')
    || mimeType.includes('typescript')
    || mimeType.includes('python')
    || mimeType.includes('java')
  ) {
    return 'code'
  }
  if (
    mimeType.includes('pdf')
    || mimeType.includes('word')
    || mimeType.includes('document')
    || mimeType.includes('text')
    || mimeType.includes('spreadsheet')
    || mimeType.includes('presentation')
  ) {
    return 'document'
  }
  return 'other'
}

/**
 * 验证文件类型
 */
export function validateFileType(file: File): { valid: boolean, message?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `不支持的文件类型: ${file.type}`,
    }
  }

  return { valid: true }
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File): { valid: boolean, message?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: '文件大小超过限制 (最大 100 MB)',
    }
  }

  return { valid: true }
}

/**
 * 上传文件
 *
 * 实现步骤：
 * 1. 计算文件 SHA256 Hash
 * 2. 调用 /api/v1/upload/init 初始化上传（秒传检测）
 * 3. 如果返回 exists=true，直接返回文件信息（秒传）
 * 4. 否则，将文件分块（2MB/块）
 * 5. 并发上传分块到 /api/v1/upload/chunk（最多3个并发）
 * 6. 所有分块完成后调用 /api/v1/upload/complete
 * 7. 返回服务器生成的文件信息
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<FileInfo> {
  // 验证文件类型与大小
  const typeValidation = validateFileType(file)
  if (!typeValidation.valid)
    throw new Error(typeValidation.message)

  const sizeValidation = validateFileSize(file)
  if (!sizeValidation.valid)
    throw new Error(sizeValidation.message)

  // 1) 计算文件哈希（一次性读取，100MB内可接受）
  const fileHash = await calculateSHA256(file)

  // 2) 初始化上传（秒传检测）
  const initResp = await fetch('/api/v1/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      fileHash,
      totalChunks: Math.ceil(file.size / (CHUNK_SIZE)),
      mimeType: file.type,
    }),
  })
  if (!initResp.ok)
    throw new Error(`初始化上传失败: ${initResp.status}`)
  const initData: { exists: boolean, fileId?: number, fileUrl?: string, uploadId?: string } = await initResp.json()

  if (initData.exists && initData.fileId != null) {
    return {
      fileId: String(initData.fileId),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl: `/api/v1/files/${initData.fileId}`,
      category: getFileCategory(file.type),
    }
  }

  if (!initData.uploadId)
    throw new Error('后端未返回 uploadId')

  const uploadId = initData.uploadId

  // 3) 分块上传（并发3）
  const total = file.size
  const chunks = Math.ceil(total / CHUNK_SIZE)
  let uploadedChunks = 0

  // 并发上传队列
  const pool = new ConcurrencyPool(MAX_CONCURRENT)
  const tasks: Array<() => Promise<void>> = []

  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, total)
    const blob = file.slice(start, end)

    tasks.push(async () => {
      const formData = new FormData()
      formData.append('file', blob)
      formData.append('uploadId', uploadId)
      formData.append('chunkIndex', String(i))

      const resp = await fetch('/api/v1/upload/chunk', {
        method: 'POST',
        body: formData,
      })
      if (!resp.ok)
        throw new Error(`分块上传失败: ${resp.status}`)

      uploadedChunks += 1
      const loaded = Math.min(uploadedChunks * CHUNK_SIZE, total)
      const percentage = Math.round((loaded / total) * 100)
      onProgress?.({ loaded, total, percentage })
    })
  }

  await pool.run(tasks)

  // 4) 完成上传
  const completeResp = await fetch('/api/v1/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId }),
  })
  if (!completeResp.ok)
    throw new Error(`完成上传失败: ${completeResp.status}`)
  const completeData: { fileId: number, fileName: string, fileUrl: string, category: FileInfo['category'] } = await completeResp.json()

  return {
    fileId: String(completeData.fileId),
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    fileUrl: `/api/v1/files/${completeData.fileId}`,
    category: completeData.category ?? getFileCategory(file.type),
  }
}

// ========== 内部工具 ==========

class ConcurrencyPool {
  private max: number
  private running = 0
  private queue: Array<() => void> = []

  constructor(max: number) {
    this.max = Math.max(1, max)
  }

  async run(tasks: Array<() => Promise<void>>): Promise<void> {
    return new Promise((resolve, reject) => {
      const next = () => {
        if (tasks.length === 0 && this.running === 0) {
          resolve()
          return
        }
        while (this.running < this.max && tasks.length > 0) {
          const task = tasks.shift()!
          this.running++
          task()
            .then(() => {
              this.running--
              next()
            })
            .catch((err) => {
              reject(err)
            })
        }
      }
      this.queue.push(next)
      // 启动
      this.dequeue()
    })
  }

  private dequeue() {
    const fn = this.queue.shift()
    if (fn) {
      fn()
    }
  }
}

async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const bytes = new Uint8Array(hashBuffer)
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}

/**
 * 批量上传文件
 */
export async function uploadFiles(
  files: File[],
  onProgress?: (fileIndex: number, progress: UploadProgress) => void,
): Promise<FileInfo[]> {
  const results: FileInfo[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file)
      continue

    try {
      const fileInfo = await uploadFile(file, (progress) => {
        onProgress?.(i, progress)
      })
      results.push(fileInfo)
    }
    catch (error) {
      console.error(`上传文件失败: ${file.name}`, error)
      throw error
    }
  }

  return results
}
