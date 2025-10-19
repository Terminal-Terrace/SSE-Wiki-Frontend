<script setup lang="ts">
import { Button, Input } from '@sse-wiki/ui'
import { Bot, Send, X } from 'lucide-vue-next'
import { ref } from 'vue'

interface Props {
  articleTitle: string
  articleContent: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

const messages = ref<Message[]>([])
const inputMessage = ref('')

function handleSend() {
  if (!inputMessage.value.trim())
    return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: inputMessage.value,
  })

  // TODO: 调用AI API
  // 模拟AI回复
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      content: '这是AI助手的回复（待实现真实API对接）',
    })
  }, 500)

  inputMessage.value = ''
}
</script>

<template>
  <div class="h-full bg-background border border-border rounded-lg shadow-sm flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-border">
      <div class="flex items-center gap-2">
        <Bot class="h-5 w-5 text-primary" />
        <h3 class="font-semibold">
          AI 助手
        </h3>
      </div>
      <Button
        variant="ghost"
        size="icon"
        @click="$emit('close')"
      >
        <X class="h-4 w-4" />
      </Button>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-if="messages.length === 0" class="text-center text-muted-foreground py-8">
        <Bot class="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>向AI助手提问关于本文的任何问题</p>
      </div>

      <div
        v-for="(message, index) in messages"
        :key="index"
        class="p-3 rounded-lg" :class="[
          message.role === 'user'
            ? 'bg-primary text-primary-foreground ml-8'
            : 'bg-muted mr-8',
        ]"
      >
        <div class="text-sm">
          {{ message.content }}
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 border-t border-border">
      <div class="flex gap-2">
        <Input
          v-model="inputMessage"
          type="text"
          placeholder="输入你的问题..."
          @keypress.enter="handleSend"
        />
        <Button
          :disabled="!inputMessage.trim()"
          size="icon"
          @click="handleSend"
        >
          <Send class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
