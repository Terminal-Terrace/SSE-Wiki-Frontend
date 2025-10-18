import { toast } from '@sse-wiki/ui'
import { useAuthStore } from '@/stores/auth'
import { useAuth } from './useAuth'

/**
 * 登录重定向 Composable
 *
 * 提供统一的登录检查和重定向功能
 *
 * @example
 * ```ts
 * const { requireLogin, startLogin } = useLoginRedirect()
 *
 * // 方式1: 检查并重定向（带 toast 提示）
 * if (!requireLogin('创建文章需要登录')) {
 *   return // 未登录，已自动重定向
 * }
 *
 * // 方式2: 直接调用登录
 * await startLogin()
 * ```
 */
export function useLoginRedirect() {
  const authStore = useAuthStore()
  const { startLogin, loading, error } = useAuth()

  /**
   * 检查登录状态，如果未登录则显示提示并重定向到登录页
   *
   * @param message - 提示消息（可选）
   * @param description - 提示详情（可选）
   * @returns true 表示已登录，false 表示未登录（已触发重定向）
   */
  function requireLogin(message?: string, description?: string): boolean {
    if (authStore.isAuthenticated) {
      return true
    }

    // 显示提示
    toast({
      title: message || '请先登录',
      description: description || '登录后才能继续操作',
      variant: 'destructive',
    })

    // 延迟重定向，让用户看到提示
    setTimeout(() => {
      startLogin()
    }, 1000)

    return false
  }

  /**
   * 静默检查登录状态（不显示提示，不重定向）
   *
   * @returns true 表示已登录，false 表示未登录
   */
  function checkLogin(): boolean {
    return authStore.isAuthenticated
  }

  /**
   * 立即重定向到登录页（不显示提示）
   */
  async function redirectToLogin() {
    await startLogin()
  }

  return {
    /**
     * 检查是否已登录
     */
    isAuthenticated: authStore.isAuthenticated,

    /**
     * 当前用户信息
     */
    user: authStore.user,

    /**
     * 是否正在加载
     */
    loading,

    /**
     * 错误信息
     */
    error,

    /**
     * 检查登录状态并在未登录时重定向（带提示）
     */
    requireLogin,

    /**
     * 静默检查登录状态（不提示、不重定向）
     */
    checkLogin,

    /**
     * 立即开始登录流程（调用 preLogin + 重定向）
     */
    startLogin,

    /**
     * 立即重定向到登录页（别名，更语义化）
     */
    redirectToLogin,
  }
}
