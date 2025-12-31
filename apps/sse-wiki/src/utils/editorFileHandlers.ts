/**
 * 编辑器文件处理器适配器
 * 将项目现有的文件上传 API 适配为 @sse-wiki/vue-rich-editor 需要的 FileHandlers 接口
 */
import type { FileInfo as EditorFileInfo } from '@sse-wiki/vue-rich-editor'
import type { FileInfo as ProjectFileInfo } from '@/services/upload/fileInfo'
import { batchGetFileInfo } from '@/services/upload/fileInfo'
import { uploadFile } from './fileUpload'

/**
 * 将项目 FileInfo 转换为编辑器 FileInfo
 */
function mapToEditorFileInfo(fileInfo: ProjectFileInfo): EditorFileInfo {
  return {
    fileId: fileInfo.fileId,
    fileName: fileInfo.fileName,
    fileSize: fileInfo.fileSize,
    mimeType: fileInfo.mimeType,
    url: fileInfo.url,
    category: fileInfo.category,
    missing: fileInfo.missing,
  }
}

/**
 * 将项目 FileInfo (from fileUpload.ts) 转换为编辑器 FileInfo
 */
function mapUploadFileInfoToEditor(fileInfo: { fileId: string, fileName: string, fileSize: number, fileType: string, fileUrl: string, category: string }): EditorFileInfo {
  return {
    fileId: fileInfo.fileId,
    fileName: fileInfo.fileName,
    fileSize: fileInfo.fileSize,
    mimeType: fileInfo.fileType,
    url: fileInfo.fileUrl,
    category: fileInfo.category as EditorFileInfo['category'],
  }
}

/**
 * 文件上传适配器
 */
export async function uploadFileHandler(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<EditorFileInfo> {
  const fileInfo = await uploadFile(file, (progress) => {
    onProgress?.(progress.percentage)
  })
  return mapUploadFileInfoToEditor(fileInfo)
}

/**
 * 批量获取文件信息适配器
 */
export async function getFileInfoHandler(fileIds: string[]): Promise<EditorFileInfo[]> {
  const fileInfos = await batchGetFileInfo(fileIds)
  return fileInfos.map(mapToEditorFileInfo)
}

/**
 * 创建 fileHandlers 对象
 */
export function createFileHandlers() {
  return {
    upload: uploadFileHandler,
    getFileInfo: getFileInfoHandler,
  }
}
