import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { AuthAPI } from '../services/authApi'

export interface User {
  id: number
  username: string
  email?: string
  avatar?: string
  role?: string
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const hasChecked = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 方法
  function setUser(userData: User) {
    user.value = userData
  }

  function clearUser() {
    user.value = null
  }

  /**
   * 检查登录状态
   * 调用 /auth/me 接口获取用户信息
   */
  async function checkLoginStatus() {
    try {
      const userInfo = await AuthAPI.getMe()
      // 将后端返回的 user_id 转换为 id
      user.value = {
        id: userInfo.user_id,
        username: userInfo.username,
        email: userInfo.email,
        role: userInfo.role,
      }
      hasChecked.value = true
      return true
    }
    catch {
      // 401 表示未登录或 token 过期
      user.value = null
      hasChecked.value = true
      return false
    }
  }

  // 兼容旧代码的空方法
  function setTokens(_refresh: string, _access: string) {
    // Token 现在通过 HttpOnly Cookie 管理，无需前端存储
    console.warn('setTokens is deprecated: tokens are now managed via HttpOnly cookies')
  }

  function clearTokens() {
    // 清除用户信息
    clearUser()
    // 清除旧的 localStorage token（如果有的话）
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  // 兼容旧的方法名
  const setToken = setTokens
  const clearToken = clearTokens

  return {
    // 状态
    user,
    hasChecked,
    // 计算属性
    isAuthenticated,
    isAdmin,
    // 方法
    setTokens,
    clearTokens,
    setToken,
    clearToken,
    setUser,
    clearUser,
    checkLoginStatus,
  }
})
