import { toast } from '@sse-wiki/ui'
import { computed, ref } from 'vue'
import articleApi from '@/services/articleApi'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorite'

/**
 * 收藏功能 composable
 * 封装收藏/取消收藏的通用逻辑
 */
export function useFavorite() {
  const authStore = useAuthStore()
  const favoriteStore = useFavoriteStore()
  const loading = ref(false)

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const userId = computed(() => Number(authStore.user?.id) || 0)

  /**
   * 初始化收藏状态
   */
  async function initFavorites() {
    if (isAuthenticated.value && !favoriteStore.initialized) {
      await favoriteStore.fetchFavorites()
    }
  }

  /**
   * 检查文章是否已收藏
   */
  function isFavorited(articleId: number): boolean {
    return favoriteStore.isFavorited(articleId)
  }

  /**
   * 切换收藏状态
   * @returns 是否成功，以及操作后的收藏状态
   */
  async function toggleFavorite(articleId: number): Promise<{ success: boolean, favorited: boolean }> {
    if (!isAuthenticated.value) {
      toast({
        title: '请先登录',
        description: '登录后即可收藏文章',
        variant: 'destructive',
      })
      return { success: false, favorited: false }
    }

    if (!userId.value) {
      return { success: false, favorited: false }
    }

    loading.value = true
    const wasFavorited = isFavorited(articleId)

    // 乐观更新
    if (wasFavorited) {
      favoriteStore.favoriteIds.delete(articleId)
    }
    else {
      favoriteStore.favoriteIds.add(articleId)
    }

    try {
      if (wasFavorited) {
        await articleApi.removeFavorite(userId.value, articleId)
        toast({ title: '已取消收藏' })
      }
      else {
        await articleApi.addFavorite(userId.value, articleId)
        toast({ title: '收藏成功' })
      }
      return { success: true, favorited: !wasFavorited }
    }
    catch (err: any) {
      // 回滚
      if (wasFavorited) {
        favoriteStore.favoriteIds.add(articleId)
      }
      else {
        favoriteStore.favoriteIds.delete(articleId)
      }
      toast({
        title: '操作失败',
        description: err.message || '请稍后重试',
        variant: 'destructive',
      })
      return { success: false, favorited: wasFavorited }
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    isAuthenticated,
    initFavorites,
    isFavorited,
    toggleFavorite,
  }
}
