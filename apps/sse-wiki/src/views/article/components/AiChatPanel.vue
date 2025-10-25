<script setup lang="ts">
import type { ChatMessage } from '@/types/ai'
import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
  ScrollArea,
  toast,
} from '@sse-wiki/ui'
import { ArrowUp, Bot, Copy, Lightbulb, Sparkles, Square, Trash2, X } from 'lucide-vue-next'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import { aiService } from '@/utils/aiService'

interface Props {
  articleTitle: string
  articleContent: string
}

interface DisplayMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
}

const props = defineProps<Props>()
defineEmits<{
  close: []
}>()

const messages = ref<DisplayMessage[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const isStreaming = ref(false)
const messagesContainer = ref<HTMLElement>()
const showConfig = ref(false)
const textareaRef = ref<HTMLTextAreaElement>()

// 快捷操作
const quickActions = [
  { label: '总结全文', prompt: '请用3-5句话总结这篇文章的核心内容', icon: Sparkles },
  { label: '关键词提取', prompt: '请列出这篇文章的5-8个关键词，并简要说明', icon: Lightbulb },
]

// 计算输入框是否可用
const canSend = computed(() => {
  return inputMessage.value.trim().length > 0 && !isLoading.value && !isStreaming.value
})

// 检查配置
onMounted(() => {
  if (!aiService.isConfigured()) {
    showConfig.value = true
    toast({
      title: 'AI 助手未配置',
      description: '请先在浏览器控制台设置 API Key（见下方说明）',
      variant: 'destructive',
    })
  }
})

// 自动滚动到底部
watch(messages, async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

/**
 * 构建发送给 AI 的消息列表
 */
function buildChatMessages(userMessage: string): ChatMessage[] {
  // 系统提示词（包含文章上下文）
  const systemMessage: ChatMessage = {
    role: 'system',
    content: aiService.buildArticleContext(props.articleTitle, props.articleContent),
    timestamp: Date.now(),
  }

  // 历史对话
  const historyMessages: ChatMessage[] = messages.value.map(m => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }))

  // 当前用户消息
  const currentMessage: ChatMessage = {
    role: 'user',
    content: userMessage,
    timestamp: Date.now(),
  }

  return [systemMessage, ...historyMessages, currentMessage]
}

/**
 * 发送消息
 */
async function handleSend(messageText?: string) {
  const textToSend = messageText || inputMessage.value.trim()

  if (!textToSend || isLoading.value || isStreaming.value)
    return

  if (!aiService.isConfigured()) {
    toast({
      title: '请先配置 API Key',
      description: '打开浏览器控制台，按说明配置',
      variant: 'destructive',
    })
    showConfig.value = true
    return
  }

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: textToSend,
    timestamp: Date.now(),
  })

  // 清空输入框
  inputMessage.value = ''

  // 创建 AI 消息占位
  const aiMessageIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    isStreaming: true,
  })

  isLoading.value = true
  isStreaming.value = true

  try {
    // 构建消息列表
    const chatMessages = buildChatMessages(textToSend)

    // 调用 AI 服务（流式）
    await aiService.sendMessageStream(chatMessages, {
      onChunk: (content: string) => {
        // 追加内容到 AI 消息
        const msg = messages.value[aiMessageIndex]
        if (msg) {
          msg.content += content
        }
      },
      onComplete: () => {
        // 流式输出完成
        const msg = messages.value[aiMessageIndex]
        if (msg) {
          msg.isStreaming = false
        }
        isStreaming.value = false
        isLoading.value = false
      },
      onError: (error: Error) => {
        // 处理错误
        console.error('AI 服务错误:', error)
        const msg = messages.value[aiMessageIndex]
        if (msg) {
          msg.content = `❌ 错误: ${error.message}\n\n请检查：\n1. API Key 是否正确\n2. 网络连接是否正常\n3. API 配额是否充足`
          msg.isStreaming = false
        }
        isStreaming.value = false
        isLoading.value = false

        toast({
          title: 'AI 回复失败',
          description: error.message,
          variant: 'destructive',
        })
      },
    })
  }
  catch (error) {
    console.error('发送消息失败:', error)
    const msg = messages.value[aiMessageIndex]
    if (msg) {
      msg.content = '发生未知错误，请重试'
      msg.isStreaming = false
    }
    isStreaming.value = false
    isLoading.value = false
  }
}

/**
 * 快捷操作
 */
function handleQuickAction(prompt: string) {
  handleSend(prompt)
}

/**
 * 清空对话
 */
function clearMessages() {
  if (isStreaming.value || isLoading.value) {
    toast({
      title: '请等待当前回复完成',
      variant: 'destructive',
    })
    return
  }

  messages.value = []
  toast({
    title: '对话已清空',
  })
}

/**
 * 停止生成
 */
function stopGeneration() {
  // TODO: 实现停止生成逻辑
  isStreaming.value = false
  isLoading.value = false
  toast({
    title: '已停止生成',
  })
}

/**
 * 复制消息内容
 */
function copyMessage(content: string) {
  navigator.clipboard.writeText(content).then(() => {
    toast({
      title: '已复制到剪贴板',
    })
  }).catch(() => {
    toast({
      title: '复制失败',
      variant: 'destructive',
    })
  })
}

/**
 * 自动调整 textarea 高度
 */
function autoResizeTextarea() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 200)}px`
  }
}

/**
 * 处理快捷键
 */
function handleKeydown(e: KeyboardEvent) {
  // Ctrl/Cmd + Enter 发送
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="h-full bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 backdrop-blur-sm">
      <div class="flex items-center gap-2">
        <div class="relative">
          <Bot class="h-5 w-5 text-primary" />
          <span v-if="isStreaming" class="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        </div>
        <div>
          <h3 class="font-semibold text-sm">
            AI 知识助手
          </h3>
          <p v-if="isStreaming" class="text-xs text-muted-foreground">
            正在思考...
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <Button
          v-if="messages.length > 0"
          variant="ghost"
          size="icon"
          :disabled="isStreaming || isLoading"
          @click="clearMessages"
        >
          <Trash2 class="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          @click="$emit('close')"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Messages -->
    <ScrollArea class="flex-1 px-4">
      <div
        ref="messagesContainer"
        class="space-y-6 py-4 min-h-full"
      >
        <!-- 欢迎界面 -->
        <div v-if="messages.length === 0" class="space-y-6 flex flex-col items-center justify-center min-h-full">
          <div class="text-center text-muted-foreground space-y-3">
            <div class="relative mx-auto w-fit">
              <div class="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
              <Bot class="h-16 w-16 mx-auto relative text-primary" />
            </div>
            <div>
              <p class="text-base font-medium text-foreground">
                AI 知识助手
              </p>
              <p class="text-sm mt-1">
                基于文章内容回答你的问题
              </p>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="w-full space-y-2">
            <p class="text-xs text-muted-foreground text-center font-medium">
              快速开始
            </p>
            <div class="grid grid-cols-1 gap-2">
              <Button
                v-for="action in quickActions"
                :key="action.label"
                variant="outline"
                size="sm"
                class="justify-start hover:bg-primary/5 hover:border-primary/20 transition-all"
                :disabled="isLoading"
                @click="handleQuickAction(action.prompt)"
              >
                <component :is="action.icon" class="h-4 w-4 mr-2 text-primary" />
                {{ action.label }}
              </Button>
            </div>
          </div>

          <!-- 配置提示 -->
          <div v-if="showConfig" class="w-full mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-xs space-y-3 shadow-sm">
            <div class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                ⚙️
              </div>
              <p class="font-semibold text-amber-900">
                首次使用需要配置
              </p>
            </div>
            <p class="text-amber-800">
              打开浏览器控制台（F12），粘贴以下代码：
            </p>
            <pre class="bg-white/80 p-3 rounded-lg overflow-x-auto text-amber-900 text-[10px] leading-relaxed border border-amber-200">localStorage.setItem('ai-config', JSON.stringify({
  apiKey: 'sk-your-api-key-here',
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat'
}))</pre>
            <div class="flex items-center justify-between pt-2 border-t border-amber-200">
              <p class="text-amber-800">
                获取 API Key →
              </p>
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                class="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
              >
                DeepSeek 官网
              </a>
            </div>
          </div>
        </div>

        <!-- 对话消息 -->
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="group"
        >
          <div
            class="flex gap-3"
            :class="[
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
            ]"
          >
            <!-- Avatar -->
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              :class="[
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted',
              ]"
            >
              <Bot v-if="message.role === 'assistant'" class="h-4 w-4" />
              <span v-else class="text-xs font-medium">你</span>
            </div>

            <!-- Message Content -->
            <div class="flex-1 min-w-0 space-y-2">
              <div
                class="prose prose-sm max-w-none break-words rounded-2xl px-4 py-3 shadow-sm"
                :class="[
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-12'
                    : 'bg-muted/50 mr-12',
                ]"
              >
                <!-- 用户消息：纯文本 -->
                <div v-if="message.role === 'user'" class="text-sm whitespace-pre-wrap leading-relaxed">
                  {{ message.content }}
                </div>

                <!-- AI 消息：Markdown 渲染 -->
                <div v-else class="text-sm leading-relaxed">
                  <MarkdownRenderer :content="message.content" />
                  <!-- 流式输出光标 -->
                  <span
                    v-if="message.isStreaming"
                    class="inline-block w-0.5 h-4 bg-current animate-pulse ml-0.5 align-middle"
                  />
                </div>
              </div>

              <!-- Message Actions -->
              <div
                v-if="message.role === 'assistant' && !message.isStreaming"
                class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Button
                  variant="ghost"
                  size="xs"
                  @click="copyMessage(message.content)"
                >
                  <Copy class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载提示 -->
        <div v-if="isLoading && !isStreaming" class="flex gap-3">
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Bot class="h-4 w-4" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="bg-muted/50 rounded-2xl px-4 py-3 shadow-sm mr-12">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <div class="flex gap-1">
                  <span class="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style="animation-delay: 0ms" />
                  <span class="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style="animation-delay: 150ms" />
                  <span class="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style="animation-delay: 300ms" />
                </div>
                <span>AI 正在思考</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>

    <!-- Input -->
    <div class="p-4 border-t border-border bg-muted/20 space-y-3">
      <!-- 快捷按钮 -->
      <div class="flex gap-2 flex-wrap">
        <Button
          v-for="action in quickActions"
          :key="action.label"
          variant="outline"
          size="xs"
          class="rounded-full"
          :disabled="isLoading || isStreaming"
          @click="handleQuickAction(action.prompt)"
        >
          <component :is="action.icon" class="h-3 w-3 mr-1" />
          {{ action.label }}
        </Button>
      </div>

      <!-- 输入框组 -->
      <InputGroup :disabled="isLoading || isStreaming">
        <InputGroupTextarea
          ref="textareaRef"
          v-model="inputMessage"
          placeholder="Ask, Search or Chat..."
          class="min-h-[44px] max-h-[200px] resize-none"
          :disabled="isLoading || isStreaming"
          @input="autoResizeTextarea"
          @keydown="handleKeydown"
        />
        <InputGroupAddon align="block-end">
          <!-- 停止生成按钮 -->
          <InputGroupButton
            v-if="isStreaming"
            variant="outline"
            class="rounded-full ml-auto"
            size="icon-xs"
            @click="stopGeneration"
          >
            <Square class="size-3" />
          </InputGroupButton>

          <!-- 发送按钮 -->
          <InputGroupButton
            v-if="!isStreaming"
            variant="default"
            class="rounded-full ml-auto"
            size="icon-xs"
            :disabled="!canSend"
            @click="handleSend()"
          >
            <ArrowUp class="size-4" />
            <span class="sr-only">Send</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  </div>
</template>
