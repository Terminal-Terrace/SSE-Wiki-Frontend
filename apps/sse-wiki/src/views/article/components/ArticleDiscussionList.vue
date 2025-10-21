<script setup lang="ts">
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
  Textarea,
} from '@sse-wiki/ui'
import { MessageSquare, Send } from 'lucide-vue-next'
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

function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <MessageSquare class="h-5 w-5" />
        讨论区
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="space-y-2">
        <Textarea
          v-model="newComment"
          rows="4"
          placeholder="发表你的看法..."
        />
        <div class="flex justify-end">
          <Button
            :disabled="!newComment.trim()"
            @click="handleSubmit"
          >
            <Send class="h-4 w-4 mr-2" />
            发表评论
          </Button>
        </div>
      </div>

      <div v-if="loading" class="space-y-4">
        <Card v-for="i in 2" :key="i">
          <CardHeader>
            <div class="flex items-start justify-between">
              <Skeleton class="h-5 w-24" />
              <Skeleton class="h-4 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton class="h-16 w-full" />
          </CardContent>
        </Card>
      </div>

      <Empty v-else-if="comments.length === 0" class="py-8">
        <EmptyMedia variant="icon">
          <MessageSquare class="h-6 w-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>暂无评论</EmptyTitle>
          <EmptyDescription>
            快来发表第一条评论吧！
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div v-else class="space-y-4">
        <Card v-for="comment in comments" :key="comment.id">
          <CardHeader>
            <div class="flex items-start justify-between">
              <CardTitle class="text-base font-medium">
                {{ comment.author }}
              </CardTitle>
              <CardDescription>
                {{ formatDate(comment.timestamp) }}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p class="text-foreground whitespace-pre-wrap">
              {{ comment.content }}
            </p>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  </Card>
</template>
