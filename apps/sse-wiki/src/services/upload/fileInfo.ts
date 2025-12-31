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

// 后端返回的文件信息结构
interface BackendFileInfo {
  id: string
  name: string
  size: number
  mimeType: string
  url: string
  category: FileInfo['category']
  missing: boolean
}

/**
 * 将后端返回的字段映射为前端 FileInfo 格式
 */
function mapBackendFileInfo(item: BackendFileInfo): FileInfo {
  return {
    fileId: item.id,
    fileName: item.name,
    fileSize: item.size,
    mimeType: item.mimeType,
    url: item.url,
    category: item.category,
    status: 'uploaded',
    missing: item.missing,
  }
}

/**
 * 批量获取文件信息
 * @param fileIds 文件ID数组
 * @returns 文件信息数组
 */
export async function batchGetFileInfo(fileIds: string[]): Promise<FileInfo[]> {
  const res = await request.post('/api/v1/files/batch-info', { fileIds }) as any

  // 提取文件数组
  let files: BackendFileInfo[] = []
  if (Array.isArray(res))
    files = res
  else if (Array.isArray(res?.files))
    files = res.files
  else if (Array.isArray(res?.data?.files))
    files = res.data.files

  // 映射字段名
  return files.map(mapBackendFileInfo)
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
