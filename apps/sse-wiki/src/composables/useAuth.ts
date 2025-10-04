import { ref } from 'vue'
import { AuthService } from '../services/authService'
import { useAuthStore } from '../stores/auth'

export function useAuth() {
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 开始登录流程
   * 这个方法在点击登录按钮时调用
   */
  async function startLogin() {
    try {
      loading.value = true
      error.value = null

      // 获取当前页面作为重定向地址
      const currentUrl = window.location.href

      // 调用预登录接口获取 state
      const preloginResult = await AuthService.prelogin(currentUrl)
      const state = preloginResult.state || Math.random().toString(36).substring(2, 15)

      // 跳转到认证应用的登录页面
      AuthService.redirectToLogin(state, currentUrl)
    }
    catch (err: any) {
      error.value = err.message || '登录失败'
      console.error('Login error:', err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 处理登录回调
   * 当从认证应用重定向回来时调用
   */
  function handleLoginCallback() {
    const urlParams = new URLSearchParams(window.location.search)
    const refreshToken = urlParams.get('refresh_token')

    if (refreshToken) {
      // 检查是否已经有 token（避免重复处理或退出登录后又设置回去）
      const existingToken = localStorage.getItem('refresh_token')

      // 只有在没有现有 token 或 token 不同时才保存
      if (!existingToken || existingToken !== refreshToken) {
        // 存储 token
        authStore.setTokens(refreshToken)
      }

      // 清理 URL 参数
      const url = new URL(window.location.href)
      url.search = ''
      window.history.replaceState({}, document.title, url.toString())

      return true
    }

    return false
  }

  /**
   * 登出
   */
  function logout() {
    try {
      // 清除本地状态
      authStore.clearTokens()

      // 清除 URL 中的 token 参数（如果有）
      const url = new URL(window.location.href)
      if (url.searchParams.has('refresh_token')) {
        url.searchParams.delete('refresh_token')
      }

      // 跳转到清理后的 URL（这会触发页面刷新）
      window.location.href = url.toString()
    }
    catch {
      // 即使出错也强制清除并重定向到首页
      localStorage.removeItem('refresh_token')
      window.location.href = window.location.origin
    }
  }

  return {
    loading,
    error,
    startLogin,
    handleLoginCallback,
    logout,
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
  }
}
