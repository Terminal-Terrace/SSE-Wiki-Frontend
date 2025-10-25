<script setup lang="ts">
import { Alert, AlertDescription, Card, CardContent, CardHeader, CardTitle } from '@sse-wiki/ui'
import { AlertCircle, MessageSquare } from 'lucide-vue-next'
import { computed, onMounted, watch } from 'vue'
import { useDiscussionStore } from '@/stores/discussion'
import { CommentEditorMode } from '@/types/discussion'
/**
 * 讨论区主组件
 * 展示文章的所有评论，支持发表新评论
 */
import CommentEditor from './CommentEditor.vue'
import CommentItem from './CommentItem.vue'

interface Props {
  articleId: number
  currentUserId?: number // 当前登录用户ID
}

const props = defineProps<Props>()

const discussionStore = useDiscussionStore()

// ========== 计算属性 ==========
const hasComments = computed(() => {
  return discussionStore.comments.length > 0
})

const commentCount = computed(() => {
  return discussionStore.total
})

// ========== 生命周期 ==========
onMounted(() => {
  loadComments()
})

// 监听文章ID变化
watch(() => props.articleId, () => {
  loadComments()
})

// ========== 方法 ==========
async function loadComments() {
  try {
    await discussionStore.loadComments(props.articleId)
  }
  catch (error) {
    console.error('加载评论失败:', error)
  }
}

async function handleSubmitComment(content: string) {
  try {
    await discussionStore.createComment(props.articleId, { content })
  }
  catch (error) {
    console.error('发表评论失败:', error)
  }
}
</script>

<template>
  <Card class="discussion-thread">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <MessageSquare class="h-5 w-5" />
        讨论区
        <span v-if="commentCount > 0" class="text-sm font-normal text-muted-foreground">
          ({{ commentCount }} 条评论)
        </span>
      </CardTitle>
    </CardHeader>

    <CardContent class="space-y-6">
      <!-- 发表新评论 -->
      <div class="new-comment-section">
        <h3 class="text-sm font-medium mb-3">
          发表评论
        </h3>
        <CommentEditor
          :mode="CommentEditorMode.CREATE"
          placeholder="分享你的想法..."
          @submit="handleSubmitComment"
        />
      </div>

      <!-- 错误提示 -->
      <Alert v-if="discussionStore.error" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>
          {{ discussionStore.error }}
        </AlertDescription>
      </Alert>

      <!-- 加载中 -->
      <div v-if="discussionStore.loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>

      <!-- 评论列表 -->
      <div v-else-if="hasComments" class="comments-list space-y-0">
        <h3 class="text-sm font-medium mb-4">
          全部评论
        </h3>
        <div class="divide-y divide-border/50">
          <CommentItem
            v-for="comment in discussionStore.comments"
            :key="comment.id"
            :comment="comment"
            :current-user-id="currentUserId"
          />
        </div>
      </div>

      <!-- 暂无评论 -->
      <div v-else class="text-center py-12 text-muted-foreground">
        <MessageSquare class="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p class="text-sm">
          还没有评论，快来发表第一条评论吧！
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.discussion-thread {
  @apply w-full;
}

.new-comment-section {
  @apply pb-6 border-b border-border;
}

.comments-list {
  @apply pt-2;
}
</style>
