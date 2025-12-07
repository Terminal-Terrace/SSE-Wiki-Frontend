import request from '@/utils/request'

export interface FileInfo {
  fileId: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other'
  status: 'uploading' | 'uploaded' | 'failed'
  missing?: boolean // 文件是否已失效/删除
}

/**
 * 批量获取文件信息
 * @param fileIds 文件ID数组
 * @returns 文件信息数组
 */
export async function batchGetFileInfo(fileIds: string[]): Promise<FileInfo[]> {
  const res = await request.post('/api/v1/files/batch-info', { fileIds }) as any

  // 后端约定：返回结构为 { files: FileInfo[] }
  if (Array.isArray(res))
    return res as FileInfo[]

  if (Array.isArray(res?.files))
    return res.files as FileInfo[]

  if (Array.isArray(res?.data?.files))
    return res.data.files as FileInfo[]

  return []
}

/**
 * 根据 MIME 类型判断文件分类
 */
export function getCategoryFromMimeType(mimeType: string): FileInfo['category'] {
  if (mimeType.startsWith('image/'))
    return 'image'
  if (mimeType.startsWith('video/'))
    return 'video'
  if (mimeType.startsWith('audio/'))
    return 'audio'
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('powerpoint'))
    return 'document'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gz'))
    return 'archive'
  if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('html') || mimeType.includes('css'))
    return 'code'
  return 'other'
}
