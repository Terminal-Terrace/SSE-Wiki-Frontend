/**
 * 文件上传工具
 *
 * TODO: 后端接入
 * 目前为本地模拟版本，文件转为 Base64 URL
 *
 * 需要实现的后端 API：
 * 1. POST /api/v1/files/upload/init - 初始化上传（秒传检测）
 * 2. POST /api/v1/files/upload/chunk - 上传分块
 * 3. POST /api/v1/files/upload/complete - 完成上传
 * 4. GET /api/v1/files/:id - 在线预览文件
 * 5. GET /api/v1/files/:id/download - 下载文件
 *
 * @see 多文件上传预期.md 查看完整技术方案
 */

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
  const allowedTypes = [
    // 图片
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // 视频
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // 音频
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    // 文档
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown',
    // 压缩包
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // 代码
    'text/javascript',
    'application/json',
    'text/xml',
    'text/html',
  ]

  if (!allowedTypes.includes(file.type)) {
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
  const maxSize = 100 * 1024 * 1024 // TODO：目前文件大小限制为100MB，写死

  if (file.size > maxSize) {
    return {
      valid: false,
      message: '文件大小超过限制 (最大 100 MB)',
    }
  }

  return { valid: true }
}

/**
 * 将文件转换为 Base64 URL（模拟上传）
 *
 * TODO: 后端接入 - 删除此函数
 * 实际实现时，应该改为真实的文件上传到服务器
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 上传文件
 *
 * TODO: 后端接入 - 替换为真实上传逻辑
 *
 * 实现步骤：
 * 1. 计算文件 SHA256 Hash（使用 Web Worker 避免阻塞）
 * 2. 调用 /api/v1/files/upload/init 初始化上传
 * 3. 如果返回 exists=true，直接返回文件信息（秒传）
 * 4. 否则，将文件分块（2MB/块）
 * 5. 并发上传分块到 /api/v1/files/upload/chunk（最多3个并发）
 * 6. 所有分块完成后调用 /api/v1/files/upload/complete
 * 7. 返回服务器生成的文件信息
 *
 * 当前实现：模拟上传，文件转为 Base64 存储在前端
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<FileInfo> {
  // 验证文件类型
  const typeValidation = validateFileType(file)
  if (!typeValidation.valid) {
    throw new Error(typeValidation.message)
  }

  // 验证文件大小
  const sizeValidation = validateFileSize(file)
  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.message)
  }

  // TODO: 后端接入 - 替换以下模拟代码
  // ============ 以下是模拟代码，后端接入时需要删除 ============

  // 模拟上传进度
  const total = file.size
  let loaded = 0
  const chunkSize = Math.ceil(total / 10) // 分10步模拟

  return new Promise((resolve, reject) => {
    const uploadInterval = setInterval(() => {
      loaded += chunkSize
      if (loaded > total)
        loaded = total

      const percentage = Math.round((loaded / total) * 100)
      onProgress?.({ loaded, total, percentage })

      if (loaded >= total) {
        clearInterval(uploadInterval)

        // 转换为 Base64 URL（模拟存储）
        fileToBase64(file)
          .then((dataUrl) => {
            const fileInfo: FileInfo = {
              fileId: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileUrl: dataUrl, // TODO: 后端接入 - 这里应该是服务器返回的 URL，如: /api/v1/files/123
              category: getFileCategory(file.type),
            }
            resolve(fileInfo)
          })
          .catch(reject)
      }
    }, 100) // 每100ms更新一次进度
  })

  // ============ 模拟代码结束 ============

  /* TODO: 后端接入 - 使用以下真实实现替换上面的模拟代码

  try {
    // 1. 计算文件 Hash（在 Web Worker 中）
    const fileHash = await calculateFileHash(file)

    // 2. 初始化上传
    const initResponse = await fetch('/api/v1/files/upload/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileHash,
        mimeType: file.type,
        totalChunks: Math.ceil(file.size / (2 * 1024 * 1024))
      })
    })
    const initData = await initResponse.json()

    // 3. 如果文件已存在（秒传）
    if (initData.exists) {
      return {
        fileId: initData.fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: `/api/v1/files/${initData.fileId}`,
        category: getFileCategory(file.type)
      }
    }

    // 4. 分块上传
    const chunkSize = 2 * 1024 * 1024 // 2MB
    const chunks = Math.ceil(file.size / chunkSize)
    const uploadQueue = new UploadQueue(3) // 3个并发

    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      await uploadQueue.add(async () => {
        const formData = new FormData()
        formData.append('file', chunk)
        formData.append('uploadId', initData.uploadId)
        formData.append('chunkIndex', i.toString())

        await fetch('/api/v1/files/upload/chunk', {
          method: 'POST',
          body: formData
        })

        // 更新进度
        const percentage = Math.round(((i + 1) / chunks) * 100)
        onProgress?.({
          loaded: Math.min((i + 1) * chunkSize, file.size),
          total: file.size,
          percentage
        })
      })
    }

    // 5. 完成上传
    const completeResponse = await fetch('/api/v1/files/upload/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId: initData.uploadId })
    })
    const fileData = await completeResponse.json()

    return {
      fileId: fileData.fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl: `/api/v1/files/${fileData.fileId}`,
      category: getFileCategory(file.type)
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    throw error
  }
  */
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
