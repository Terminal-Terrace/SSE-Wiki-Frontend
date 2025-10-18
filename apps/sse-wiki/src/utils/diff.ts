/**
 * Diff 和三方合并工具函数
 * 使用最长公共子序列（LCS）算法实现 diff
 * 实现真正的三方合并算法
 */

/**
 * 格式化 HTML 内容，使其适合进行行级 diff
 * 将压缩的 HTML 标签分散到不同的行
 */
export function formatHTMLForDiff(html: string): string {
  if (!html || html.trim() === '') {
    return html
  }

  // 块级标签列表
  const blockTags = [
    'p',
    'div',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'table',
    'tr',
    'td',
    'th',
    'thead',
    'tbody',
    'section',
    'article',
    'header',
    'footer',
    'nav',
    'aside',
  ]

  let formatted = html

  // 在块级标签前后添加换行符
  for (const tag of blockTags) {
    // 开标签前添加换行（除了第一个）
    formatted = formatted.replace(new RegExp(`(<${tag}[^>]*>)`, 'gi'), '\n$1')
    // 闭标签后添加换行
    formatted = formatted.replace(new RegExp(`(</${tag}>)`, 'gi'), '$1\n')
  }

  // 特殊处理：br 标签后添加换行
  formatted = formatted.replace(/<br\s*\/?>/gi, '<br>\n')

  // 清理多余的空行（保留单个换行）
  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  // 去除首尾空行
  formatted = formatted.trim()

  return formatted
}

/**
 * 反格式化 HTML，移除为 diff 添加的换行
 * 将格式化后的 HTML 还原为压缩格式
 * 保留冲突标记的换行
 */
export function unformatHTMLFromDiff(html: string, preserveConflictMarkers: boolean = false): string {
  if (!html || html.trim() === '') {
    return html
  }

  // 如果包含冲突标记且需要保留，则不压缩
  if (preserveConflictMarkers && html.includes('<<<<<<<')) {
    return html
  }

  // 移除标签之间的换行符（保留标签内的内容）
  let unformatted = html

  // 移除标签前后的换行和空格
  unformatted = unformatted.replace(/\n+/g, '')

  // 清理多余的空格
  unformatted = unformatted.replace(/>\s+</g, '><')

  return unformatted.trim()
}

/**
 * Diff 操作类型
 */
export type DiffType = 'add' | 'delete' | 'unchanged'

/**
 * Diff 结果项
 */
export interface DiffResult {
  type: DiffType
  oldLine: number | null // 旧版本行号（1-based）
  newLine: number | null // 新版本行号（1-based）
  oldContent: string
  newContent: string
}

/**
 * 三方合并结果
 */
export interface ThreeWayMergeResult {
  merged: string // 合并后的内容
  hasConflict: boolean // 是否有冲突
  conflicts: Array<{
    start: number // 冲突开始行号
    end: number // 冲突结束行号
  }>
}

/**
 * 计算最长公共子序列（LCS）的长度表
 * 使用动态规划算法
 */
function computeLCS(oldLines: string[], newLines: string[]): number[][] {
  const m = oldLines.length
  const n = newLines.length
  const lcs: number[][] = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        lcs[i]![j] = (lcs[i - 1]?.[j - 1] ?? 0) + 1
      }
      else {
        lcs[i]![j] = Math.max(lcs[i - 1]?.[j] ?? 0, lcs[i]?.[j - 1] ?? 0)
      }
    }
  }

  return lcs
}

/**
 * 使用 LCS 算法计算两个文本的 diff
 * 这是一个类似 Myers diff 的实现
 * 对于 HTML 内容，会先进行格式化以便进行行级比较
 */
export function computeDiff(oldContent: string | null, newContent: string): DiffResult[] {
  // 检测是否为 HTML 内容（简单判断：包含 HTML 标签）
  const isHTML = /<[^>]+>/.test(newContent) || (oldContent && /<[^>]+>/.test(oldContent))

  // 如果是 HTML，先格式化
  let processedOldContent = oldContent
  let processedNewContent = newContent

  if (isHTML) {
    processedOldContent = oldContent ? formatHTMLForDiff(oldContent) : null
    processedNewContent = formatHTMLForDiff(newContent)
  }

  // 如果没有旧内容，所有新内容都是新增
  if (!processedOldContent) {
    const newLines = processedNewContent.split('\n')
    return newLines.map((line, index) => ({
      type: 'add' as const,
      oldLine: null,
      newLine: index + 1,
      oldContent: '',
      newContent: line,
    }))
  }

  const oldLines = processedOldContent.split('\n')
  const newLines = processedNewContent.split('\n')

  // 计算 LCS 表
  const lcs = computeLCS(oldLines, newLines)

  // 回溯 LCS 表来构建 diff
  const result: DiffResult[] = []
  let i = oldLines.length
  let j = newLines.length

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      // 相同的行
      result.unshift({
        type: 'unchanged',
        oldLine: i,
        newLine: j,
        oldContent: oldLines[i - 1] || '',
        newContent: newLines[j - 1] || '',
      })
      i--
      j--
    }
    else if (j > 0 && (i === 0 || (lcs[i]?.[j - 1] ?? 0) >= (lcs[i - 1]?.[j] ?? 0))) {
      // 新增行
      result.unshift({
        type: 'add',
        oldLine: null,
        newLine: j,
        oldContent: '',
        newContent: newLines[j - 1] || '',
      })
      j--
    }
    else if (i > 0) {
      // 删除行
      result.unshift({
        type: 'delete',
        oldLine: i,
        newLine: null,
        oldContent: oldLines[i - 1] || '',
        newContent: '',
      })
      i--
    }
  }

  return result
}

/**
 * 三方合并算法（简化版）
 * 逐行比较，识别冲突
 * @param base 基础版本
 * @param theirs 提交者的版本
 * @param ours 当前版本
 * @returns 合并结果
 */
export function threeWayMerge(
  base: string,
  theirs: string,
  ours: string,
): ThreeWayMergeResult {
  // 检测是否为 HTML 内容
  const isHTML = /<[^>]+>/.test(base) || /<[^>]+>/.test(theirs) || /<[^>]+>/.test(ours)

  // 如果是 HTML，先格式化
  let processedBase = base
  let processedTheirs = theirs
  let processedOurs = ours

  if (isHTML) {
    processedBase = formatHTMLForDiff(base)
    processedTheirs = formatHTMLForDiff(theirs)
    processedOurs = formatHTMLForDiff(ours)
  }

  // 计算 base -> theirs 的变更
  const theirsDiff = computeDiff(processedBase, processedTheirs)

  // 计算 base -> ours 的变更
  const oursDiff = computeDiff(processedBase, processedOurs)

  const baseLines = processedBase.split('\n')
  const mergedLines: string[] = []
  const conflicts: Array<{ start: number, end: number }> = []
  let hasConflict = false

  // 建立行号映射：记录每个 base 行在 theirs 和 ours 中的对应行
  const theirsMap = new Map<number, string>() // baseLineNum -> theirsContent
  const oursMap = new Map<number, string>() // baseLineNum -> oursContent

  // 处理 theirs 的映射
  for (const diff of theirsDiff) {
    if (diff.oldLine && diff.type !== 'add') {
      theirsMap.set(diff.oldLine, diff.newContent)
    }
  }

  // 处理 ours 的映射
  for (const diff of oursDiff) {
    if (diff.oldLine && diff.type !== 'add') {
      oursMap.set(diff.oldLine, diff.newContent)
    }
  }

  // 逐行合并
  for (let i = 0; i < baseLines.length; i++) {
    const lineNum = i + 1
    const baseLine = baseLines[i]

    const theirsLine = theirsMap.get(lineNum)
    const oursLine = oursMap.get(lineNum)
    const theirsChanged = theirsLine !== undefined
    const oursChanged = oursLine !== undefined

    // 检查是否有冲突
    if (theirsChanged && oursChanged) {
      // 两边都修改了同一行
      if (theirsLine === oursLine) {
        // 修改相同，不是冲突，使用共同的修改
        mergedLines.push(theirsLine)
      }
      else {
        // 修改不同 -> 冲突
        hasConflict = true
        const conflictStart = mergedLines.length

        mergedLines.push('<<<<<<< THEIRS (提交者的修改)')
        mergedLines.push(theirsLine)
        mergedLines.push('=======')
        mergedLines.push(oursLine)
        mergedLines.push('>>>>>>> OURS (当前线上版本)')

        conflicts.push({ start: conflictStart, end: mergedLines.length - 1 })
      }
    }
    else if (theirsChanged) {
      // 只有 theirs 修改了
      mergedLines.push(theirsLine)
    }
    else if (oursChanged) {
      // 只有 ours 修改了
      mergedLines.push(oursLine)
    }
    else {
      // 两边都没改，保留原行
      if (baseLine !== undefined) {
        mergedLines.push(baseLine)
      }
    }
  }

  const mergedText = mergedLines.join('\n')

  // 如果是 HTML，需要移除格式化添加的换行，恢复压缩格式
  // 但如果有冲突，保留冲突标记的换行
  const finalMerged = isHTML ? unformatHTMLFromDiff(mergedText, hasConflict) : mergedText

  return {
    merged: finalMerged,
    hasConflict,
    conflicts,
  }
}

/**
 * 简单的三方合并（用于整体内容不同的情况）
 * 这是一个回退方案，当无法进行智能合并时使用
 */
export function simpleThreeWayMerge(
  base: string,
  theirs: string,
  ours: string,
): string {
  // 如果 theirs === base，说明提交者没有修改，使用 ours
  if (theirs === base) {
    return ours
  }

  // 如果 ours === base，说明当前版本没有修改，使用 theirs
  if (ours === base) {
    return theirs
  }

  // 如果 theirs === ours，说明两边修改相同，没有冲突
  if (theirs === ours) {
    return theirs
  }

  // 否则，返回带冲突标记的内容
  let result = ''
  result += '<<<<<<< THEIRS (提交者的修改)\n'
  result += theirs
  if (!theirs.endsWith('\n')) {
    result += '\n'
  }
  result += '=======\n'
  result += ours
  if (!ours.endsWith('\n')) {
    result += '\n'
  }
  result += '>>>>>>> OURS (当前线上版本)\n'

  return result
}
