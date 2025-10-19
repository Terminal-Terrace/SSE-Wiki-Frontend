<script setup lang="ts">
import { Button, Textarea } from '@sse-wiki/ui'
import { ref } from 'vue'

interface Comment {
  id: string | number
  author: string
  content: string
  timestamp: string
}

interface Props {
  pageId: string | number
}

defineProps<Props>()

const loading = ref(false)
const newComment = ref('')
const comments = ref<Comment[]>([])

function handleSubmit() {
  if (!newComment.value.trim())
    return

  // TODO: 实现评论提交
  console.log('提交评论:', newComment.value)
  newComment.value = ''
}

// TODO: 实现日期格式化
function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-muted/50 border border-border rounded-lg p-6">
      <h2 class="text-lg font-semibold mb-4">
        讨论区
      </h2>

      <div class="mb-6">
        <Textarea
          v-model="newComment"
          rows="4"
          placeholder="发表你的看法..."
        />
        <div class="mt-2 flex justify-end">
          <Button
            :disabled="!newComment.trim()"
            @click="handleSubmit"
          >
            发表评论
          </Button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-8 text-muted-foreground">
        加载中...
      </div>

      <div v-else-if="comments.length === 0" class="text-center py-8 text-muted-foreground">
        暂无评论，快来发表第一条评论吧！
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="p-4 border border-border rounded-lg"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="font-medium">
              {{ comment.author }}
            </div>
            <div class="text-sm text-muted-foreground">
              {{ formatDate(comment.timestamp) }}
            </div>
          </div>
          <div class="text-foreground">
            {{ comment.content }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
