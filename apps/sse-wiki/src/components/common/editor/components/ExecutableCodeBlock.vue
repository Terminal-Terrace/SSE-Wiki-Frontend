<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/core'
import type { ExecutableCodeBlockAttrs } from '../types'
/**
 * 可执行代码块组件
 * 支持代码在线运行
 */
import { Button } from '@sse-wiki/ui'
import { CheckCircle2, Loader2, Play, XCircle } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { executeCodeByLanguage } from '../utils/codeExecution'

const props = defineProps<NodeViewProps>()

/**
 * 更新节点属性的辅助函数
 */
function updateNodeAttrs(attrs: Partial<ExecutableCodeBlockAttrs>) {
  if (props.editor && typeof props.getPos === 'function') {
    const pos = props.getPos()
    if (pos !== undefined) {
      props.editor.commands.updateAttributes('executableCodeBlock', attrs)
    }
  }
}

// 从节点内容获取代码（如果有子节点）
function getCodeFromNode() {
  if (props.node.content && props.node.content.size > 0) {
    return props.node.textContent || ''
  }
  return props.node.attrs.code || ''
}

const code = ref(getCodeFromNode())
const language = ref(props.node.attrs.language || 'javascript')
const executable = ref(props.node.attrs.executable !== false)
const result = ref(props.node.attrs.result || '')
const status = ref<'idle' | 'running' | 'success' | 'error'>(props.node.attrs.status || 'idle')

// 监听内容变化
watch(() => props.node.textContent, (newCode) => {
  code.value = newCode || ''
})

watch(() => props.node.attrs.code, (newCode) => {
  if (newCode) {
    code.value = newCode
  }
})

watch(() => props.node.attrs.language, (newLang) => {
  language.value = newLang || 'javascript'
})

watch(() => props.node.attrs.result, (newResult) => {
  result.value = newResult || ''
})

watch(() => props.node.attrs.status, (newStatus) => {
  status.value = newStatus || 'idle'
})

/**
 * 执行代码
 */
async function executeCode() {
  if (!executable.value || !code.value.trim()) {
    return
  }

  status.value = 'running'
  result.value = ''
  updateNodeAttrs({ status: 'running', result: '' })

  try {
    const executionResult = await executeCodeByLanguage(code.value, language.value)

    if (executionResult.success) {
      status.value = 'success'
      result.value = executionResult.output
      updateNodeAttrs({ status: 'success', result: executionResult.output })
    }
    else {
      status.value = 'error'
      result.value = executionResult.error || '执行失败'
      updateNodeAttrs({ status: 'error', result: result.value })
    }
  }
  catch (error) {
    status.value = 'error'
    result.value = error instanceof Error ? error.message : '执行失败'
    updateNodeAttrs({ status: 'error', result: result.value })
  }
}

// 代码变化时更新节点
function onCodeChange(event: Event) {
  const newCode = (event.target as HTMLTextAreaElement).value
  code.value = newCode
  // 更新节点内容，而不是属性
  if (props.editor && typeof props.getPos === 'function') {
    const pos = props.getPos()
    if (pos !== undefined) {
      props.editor.commands.command(({ tr, state }: any) => {
        const node = state.doc.nodeAt(pos)
        if (node) {
          tr.replaceWith(pos, pos + node.nodeSize, state.schema.nodes.executableCodeBlock.create({
            ...node.attrs,
            code: newCode,
          }, state.schema.text(newCode)))
        }
        return true
      })
    }
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
</script>

<template>
  <div class="executable-code-block my-4 rounded-lg border bg-muted/30 overflow-hidden">
    <!-- 工具栏 -->
    <div class="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-muted-foreground">{{ language }}</span>
        <span v-if="executable" class="text-xs text-muted-foreground">可执行</span>
      </div>
      <Button
        v-if="executable"
        :variant="status === 'running' ? 'secondary' : 'ghost'"
        size="sm"
        :disabled="status === 'running'"
        class="h-7"
        @click="executeCode"
      >
        <component :is="statusIcon" class="h-3 w-3 mr-1" :class="[statusColor, status === 'running' ? 'animate-spin' : '']" />
        <span class="text-xs">
          {{ status === 'running' ? '运行中...' : status === 'success' ? '重新运行' : status === 'error' ? '重试' : '运行' }}
        </span>
      </Button>
    </div>

    <!-- 代码编辑区 -->
    <div class="relative">
      <pre class="p-4 overflow-x-auto bg-background"><code><textarea
        :value="code"
        class="w-full h-full min-h-[100px] font-mono text-sm bg-transparent border-none outline-none resize-none"
        :placeholder="`输入 ${language} 代码...`"
        @input="onCodeChange"
      /></code></pre>
    </div>

    <!-- 运行结果 -->
    <div
      v-if="result || status === 'running'"
      class="border-t bg-background px-4 py-3"
    >
      <div class="flex items-center gap-2 mb-2">
        <component :is="statusIcon" class="h-4 w-4" :class="[statusColor, status === 'running' ? 'animate-spin' : '']" />
        <span class="text-sm font-medium">运行结果</span>
      </div>
      <pre class="text-sm font-mono whitespace-pre-wrap text-muted-foreground">{{ result || '运行中...' }}</pre>
    </div>
  </div>
</template>

<style scoped>
.executable-code-block textarea {
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.5;
}

.executable-code-block pre {
  margin: 0;
}
</style>
