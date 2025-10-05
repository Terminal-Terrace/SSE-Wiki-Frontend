import type { User } from '../types/auth'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)

  // 方法
  function setUser(userData: User) {
    user.value = userData
  }

  function clearUser() {
    user.value = null
  }

  // 兼容旧代码的空方法
  function setTokens(_refresh: string, _access: string) {
    // Token 现在通过 HttpOnly Cookie 管理，无需前端存储
    console.warn('setTokens is deprecated: tokens are now managed via HttpOnly cookies')
  }

  function clearTokens() {
    // 清除用户信息即可
    clearUser()
  }

  return {
    // 状态
    user,
    // 计算属性（暂时保留兼容性）
    isAuthenticated: ref(false),
    // 方法
    setTokens,
    clearTokens,
    setUser,
    clearUser,
  }
})
