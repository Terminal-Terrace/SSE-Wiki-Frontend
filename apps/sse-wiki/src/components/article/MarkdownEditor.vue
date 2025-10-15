<script setup lang="ts">
import { Button, Card, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '@sse-wiki/ui'
import { Bold, Code, Heading, Italic, Link as LinkIcon, List, ListOrdered } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
  minHeight?: string
  readonly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'save'): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '在此输入 Markdown 内容...',
  minHeight: '400px',
  readonly: false,
})

const emit = defineEmits<Emits>()

const activeTab = ref<string>('edit')
const textareaRef = ref<HTMLTextAreaElement>()

// 本地编辑内容
const localContent = ref(props.modelValue)

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== localContent.value) {
    localContent.value = newValue
  }
})

// 监听本地变化并向外部发射
watch(localContent, (newValue) => {
  emit('update:modelValue', newValue)
})

// 简单的 Markdown 渲染（后期可以用 marked 或其他库）
const renderedHtml = computed(() => {
  let html = localContent.value

  // 标题
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mb-2">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')

  // 加粗
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')

  // 斜体
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')

  // 代码块
  html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre class="bg-muted p-4 rounded-md my-2 overflow-x-auto"><code>$2</code></pre>')

  // 行内代码
  html = html.replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')

  // 链接
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline">$1</a>')

  // 无序列表
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')

  // 有序列表
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')

  // 段落
  html = html.replace(/\n\n/g, '</p><p class="mb-2">')
  html = `<p class="mb-2">${html}</p>`

  return html
})

// 插入 Markdown 语法
function insertMarkdown(before: string, after = '') {
  const textarea = textareaRef.value
  if (!textarea)
    return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = localContent.value.substring(start, end)
  const replacement = before + selectedText + after

  localContent.value
    = localContent.value.substring(0, start)
      + replacement
      + localContent.value.substring(end)

  // 恢复焦点并选中插入的内容
  textarea.focus()
  setTimeout(() => {
    textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
  }, 0)
}

// 工具栏按钮操作
function insertHeading() {
  insertMarkdown('## ', '')
}

function insertBold() {
  insertMarkdown('**', '**')
}

function insertItalic() {
  insertMarkdown('*', '*')
}

function insertLink() {
  insertMarkdown('[', '](https://)')
}

function insertCode() {
  insertMarkdown('`', '`')
}

function insertUnorderedList() {
  const textarea = textareaRef.value
  if (!textarea)
    return

  const start = textarea.selectionStart
  const lineStart = localContent.value.lastIndexOf('\n', start - 1) + 1
  localContent.value
    = `${localContent.value.substring(0, lineStart)
    }- ${
      localContent.value.substring(lineStart)}`

  textarea.focus()
}

function insertOrderedList() {
  const textarea = textareaRef.value
  if (!textarea)
    return

  const start = textarea.selectionStart
  const lineStart = localContent.value.lastIndexOf('\n', start - 1) + 1
  localContent.value
    = `${localContent.value.substring(0, lineStart)
    }1. ${
      localContent.value.substring(lineStart)}`

  textarea.focus()
}

// 快捷键处理
function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'b':
        e.preventDefault()
        insertBold()
        break
      case 'i':
        e.preventDefault()
        insertItalic()
        break
      case 'k':
        e.preventDefault()
        insertLink()
        break
      case 's':
        e.preventDefault()
        emit('save')
        break
    }
  }
}
</script>

<template>
  <Card class="overflow-hidden">
    <Tabs v-model="activeTab" default-value="edit">
      <!-- 工具栏 -->
      <div class="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <TabsList class="bg-transparent">
          <TabsTrigger value="edit" class="data-[state=active]:bg-background">
            编辑
          </TabsTrigger>
          <TabsTrigger value="preview" class="data-[state=active]:bg-background">
            预览
          </TabsTrigger>
        </TabsList>

        <!-- Markdown 工具栏 -->
        <div v-if="activeTab === 'edit' && !readonly" class="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0"
            title="标题 (##)"
            @click="insertHeading"
          >
            <Heading class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0"
            title="加粗 (Ctrl+B)"
            @click="insertBold"
          >
            <Bold class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0"
            title="斜体 (Ctrl+I)"
            @click="insertItalic"
          >
            <Italic class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0"
            title="代码 (`)"
            @click="insertCode"
          >
            <Code class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0"
            title="链接 (Ctrl+K)"
            @click="insertLink"
          >
            <LinkIcon class="h-4 w-4" />
          </Button>
          <div class="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0"
            title="无序列表"
            @click="insertUnorderedList"
          >
            <List class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-8 p-0"
            title="有序列表"
            @click="insertOrderedList"
          >
            <ListOrdered class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- 编辑区 -->
      <TabsContent value="edit" class="m-0">
        <Textarea
          ref="textareaRef"
          v-model="localContent"
          :placeholder="placeholder"
          :readonly="readonly"
          class="min-h-[var(--min-height)] resize-none border-0 rounded-none focus-visible:ring-0 font-mono"
          :style="{ '--min-height': minHeight }"
          @keydown="handleKeyDown"
        />
      </TabsContent>

      <!-- 预览区 -->
      <TabsContent value="preview" class="m-0">
        <div
          class="prose prose-sm max-w-none p-6 min-h-[var(--min-height)] overflow-y-auto"
          :style="{ '--min-height': minHeight }"
          v-html="renderedHtml"
        />
      </TabsContent>
    </Tabs>

    <!-- 底部提示 -->
    <div class="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
      <span v-if="!readonly">支持 Markdown 语法 | 快捷键: Ctrl+B 加粗, Ctrl+I 斜体, Ctrl+K 链接, Ctrl+S 保存</span>
      <span v-else>只读模式</span>
    </div>
  </Card>
</template>

<style scoped>
/* 自定义滚动条 */
:deep(textarea) {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
}

:deep(textarea::-webkit-scrollbar) {
  width: 8px;
}

:deep(textarea::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(textarea::-webkit-scrollbar-thumb) {
  background-color: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}

:deep(textarea::-webkit-scrollbar-thumb:hover) {
  background-color: hsl(var(--muted-foreground) / 0.5);
}
</style>
