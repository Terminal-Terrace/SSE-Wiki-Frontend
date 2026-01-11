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

export interface UpdateProfileData {
  avatar?: string
  username?: string
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
      // userInfo 已经通过 toCamelCase 转换，使用 userId
      user.value = {
        id: userInfo.userId,
        username: userInfo.username,
        email: userInfo.email,
        role: userInfo.role,
        avatar: userInfo.avatar,
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

  /**
   * 更新用户资料
   */
  async function updateProfile(data: UpdateProfileData) {
    const updatedUser = await AuthAPI.updateProfile(data)
    if (user.value) {
      user.value = {
        ...user.value,
        username: updatedUser.username || user.value.username,
        avatar: updatedUser.avatar || user.value.avatar,
      }
    }
    return updatedUser
  }

  return {
    // 状态
    user,
    hasChecked,
    // 计算属性
    isAuthenticated,
    isAdmin,
    // 方法
    setUser,
    clearUser,
    checkLoginStatus,
    updateProfile,
  }
})
