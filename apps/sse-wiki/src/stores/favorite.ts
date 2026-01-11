import { defineStore } from 'pinia'
import { ref } from 'vue'
import articleApi from '@/services/articleApi'
import { useAuthStore } from './auth'

/**
 * 收藏状态管理 Store
 * 管理用户的文章收藏状态，支持乐观更新
 */
export const useFavoriteStore = defineStore('favorite', () => {
  // 状态：收藏的文章 ID 集合
  const favoriteIds = ref<Set<number>>(new Set())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  /**
   * 获取用户收藏列表
   */
  async function fetchFavorites() {
    const authStore = useAuthStore()
    if (!authStore.user?.id) {
      favoriteIds.value = new Set()
      initialized.value = true
      return
    }

    loading.value = true
    error.value = null

    try {
      const resp = await articleApi.getUserFavourites(authStore.user.id)
      const ids = resp.articleId || []
      favoriteIds.value = new Set(ids)
      initialized.value = true
    }
    catch (err: any) {
      error.value = err.message || '获取收藏列表失败'
      console.error('[FavoriteStore] fetchFavorites error:', err)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 检查文章是否已收藏
   */
  function isFavorited(articleId: number): boolean {
    return favoriteIds.value.has(articleId)
  }

  /**
   * 切换收藏状态（乐观更新）
   * @returns 操作后的收藏状态
   */
  async function toggleFavorite(articleId: number): Promise<boolean> {
    const authStore = useAuthStore()
    if (!authStore.user?.id) {
      throw new Error('请先登录')
    }

    const userId = Number(authStore.user.id)
    const wasFavorited = isFavorited(articleId)
    const newFavorited = !wasFavorited

    // 乐观更新
    if (newFavorited) {
      favoriteIds.value.add(articleId)
    }
    else {
      favoriteIds.value.delete(articleId)
    }

    try {
      await articleApi.toggleFavorite(userId, articleId, wasFavorited)
      return newFavorited
    }
    catch (err: any) {
      // 回滚
      if (newFavorited) {
        favoriteIds.value.delete(articleId)
      }
      else {
        favoriteIds.value.add(articleId)
      }
      error.value = err.message || '操作失败'
      throw err
    }
  }

  /**
   * 添加收藏
   */
  async function addFavorite(articleId: number): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.user?.id) {
      throw new Error('请先登录')
    }

    const userId = Number(authStore.user.id)
    if (isFavorited(articleId)) {
      return // 已收藏，无需操作
    }

    // 乐观更新
    favoriteIds.value.add(articleId)

    try {
      await articleApi.addFavorite(userId, articleId)
    }
    catch (err: any) {
      // 回滚
      favoriteIds.value.delete(articleId)
      error.value = err.message || '收藏失败'
      throw err
    }
  }

  /**
   * 移除收藏
   */
  async function removeFavorite(articleId: number): Promise<void> {
    const authStore = useAuthStore()
    if (!authStore.user?.id) {
      throw new Error('请先登录')
    }

    const userId = Number(authStore.user.id)
    if (!isFavorited(articleId)) {
      return // 未收藏，无需操作
    }

    // 乐观更新
    favoriteIds.value.delete(articleId)

    try {
      await articleApi.removeFavorite(userId, articleId)
    }
    catch (err: any) {
      // 回滚
      favoriteIds.value.add(articleId)
      error.value = err.message || '取消收藏失败'
      throw err
    }
  }

  /**
   * 清空收藏状态（用于登出时）
   */
  function clearFavorites() {
    favoriteIds.value = new Set()
    initialized.value = false
    error.value = null
  }

  return {
    // 状态
    favoriteIds,
    loading,
    error,
    initialized,
    // 方法
    fetchFavorites,
    isFavorited,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  }
})
