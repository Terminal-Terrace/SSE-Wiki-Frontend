/**
 * 文件上传工具
 *
 * 云存储直传实现，支持秒传、断点续传
 * 流程：BFF init → OSS 直传 → BFF complete
 */

import { ALLOWED_FILE_TYPES, CHUNK_SIZE, MAX_CONCURRENT, MAX_FILE_SIZE } from '@/constants/upload'
import { completeUpload, getUploadPartUrl, initUpload } from '@/services/upload/api'
import { getCategoryFromMimeType } from '@/services/upload/fileInfo'
import { calculateFileSHA256 } from '@/services/upload/hash'

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

// 使用 services/upload/fileInfo.ts 中的 getCategoryFromMimeType
// 避免重复定义

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
 * 上传文件到云存储
 *
 * 实现步骤：
 * 1. 计算文件 SHA256 Hash
 * 2. 调用 BFF /api/v1/files/upload/init 初始化上传（秒传检测）
 * 3. 如果返回 exists=true，直接返回文件信息（秒传）
 * 4. 否则，分块上传：
 *    - 对每个分块调用 BFF 获取预签名 URL
 *    - 直接 PUT 到 OSS（不经过 BFF）
 * 5. 所有分块完成后调用 BFF /api/v1/files/upload/complete
 * 6. 返回文件信息
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

  // 1) 计算文件哈希
  const fileHash = await calculateFileSHA256(file)

  // 2) 初始化上传（秒传检测）
  const initData = await initUpload({
    fileHash,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  })

  // 秒传：文件已存在
  if (initData.exists && initData.fileId && initData.url) {
    return {
      fileId: initData.fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl: initData.url,
      category: getCategoryFromMimeType(file.type),
    }
  }

  if (!initData.uploadId)
    throw new Error('后端未返回 uploadId')

  const uploadId = initData.uploadId

  // 3) 分块上传到 OSS（并发）
  const total = file.size
  const chunks = Math.ceil(total / CHUNK_SIZE)
  let uploadedChunks = 0

  const pool = new ConcurrencyPool(MAX_CONCURRENT)
  const tasks: Array<() => Promise<void>> = []

  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, total)
    const blob = file.slice(start, end)
    const partNumber = i + 1 // OSS partNumber 从 1 开始

    tasks.push(async () => {
      // 获取预签名 URL
      const presignedUrl = await getUploadPartUrl({ uploadId, partNumber })

      // 直接 PUT 到 OSS
      const resp = await fetch(presignedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
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
  const completeData = await completeUpload({ uploadId })

  return {
    fileId: completeData.fileId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    fileUrl: completeData.url,
    category: getCategoryFromMimeType(file.type),
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
