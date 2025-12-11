<script setup lang="ts">
import { Button } from '@sse-wiki/ui'
import { Heart } from 'lucide-vue-next'
import { computed, onMounted, watch } from 'vue'
import { TooltipWrapper } from '@/components/common/tooltip'
import { useFavorite } from '@/composables/useFavorite'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorite'

const props = defineProps<{
  articleId: number
}>()

const emit = defineEmits<{
  (e: 'toggle', favorited: boolean): void
  (e: 'error', error: Error): void
}>()

const authStore = useAuthStore()
const favoriteStore = useFavoriteStore()
const { loading, isAuthenticated, isFavorited, toggleFavorite, initFavorites } = useFavorite()

// 是否已收藏
const favorited = computed(() => isFavorited(props.articleId))

// 初始化收藏状态
onMounted(() => {
  initFavorites()
})

// 监听登录状态变化
watch(() => authStore.user, async (newUser) => {
  if (newUser && !favoriteStore.initialized) {
    await initFavorites()
  }
  else if (!newUser) {
    favoriteStore.clearFavorites()
  }
})

// 切换收藏状态
async function handleToggle() {
  const result = await toggleFavorite(props.articleId)
  if (result.success) {
    emit('toggle', result.favorited)
  }
}
</script>

<template>
  <TooltipWrapper :tooltip="isAuthenticated ? (favorited ? '取消收藏' : '收藏文章') : '登录后可收藏'">
    <Button
      variant="ghost"
      size="icon"
      :disabled="loading"
      @click="handleToggle"
    >
      <Heart
        class="h-5 w-5 transition-colors"
        :class="[
          favorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground',
          !isAuthenticated && 'opacity-50',
        ]"
      />
    </Button>
  </TooltipWrapper>
</template>
