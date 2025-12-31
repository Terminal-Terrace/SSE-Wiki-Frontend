/**
 * 内容水合工具
 * 将包含占位符的纯文本内容转换为包含完整文件卡片的富文本
 */
import type { FileInfo } from '../types'
import { fileInfoCache } from './fileInfoCache'
import { extractFileIds, parsePlaceholders } from './filePlaceholder'

/**
 * 从 MIME 类型获取文件分类
 */
function getCategoryFromMimeType(mimeType: string): FileInfo['category'] {
  if (mimeType.startsWith('image/'))
    return 'image'
  if (mimeType.startsWith('video/'))
    return 'video'
  if (mimeType.startsWith('audio/'))
    return 'audio'
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('powerpoint'))
    return 'document'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gzip'))
    return 'archive'
  if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('python') || mimeType.includes('java') || mimeType.includes('c++') || mimeType.includes('c#') || mimeType.includes('go') || mimeType.includes('rust') || mimeType.includes('php') || mimeType.includes('ruby') || mimeType.includes('swift') || mimeType.includes('kotlin') || mimeType.includes('shell') || mimeType.includes('bash') || mimeType.includes('sql'))
    return 'code'
  return 'other'
}

/**
 * 水合内容：将占位符替换为 file-card 节点
 * 使用缓存避免重复请求已获取的文件信息
 * @param content 包含占位符的内容
 * @param getFileInfo 批量获取文件信息的函数（可选）
 * @returns 水合后的内容（包含 file-card HTML）
 */
export async function hydrateContent(
  content: string,
  getFileInfo?: (fileIds: string[]) => Promise<FileInfo[]>,
): Promise<string> {
  // 如果没有提供 getFileInfo，直接返回原始内容
  if (!getFileInfo) {
    return content
  }

  // 1. 提取所有文件ID
  const fileIds = extractFileIds(content)

  if (fileIds.length === 0) {
    return content
  }

  try {
    // 2. 检查缓存，找出需要请求的文件ID
    const cachedInfoMap = fileInfoCache.getMany(fileIds)
    const uncachedIds = fileIds.filter(id => !cachedInfoMap.has(id))

    // 3. 只请求缓存中不存在的文件ID
    let newFileInfoList: FileInfo[] = []
    if (uncachedIds.length > 0) {
      newFileInfoList = await getFileInfo(uncachedIds)

      // 4. 将新获取的文件信息存入缓存
      for (const fileInfo of newFileInfoList) {
        if (fileInfo?.fileId) {
          fileInfoCache.set(fileInfo.fileId, fileInfo)
        }
      }
    }

    // 5. 合并缓存和新获取的文件信息
    const fileInfoMap = new Map<string, FileInfo>(cachedInfoMap)
    for (const fileInfo of newFileInfoList) {
      if (fileInfo?.fileId) {
        fileInfoMap.set(fileInfo.fileId, fileInfo)
      }
    }

    // 6. 解析所有占位符
    const placeholders = parsePlaceholders(content)

    // 7. 替换占位符为 file-card HTML
    let hydratedContent = content

    // 从后往前替换，避免索引偏移问题
    for (let i = placeholders.length - 1; i >= 0; i--) {
      const placeholder = placeholders[i]
      if (!placeholder)
        continue

      const fileInfo = fileInfoMap.get(placeholder.id)

      let replacement: string

      if (!fileInfo || fileInfo.missing) {
        // 文件不存在或已失效，创建失效占位符（仍然保留布局信息，避免版式完全崩掉）
        replacement = createMissingFileCard(placeholder.id, placeholder.name, {
          width: placeholder.width,
          height: placeholder.height,
          align: placeholder.align,
        })
      }
      else {
        // 文件存在，创建正常的 file-card
        replacement = createFileCard(fileInfo, {
          width: placeholder.width,
          height: placeholder.height,
          align: placeholder.align,
        })
      }

      // 替换占位符
      hydratedContent
        = hydratedContent.substring(0, placeholder.index)
          + replacement
          + hydratedContent.substring(placeholder.index + placeholder.match.length)
    }

    return hydratedContent
  }
  catch (error) {
    console.error('Failed to hydrate content:', error)
    // 如果水合失败，返回原始内容
    return content
  }
}

/**
 * 创建 file-card HTML 标签
 */
function createFileCard(
  fileInfo: FileInfo,
  layout?: { width?: number | undefined, height?: number | undefined, align?: 'left' | 'center' | 'right' | undefined },
): string {
  const category = fileInfo.category || getCategoryFromMimeType(fileInfo.mimeType)

  const layoutAttrs: string[] = []
  if (layout?.width)
    layoutAttrs.push(`data-width="${layout.width}"`)
  if (layout?.height)
    layoutAttrs.push(`data-height="${layout.height}"`)
  if (layout?.align)
    layoutAttrs.push(`data-align="${layout.align}"`)

  const layoutStr = layoutAttrs.length ? ` ${layoutAttrs.join(' ')}` : ''

  return `<file-card data-file-id="${escapeHtml(fileInfo.fileId)}" data-file-name="${escapeHtml(fileInfo.fileName)}" data-file-size="${fileInfo.fileSize}" data-file-type="${escapeHtml(fileInfo.mimeType)}" data-file-url="${escapeHtml(fileInfo.url)}" data-category="${category}"${layoutStr}></file-card>`
}

/**
 * 创建失效文件的占位符
 */
function createMissingFileCard(
  fileId: string,
  fileName: string,
  layout?: { width?: number | undefined, height?: number | undefined, align?: 'left' | 'center' | 'right' | undefined },
): string {
  const layoutAttrs: string[] = []
  if (layout?.width)
    layoutAttrs.push(`data-width="${layout.width}"`)
  if (layout?.height)
    layoutAttrs.push(`data-height="${layout.height}"`)
  if (layout?.align)
    layoutAttrs.push(`data-align="${layout.align}"`)

  const layoutStr = layoutAttrs.length ? ` ${layoutAttrs.join(' ')}` : ''

  return `<file-card data-file-id="${escapeHtml(fileId)}" data-file-name="${escapeHtml(fileName)}" data-file-size="0" data-file-type="unknown" data-file-url="" data-category="other" data-missing="true"${layoutStr}></file-card>`
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
