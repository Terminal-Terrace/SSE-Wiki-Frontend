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

  return {
    // 状态
    user,
    isAuthenticated: ref(false),
    // 方法
    setUser,
    clearUser,
  }
})
