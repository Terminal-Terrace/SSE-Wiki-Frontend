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
  if (!html) {
    return html
  }

  // 如果只包含换行符，移除后返回空字符串
  if (html.trim() === '' && html.includes('\n')) {
    return ''
  }

  // 如果只包含空格（没有换行），保持原样
  if (html.trim() === '' && !html.includes('\n')) {
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
 * 内部版本的 computeDiff，跳过格式化步骤（用于 threeWayMerge）
 */
function computeDiffInternal(
  oldContent: string | null,
  newContent: string,
  skipFormatting: boolean,
): DiffResult[] {
  // 如果跳过格式化，直接使用传入的内容
  let processedOldContent = oldContent
  let processedNewContent = newContent

  if (!skipFormatting) {
    // 检测是否为 HTML 内容（简单判断：包含 HTML 标签）
    const isHTML = /<[^>]+>/.test(newContent) || (oldContent && /<[^>]+>/.test(oldContent))

    // 如果是 HTML，先格式化
    if (isHTML) {
      processedOldContent = oldContent ? formatHTMLForDiff(oldContent) : null
      processedNewContent = formatHTMLForDiff(newContent)
    }
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
 * 使用 LCS 算法计算两个文本的 diff
 * 这是一个类似 Myers diff 的实现
 * 对于 HTML 内容，会先进行格式化以便进行行级比较
 */
export function computeDiff(oldContent: string | null, newContent: string): DiffResult[] {
  return computeDiffInternal(oldContent, newContent, false)
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
  // 如果输入存在缺失/空内容，避免行级合并产生大量伪冲突，直接回退为整体冲突块
  const safeBase = base ?? ''
  const safeTheirs = theirs ?? ''
  const safeOurs = ours ?? ''
  const hasEmptyInput = [safeBase, safeTheirs, safeOurs].some(v => v.trim() === '')
  // 如果任何输入为空（trim后），且不是所有输入都为空，则回退到简单合并
  if (hasEmptyInput && !(safeBase.trim() === '' && safeTheirs.trim() === '' && safeOurs.trim() === '')) {
    const merged = simpleThreeWayMerge(safeBase, safeTheirs, safeOurs)
    return {
      merged,
      hasConflict: merged.includes('<<<<<<<'),
      conflicts: [],
    }
  }
  // 如果所有输入都为空，也回退到简单合并
  if (safeBase.trim() === '' && safeTheirs.trim() === '' && safeOurs.trim() === '') {
    const merged = simpleThreeWayMerge(safeBase, safeTheirs, safeOurs)
    return {
      merged,
      hasConflict: merged.includes('<<<<<<<'),
      conflicts: [],
    }
  }

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
  // 注意：我们已经格式化过了，所以跳过 computeDiff 内部的格式化
  const theirsDiff = computeDiffInternal(processedBase, processedTheirs, isHTML)
  const oursDiff = computeDiffInternal(processedBase, processedOurs, isHTML)

  const baseLines = processedBase.split('\n')
  const mergedLines: string[] = []
  const conflicts: Array<{ start: number, end: number }> = []
  let hasConflict = false

  // 建立行号映射：记录每个 base 行在 theirs 和 ours 中的对应行
  const theirsMap = new Map<number, string>() // baseLineNum -> theirsContent
  const oursMap = new Map<number, string>() // baseLineNum -> oursContent
  const theirsDeleted = new Set<number>() // baseLineNum -> deleted
  const oursDeleted = new Set<number>() // baseLineNum -> deleted

  // 处理 theirs 的映射
  // 先识别修改操作（delete 后紧跟 add，且位置对应）
  const theirsModifications = new Map<number, string>() // oldLine -> newContent
  for (let i = 0; i < theirsDiff.length; i++) {
    const diff = theirsDiff[i]
    if (!diff)
      continue
    if (diff.type === 'delete' && diff.oldLine) {
      // 检查下一个是否是 add，且位置对应（这是修改操作）
      const nextDiff = theirsDiff[i + 1]
      if (nextDiff && nextDiff.type === 'add') {
        // 这是修改操作，不是真正的删除
        theirsModifications.set(diff.oldLine, nextDiff.newContent)
        i++ // 跳过下一个 add
        continue
      }
      // 真正的删除
      theirsDeleted.add(diff.oldLine)
    }
    // unchanged 操作不添加到 Map 中，因为表示没有修改
  }

  // 将修改操作添加到映射中
  for (const [oldLine, newContent] of theirsModifications) {
    theirsMap.set(oldLine, newContent)
  }

  // 处理 ours 的映射
  const oursModifications = new Map<number, string>() // oldLine -> newContent
  for (let i = 0; i < oursDiff.length; i++) {
    const diff = oursDiff[i]
    if (!diff)
      continue
    if (diff.type === 'delete' && diff.oldLine) {
      // 检查下一个是否是 add，且位置对应（这是修改操作）
      const nextDiff = oursDiff[i + 1]
      if (nextDiff && nextDiff.type === 'add') {
        // 这是修改操作，不是真正的删除
        oursModifications.set(diff.oldLine, nextDiff.newContent)
        i++ // 跳过下一个 add
        continue
      }
      // 真正的删除
      oursDeleted.add(diff.oldLine)
    }
    // unchanged 操作不添加到 Map 中，因为表示没有修改
  }

  // 将修改操作添加到映射中
  for (const [oldLine, newContent] of oursModifications) {
    oursMap.set(oldLine, newContent)
  }

  // 收集新增的行（在 base 之后插入）
  // 只收集那些不是修改操作一部分的 add
  const theirsAdditions: Array<{ afterLine: number, content: string }> = []
  const oursAdditions: Array<{ afterLine: number, content: string }> = []

  let currentBaseLine = 0
  for (let i = 0; i < theirsDiff.length; i++) {
    const diff = theirsDiff[i]
    if (!diff)
      continue
    if (diff.type === 'add') {
      // 检查这是否是修改操作的一部分
      const prevDiff = i > 0 ? theirsDiff[i - 1] : undefined
      if (prevDiff && prevDiff.type === 'delete' && prevDiff.oldLine) {
        // 这是修改操作的一部分，跳过
        continue
      }
      // 真正的新增行
      theirsAdditions.push({ afterLine: currentBaseLine, content: diff.newContent })
    }
    else if (diff.type === 'unchanged' && diff.oldLine) {
      currentBaseLine = diff.oldLine
    }
    else if (diff.type === 'delete' && diff.oldLine) {
      // 检查下一个是否是 add（修改操作）
      const nextDiff = theirsDiff[i + 1]
      if (nextDiff && nextDiff.type === 'add') {
        // 这是修改操作，跳过 add
        i++
      }
      currentBaseLine = diff.oldLine
    }
  }

  currentBaseLine = 0
  for (let i = 0; i < oursDiff.length; i++) {
    const diff = oursDiff[i]
    if (!diff)
      continue
    if (diff.type === 'add') {
      // 检查这是否是修改操作的一部分
      const prevDiff = i > 0 ? oursDiff[i - 1] : undefined
      if (prevDiff && prevDiff.type === 'delete' && prevDiff.oldLine) {
        // 这是修改操作的一部分，跳过
        continue
      }
      // 真正的新增行
      oursAdditions.push({ afterLine: currentBaseLine, content: diff.newContent })
    }
    else if (diff.type === 'unchanged' && diff.oldLine) {
      currentBaseLine = diff.oldLine
    }
    else if (diff.type === 'delete' && diff.oldLine) {
      // 检查下一个是否是 add（修改操作）
      const nextDiff = oursDiff[i + 1]
      if (nextDiff && nextDiff.type === 'add') {
        // 这是修改操作，跳过 add
        i++
      }
      currentBaseLine = diff.oldLine
    }
  }

  // 逐行合并 base 中的行
  for (let i = 0; i < baseLines.length; i++) {
    const lineNum = i + 1
    const baseLine = baseLines[i]

    // 检查是否有新增的行需要插入
    const theirsAddsHere = theirsAdditions.filter(a => a.afterLine === lineNum - 1)
    const oursAddsHere = oursAdditions.filter(a => a.afterLine === lineNum - 1)

    // 处理新增行的冲突
    if (theirsAddsHere.length > 0 && oursAddsHere.length > 0) {
      // 两边都在这里新增，需要检查是否相同
      const theirsContent = theirsAddsHere.map(a => a.content).join('\n')
      const oursContent = oursAddsHere.map(a => a.content).join('\n')
      if (theirsContent === oursContent) {
        // 新增内容相同，无冲突
        mergedLines.push(...theirsAddsHere.map(a => a.content))
      }
      else {
        // 新增内容不同，冲突
        hasConflict = true
        const conflictStart = mergedLines.length
        mergedLines.push('<<<<<<< THEIRS (提交者的修改)')
        mergedLines.push(...theirsAddsHere.map(a => a.content))
        mergedLines.push('=======')
        mergedLines.push(...oursAddsHere.map(a => a.content))
        mergedLines.push('>>>>>>> OURS (当前线上版本)')
        conflicts.push({ start: conflictStart, end: mergedLines.length - 1 })
      }
    }
    else if (theirsAddsHere.length > 0) {
      // 只有 theirs 新增
      mergedLines.push(...theirsAddsHere.map(a => a.content))
    }
    else if (oursAddsHere.length > 0) {
      // 只有 ours 新增
      mergedLines.push(...oursAddsHere.map(a => a.content))
    }

    // 处理当前 base 行
    const theirsLine = theirsMap.get(lineNum)
    const oursLine = oursMap.get(lineNum)
    const theirsDeletedThis = theirsDeleted.has(lineNum)
    const oursDeletedThis = oursDeleted.has(lineNum)

    // 检查是否有冲突
    if (theirsDeletedThis && oursDeletedThis) {
      // 两边都删除，不添加该行
      continue
    }
    else if (theirsDeletedThis && !oursDeletedThis) {
      // 只有 theirs 删除
      if (oursLine !== undefined) {
        // ours 修改了该行，产生冲突（一边删除，一边修改）
        hasConflict = true
        const conflictStart = mergedLines.length
        mergedLines.push('<<<<<<< THEIRS (提交者的修改)')
        // theirs 删除，所以这里是空的
        mergedLines.push('=======')
        mergedLines.push(oursLine)
        mergedLines.push('>>>>>>> OURS (当前线上版本)')
        conflicts.push({ start: conflictStart, end: mergedLines.length - 1 })
      }
      else {
        // ours 没有修改，采用删除操作
        continue
      }
    }
    else if (!theirsDeletedThis && oursDeletedThis) {
      // 只有 ours 删除
      if (theirsLine !== undefined) {
        // theirs 修改了该行，产生冲突（一边删除，一边修改）
        hasConflict = true
        const conflictStart = mergedLines.length
        mergedLines.push('<<<<<<< THEIRS (提交者的修改)')
        mergedLines.push(theirsLine)
        mergedLines.push('=======')
        // ours 删除，所以这里是空的
        mergedLines.push('>>>>>>> OURS (当前线上版本)')
        conflicts.push({ start: conflictStart, end: mergedLines.length - 1 })
      }
      else {
        // theirs 没有修改，采用删除操作
        continue
      }
    }
    else if (theirsLine !== undefined && oursLine !== undefined) {
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
    else if (theirsLine !== undefined) {
      // 只有 theirs 修改了
      mergedLines.push(theirsLine)
    }
    else if (oursLine !== undefined) {
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

  // 处理在 base 末尾之后的新增行
  const theirsAddsAfterEnd = theirsAdditions.filter(a => a.afterLine >= baseLines.length)
  const oursAddsAfterEnd = oursAdditions.filter(a => a.afterLine >= baseLines.length)

  if (theirsAddsAfterEnd.length > 0 && oursAddsAfterEnd.length > 0) {
    const theirsContent = theirsAddsAfterEnd.map(a => a.content).join('\n')
    const oursContent = oursAddsAfterEnd.map(a => a.content).join('\n')
    if (theirsContent === oursContent) {
      mergedLines.push(...theirsAddsAfterEnd.map(a => a.content))
    }
    else {
      hasConflict = true
      const conflictStart = mergedLines.length
      mergedLines.push('<<<<<<< THEIRS (提交者的修改)')
      mergedLines.push(...theirsAddsAfterEnd.map(a => a.content))
      mergedLines.push('=======')
      mergedLines.push(...oursAddsAfterEnd.map(a => a.content))
      mergedLines.push('>>>>>>> OURS (当前线上版本)')
      conflicts.push({ start: conflictStart, end: mergedLines.length - 1 })
    }
  }
  else if (theirsAddsAfterEnd.length > 0) {
    mergedLines.push(...theirsAddsAfterEnd.map(a => a.content))
  }
  else if (oursAddsAfterEnd.length > 0) {
    mergedLines.push(...oursAddsAfterEnd.map(a => a.content))
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
  // 如果所有输入都为空，返回空字符串（无冲突）
  if (base === '' && theirs === '' && ours === '') {
    return ''
  }

  // 如果 theirs === ours，说明两边修改相同，没有冲突
  if (theirs === ours) {
    return theirs
  }

  // 如果 base 不为空，但 theirs 和 ours 都为空，说明两边都删除了相同内容，无冲突
  if (base !== '' && theirs === '' && ours === '') {
    return ''
  }

  // 如果 base 为空，且 theirs 和 ours 不同，产生冲突
  if (base === '' && theirs !== ours) {
    // 继续到冲突标记生成
  }
  // 如果 theirs === base，说明提交者没有修改，使用 ours
  else if (theirs === base) {
    return ours
  }
  // 如果 ours === base，说明当前版本没有修改，使用 theirs
  else if (ours === base) {
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
