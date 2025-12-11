<script setup lang="ts">
import { Button } from '@sse-wiki/ui'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFavorite } from '@/composables/useFavorite'
import { formatDate } from '@/utils/format'
import { Heart, User, Eye, Folder } from 'lucide-vue-next'

export interface ArticleCardData {
  id: number
  title: string
  summary?: string
  contentPreview?: string
  module?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  viewCount?: number
  author?: {
    username?: string
  }
}

const props = withDefaults(defineProps<{
  article: ArticleCardData
  showViewCount?: boolean
  showTags?: boolean
  showAuthor?: boolean
}>(), {
  showViewCount: true,
  showTags: true,
  showAuthor: true,
})

const emit = defineEmits<{
  (e: 'removed', articleId: number): void
}>()

const router = useRouter()
const { loading, isFavorited, toggleFavorite, initFavorites } = useFavorite()

// 初始化收藏状态
initFavorites()

// 是否已收藏
const favorited = computed(() => isFavorited(props.article.id))

// 显示内容（优先 summary，其次 contentPreview）
const displayContent = computed(() => props.article.summary || props.article.contentPreview || '')

// 点击卡片跳转
function handleClick() {
  router.push(`/articles/${props.article.id}`)
}

// 切换收藏状态
async function handleToggleFavorite(event: Event) {
  event.stopPropagation()
  const result = await toggleFavorite(props.article.id)
  if (result.success && !result.favorited) {
    emit('removed', props.article.id)
  }
}
</script>

<template>
  <div
    class="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
    @click="handleClick"
  >
    <!-- 卡片头部：标题 + 收藏按钮 -->
    <div class="p-4 pb-2">
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-base font-semibold text-gray-900 line-clamp-2 flex-1">
          {{ article.title }}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 shrink-0"
          :class="favorited ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'"
          :disabled="loading"
          @click="handleToggleFavorite"
        >
          <Heart
            class="h-4 w-4 transition-colors"
            :class="favorited ? 'fill-red-500' : ''"
          />
        </Button>
      </div>
    </div>

    <!-- 卡片内容：摘要 -->
    <div class="px-4 pb-3 flex-1">
      <p v-if="displayContent" class="text-sm text-gray-600 line-clamp-2">
        {{ displayContent }}
      </p>

      <!-- 标签 -->
      <div v-if="showTags && article.tags && article.tags.length > 0" class="flex flex-wrap gap-1.5 mt-3">
        <span
          v-for="tag in article.tags.slice(0, 3)"
          :key="tag"
          class="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full"
        >
          {{ tag }}
        </span>
        <span v-if="article.tags.length > 3" class="px-2 py-0.5 text-xs text-gray-400">
          +{{ article.tags.length - 3 }}
        </span>
      </div>
    </div>

    <!-- 卡片底部：元信息 -->
    <div class="px-4 py-3 bg-gray-50 border-t border-gray-100">
      <div class="flex items-center justify-between text-xs text-gray-500">
        <!-- 左侧：作者 + 模块 -->
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div v-if="showAuthor && article.author?.username" class="flex items-center gap-1 truncate">
            <User class="h-3.5 w-3.5 shrink-0" />
            <span class="truncate">{{ article.author.username }}</span>
          </div>
          <div v-if="article.module" class="flex items-center gap-1 truncate">
            <Folder class="h-3.5 w-3.5 shrink-0" />
            <span class="truncate">{{ article.module }}</span>
          </div>
        </div>

        <!-- 右侧：浏览量 + 日期 -->
        <div class="flex items-center gap-3 shrink-0">
          <div v-if="showViewCount && article.viewCount !== undefined" class="flex items-center gap-1">
            <Eye class="h-3.5 w-3.5" />
            <span>{{ article.viewCount }}</span>
          </div>
          <span v-if="article.updatedAt" class="text-gray-400">
            {{ formatDate(article.updatedAt) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
