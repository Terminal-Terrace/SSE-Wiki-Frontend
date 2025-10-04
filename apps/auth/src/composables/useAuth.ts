import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AuthAPI } from '../api/auth'
import { useAuthStore } from '../stores/auth'

const STORAGE_KEY_AUTH_STATE = 'auth_state'
const STORAGE_KEY_REDIRECT_URL = 'redirect_url'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 开始登录流程
   */
  async function startLogin(redirectUrl?: string) {
    try {
      loading.value = true
      error.value = null

      // 获取当前页面作为默认重定向地址
      const currentUrl = redirectUrl || window.location.origin

      // 调用预登录接口
      const { state } = await AuthAPI.prelogin(currentUrl)

      // 存储 state 用于登录页面
      sessionStorage.setItem(STORAGE_KEY_AUTH_STATE, state)
      sessionStorage.setItem(STORAGE_KEY_REDIRECT_URL, currentUrl)

      // 跳转到登录页面
      await router.push({
        name: 'login',
        query: {
          state,
          redirect: encodeURIComponent(currentUrl),
        },
      })
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
   * 执行登录
   */
  async function login(username: string, password: string) {
    try {
      loading.value = true
      error.value = null

      // 从 sessionStorage 获取 state
      const state = sessionStorage.getItem(STORAGE_KEY_AUTH_STATE)
      if (!state) {
        throw new Error('登录状态已过期，请重新登录')
      }

      // 调用登录接口
      const response = await AuthAPI.loginWithPassword(state, username, password)

      // 处理重定向逻辑
      const redirectUrl = response.redirect_url || sessionStorage.getItem(STORAGE_KEY_REDIRECT_URL)

      if (response.refresh_token) {
        // TODO: 存储token！
        authStore.setTokens(response.refresh_token)

        // 清理临时数据
        sessionStorage.removeItem(STORAGE_KEY_AUTH_STATE)
        sessionStorage.removeItem(STORAGE_KEY_REDIRECT_URL)

        if (redirectUrl && redirectUrl !== window.location.origin) {
          // 重定向并携带 refresh_token
          const url = new URL(redirectUrl)
          url.searchParams.set('refresh_token', response.refresh_token)
          window.location.href = url.toString()
        }
        else {
          await router.push('/')
        }
      }
      else if (redirectUrl) {
        // 清理临时数据
        sessionStorage.removeItem(STORAGE_KEY_AUTH_STATE)
        sessionStorage.removeItem(STORAGE_KEY_REDIRECT_URL)

        // 直接重定向
        window.location.href = redirectUrl
      }
      else {
        throw new Error('登录响应缺少必要信息')
      }
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
  function logout() {
    authStore.clearTokens()
    router.push('/login')
  }

  return {
    loading,
    error,
    startLogin,
    login,
    logout,
    isAuthenticated: authStore.isAuthenticated,
  }
}
