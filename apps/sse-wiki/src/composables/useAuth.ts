import { ref } from 'vue'
import { AuthAPI } from '../services/authApi'
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
      const preLoginResult = await AuthAPI.preLogin(currentUrl)
      const state = preLoginResult.state || Math.random().toString(36).substring(2, 15)

      // 跳转到认证应用的登录页面
      AuthAPI.redirectToLogin(state, currentUrl)
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
   * 登出
   */
  async function logout() {
    try {
      // 调用后端退出登录接口，清除 Cookie
      await AuthAPI.logout()
    }
    catch (error) {
      console.error('Logout error:', error)
      // 即使后端退出失败，也继续清除前端状态
    }
    finally {
      // 清除前端用户信息
      authStore.clearUser()
      authStore.hasChecked = false

      // 跳转到首页
      window.location.href = window.location.origin
    }
  }

  return {
    loading,
    error,
    startLogin,
    logout,
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user,
  }
}
