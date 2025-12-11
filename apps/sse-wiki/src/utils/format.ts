/**
 * 格式化日期时间
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const now = new Date()
  const diff = now.getTime() - d.getTime()

  // 1分钟内
  if (diff < 60000) {
    return '刚刚'
  }

  // 1小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }

  // 24小时内
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }

  // 7天内
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  }

  // 否则返回完整日期
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

/**
 * 格式化数字（添加千分位）
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化简单日期（仅年月日）
 */
export function formatSimpleDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN')
}

/**
 * 获取用户头像首字母
 */
export function getAvatarFallback(username?: string | null): string {
  return username?.charAt(0).toUpperCase() || 'U'
}

/**
 * 角色标签映射
 */
const ROLE_LABELS: Record<string, string> = {
  owner: '所有者',
  admin: '管理员',
  moderator: '协作者',
  editor: '编辑者',
}

/**
 * 获取角色显示名称
 */
export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role
}

/**
 * 防抖函数
 */
export function useDebounceFn<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer)
      clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
