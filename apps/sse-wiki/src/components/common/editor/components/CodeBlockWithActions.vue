<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/core'
import { Button } from '@sse-wiki/ui'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/vue-3'
import { CheckCircle2, Copy, Loader2, Play, XCircle } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { executeCodeByLanguage } from '../utils/codeExecution'

const props = defineProps<NodeViewProps>()

// 从节点获取代码和语言
function getCodeFromNode() {
  return props.node.textContent || ''
}

function getLanguageFromNode() {
  // CodeBlockLowlight 使用 class 属性来存储语言，格式为 "language-xxx"
  const classAttr = props.node.attrs.class || ''
  const languageMatch = classAttr.match(/language-(\w+)/)
  if (languageMatch) {
    return languageMatch[1]
  }
  // 也检查 language 属性
  return props.node.attrs.language || 'text'
}

const code = ref(getCodeFromNode())
const language = ref(getLanguageFromNode())
const result = ref('')
const status = ref<'idle' | 'running' | 'success' | 'error'>('idle')
const copied = ref(false)

watch(() => props.node.textContent, (newCode) => {
  code.value = newCode || ''
})

watch(() => props.node.attrs, () => {
  language.value = getLanguageFromNode()
  code.value = getCodeFromNode()
}, { deep: true })

async function copyCode() {
  try {
    await navigator.clipboard.writeText(code.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch (error) {
    console.error('复制失败:', error)
  }
}

async function executeCode() {
  if (!code.value.trim()) {
    return
  }

  status.value = 'running'
  result.value = ''

  try {
    const executionResult = await executeCodeByLanguage(code.value, language.value)

    if (executionResult.success) {
      status.value = 'success'
      result.value = executionResult.output
    }
    else {
      status.value = 'error'
      result.value = executionResult.error || '执行失败'
    }
  }
  catch (error) {
    status.value = 'error'
    result.value = error instanceof Error ? error.message : '执行失败'
  }
}

const statusIcon = computed(() => {
  switch (status.value) {
    case 'running':
      return Loader2
    case 'success':
      return CheckCircle2
    case 'error':
      return XCircle
    default:
      return Play
  }
})

const statusColor = computed(() => {
  switch (status.value) {
    case 'running':
      return 'text-blue-500'
    case 'success':
      return 'text-green-500'
    case 'error':
      return 'text-red-500'
    default:
      return 'text-muted-foreground'
  }
})

const canExecute = computed(() => {
  const normalizedLang = language.value.toLowerCase()
  return ['javascript', 'js', 'python', 'py'].includes(normalizedLang)
})
</script>

<template>
  <NodeViewWrapper class="code-block-with-actions my-4 rounded-lg border overflow-hidden relative group" data-drag-handle>
    <!-- 工具栏 -->
    <div class="flex items-center justify-between border-b px-3 py-2">
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-muted-foreground">{{ language || 'text' }}</span>
      </div>
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          class="h-7 px-2"
          @click="copyCode"
        >
          <Copy class="h-3 w-3" :class="{ 'text-green-500': copied }" />
        </Button>
        <Button
          v-if="canExecute"
          variant="ghost"
          size="sm"
          class="h-7 px-2"
          :disabled="status === 'running'"
          @click="executeCode"
        >
          <component
            :is="statusIcon"
            class="h-3 w-3"
            :class="[statusColor, status === 'running' ? 'animate-spin' : '']"
          />
        </Button>
      </div>
    </div>

    <!-- 代码内容 - 使用 NodeViewContent 来支持编辑 -->
    <div class="code-content-wrapper">
      <pre class="code-pre"><code class="code-code"><NodeViewContent /></code></pre>
    </div>

    <!-- 运行结果 -->
    <div
      v-if="result || status === 'running'"
      class="border-t px-4 py-3"
    >
      <div class="flex items-center gap-2 mb-2">
        <component
          :is="statusIcon"
          class="h-4 w-4"
          :class="[statusColor, status === 'running' ? 'animate-spin' : '']"
        />
        <span class="text-sm font-medium">运行结果</span>
      </div>
      <pre class="text-sm font-mono whitespace-pre-wrap text-muted-foreground">{{ result || '运行中...' }}</pre>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
/* 统一所有部分的背景和边框颜色 */
.code-block-with-actions {
  background: hsl(var(--muted) / 0.3);
  border-color: hsl(var(--border));
}

/* 统一内部边框颜色 */
.code-block-with-actions > div {
  border-color: hsl(var(--border));
}

.code-content-wrapper {
  position: relative;
  background: hsl(var(--muted) / 0.3);
}

.code-pre {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  background: hsl(var(--muted) / 0.3);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  min-height: 3rem;
}

/* 确保 pre 内部所有元素背景色统一，包括 NodeViewContent 的 div */
.code-pre,
.code-pre *,
.code-pre [data-node-view-content] {
  background: hsl(var(--muted) / 0.3) !important;
}

/* 特别针对 NodeViewContent 渲染的 div */
.code-pre [data-node-view-content] {
  background: hsl(var(--muted) / 0.3) !important;
  margin: 0;
  padding: 0;
}

.code-code {
  display: block;
  background: hsl(var(--muted) / 0.3) !important;
  padding: 0;
  color: hsl(var(--foreground));
  font-size: inherit;
  line-height: inherit;
  white-space: pre;
  font-family: inherit;
  margin: 0;
}

/* 确保 code 内部的 NodeViewContent div 也是统一背景 */
.code-code [data-node-view-content] {
  background: hsl(var(--muted) / 0.3) !important;
}

/* 确保代码块内的 code 元素样式正确 */
.code-pre :deep(code) {
  display: block;
  background: hsl(var(--muted) / 0.3) !important;
  padding: 0;
  color: inherit;
  font-size: inherit;
  line-height: inherit;
}

/* 确保代码高亮样式正确应用 - 背景色统一，但保留语法高亮的文字颜色 */
.code-block-with-actions :deep(.hljs),
.code-block-with-actions :deep([class*='hljs-']) {
  background: hsl(var(--muted) / 0.3) !important;
}

/* 代码高亮主题适配 */
.code-block-with-actions :deep(.hljs-keyword),
.code-block-with-actions :deep(.hljs-built_in),
.code-block-with-actions :deep(.hljs-name) {
  color: hsl(var(--primary));
}

.code-block-with-actions :deep(.hljs-string),
.code-block-with-actions :deep(.hljs-attr) {
  color: hsl(var(--primary) / 0.8);
}

.code-block-with-actions :deep(.hljs-comment) {
  color: hsl(var(--muted-foreground));
  font-style: italic;
}

.code-block-with-actions :deep(.hljs-number) {
  color: hsl(var(--primary) / 0.9);
}
</style>
