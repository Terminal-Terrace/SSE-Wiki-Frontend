/**
 * 文件占位符工具函数
 * 用于在富文本编辑器中处理文件引用的纯文本占位符
 * 格式:
 * - 基础: {{file:ID:NAME}}
 * - 扩展: {{file:ID:NAME|w=800,h=450,align=center}}
 */

export interface FilePlaceholder {
  id: string
  name: string
  match: string // 完整的占位符字符串
  index: number // 在内容中的位置
  width?: number
  height?: number
  align?: 'left' | 'center' | 'right'
}

/**
 * 创建文件占位符
 * @param fileId 文件ID
 * @param fileName 文件名
 * @param options 可选的布局信息（宽高、对齐）
 * @param options.width 宽度（可选）
 * @param options.height 高度（可选）
 * @param options.align 对齐方式（可选）
 * @returns 占位符字符串，格式: {{file:ID:NAME|w=...,h=...,align=...}}
 */
export function createPlaceholder(
  fileId: string,
  fileName: string,
  options?: { width?: number | null, height?: number | null, align?: 'left' | 'center' | 'right' | null },
): string {
  // 对文件名中的特殊字符进行转义，避免破坏占位符格式
  const escapedName = fileName.replace(/:/g, '&#58;').replace(/\}\}/g, '&#125;&#125;')

  const parts: string[] = []
  if (options) {
    const { width, height, align } = options
    if (typeof width === 'number' && Number.isFinite(width))
      parts.push(`w=${Math.round(width)}`)
    if (typeof height === 'number' && Number.isFinite(height))
      parts.push(`h=${Math.round(height)}`)
    if (align && ['left', 'center', 'right'].includes(align))
      parts.push(`align=${align}`)
  }

  const layout = parts.length > 0 ? `|${parts.join(',')}` : ''

  return `{{file:${fileId}:${escapedName}${layout}}}`
}

/**
 * 解析内容中的所有文件占位符
 * @param content 富文本内容
 * @returns 占位符信息数组
 */
export function parsePlaceholders(content: string): FilePlaceholder[] {
  const placeholders: FilePlaceholder[] = []
  // 匹配格式:
  // - {{file:ID:NAME}}
  // - {{file:ID:NAME|w=800,h=450,align=center}}
  const regex = /\{\{file:([^:}]+):([^|}]+)(?:\|([^}]+))?\}\}/g
  let match: RegExpExecArray | null = regex.exec(content)

  while (match !== null) {
    const fullMatch = match[0]
    const id = match[1]
    const escapedName = match[2]
    const layoutRaw = match[3]

    if (!id || !escapedName) {
      match = regex.exec(content)
      continue
    }

    // 还原转义的文件名
    const name = escapedName
      .replace(/&#58;/g, ':')
      .replace(/&#125;&#125;/g, '}}')

    let width: number | undefined
    let height: number | undefined
    let align: 'left' | 'center' | 'right' | undefined

    if (layoutRaw) {
      const segments = layoutRaw.split(',')
      for (const seg of segments) {
        const [k, v] = seg.split('=')
        if (!k || v == null)
          continue

        if (k === 'w') {
          const n = Number(v)
          if (Number.isFinite(n) && n > 0)
            width = n
        }
        else if (k === 'h') {
          const n = Number(v)
          if (Number.isFinite(n) && n > 0)
            height = n
        }
        else if (k === 'align' && (v === 'left' || v === 'center' || v === 'right')) {
          align = v
        }
      }
    }

    placeholders.push({
      id,
      name,
      match: fullMatch,
      index: match.index!,
      width,
      height,
      align,
    })

    match = regex.exec(content)
  }

  return placeholders
}

/**
 * 替换内容中的单个占位符
 * @param content 富文本内容
 * @param fileId 要替换的文件ID
 * @param replacement 替换内容（可以是HTML字符串或其他占位符）
 * @returns 替换后的内容
 */
export function replacePlaceholder(
  content: string,
  fileId: string,
  replacement: string,
): string {
  // 匹配特定文件ID的占位符
  const regex = new RegExp(`\\{\\{file:${fileId}:[^}]+\\}\\}`, 'g')
  return content.replace(regex, replacement)
}

/**
 * 从占位符中提取所有文件ID
 * @param content 富文本内容
 * @returns 文件ID数组（去重）
 */
export function extractFileIds(content: string): string[] {
  const placeholders = parsePlaceholders(content)
  const ids = placeholders.map(p => p.id)
  // 去重
  return Array.from(new Set(ids))
}

/**
 * 验证占位符格式是否正确
 * @param placeholder 占位符字符串
 * @returns 是否为有效的占位符
 */
export function isValidPlaceholder(placeholder: string): boolean {
  const regex = /^\{\{file:[^:]+:[^}]+\}\}$/
  return regex.test(placeholder)
}
