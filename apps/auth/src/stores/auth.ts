import type { User } from '../types/auth'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const STORAGE_KEY_REFRESH_TOKEN = 'refresh_token'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const refreshToken = ref<string | null>(
    localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN),
  )
  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!refreshToken.value)

  // 方法
  function setTokens(refresh: string, access?: string) {
    refreshToken.value = refresh
    accessToken.value = access || null
    localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, refresh)
  }

  function clearTokens() {
    refreshToken.value = null
    accessToken.value = null
    user.value = null
    localStorage.removeItem(STORAGE_KEY_REFRESH_TOKEN)
  }

  function setUser(userData: User) {
    user.value = userData
  }

  return {
    // 状态
    refreshToken,
    accessToken,
    user,
    // 计算属性
    isAuthenticated,
    // 方法
    setTokens,
    clearTokens,
    setUser,
  }
})
