<script setup lang="ts">
/**
 * 通用富文本编辑器组件 (基于 TipTap)
 *
 * 功能：
 * - 工具栏（加粗、斜体、标题、列表、代码等）
 * - Markdown 快捷键支持
 * - 可配置（只读、占位符、高度等）
 * - v-model 双向绑定
 * - 自定义扩展
 */
import { Button, Separator, ToggleGroup, ToggleGroupItem } from '@sse-wiki/ui'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { common, createLowlight } from 'lowlight'
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '开始编写内容...',
  minHeight: '300px',
  maxHeight: 'none',
  readonly: false,
  showToolbar: true,
  autofocus: false,
  enableMarkdown: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': [editor: any]
  'focus': [editor: any]
}>()

const lowlight = createLowlight(common)

interface Props {
  /**
   * 编辑器内容（v-model）
   */
  modelValue?: string
  /**
   * 占位符文本
   */
  placeholder?: string
  /**
   * 最小高度
   */
  minHeight?: string
  /**
   * 最大高度（超出滚动）
   */
  maxHeight?: string
  /**
   * 是否只读
   */
  readonly?: boolean
  /**
   * 是否显示工具栏
   */
  showToolbar?: boolean
  /**
   * 是否自动聚焦
   */
  autofocus?: boolean
  /**
   * 是否启用 Markdown 快捷键
   */
  enableMarkdown?: boolean
}

// 创建编辑器实例
const editor = useEditor({
  content: props.modelValue || '',
  editable: !props.readonly,
  autofocus: props.autofocus,
  extensions: [
    StarterKit.configure({
      codeBlock: false, // 禁用默认的代码块，使用 CodeBlockLowlight
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary underline cursor-pointer',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Typography, // 自动转换引号、省略号等
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
  },
  onBlur: ({ editor }) => {
    emit('blur', editor)
  },
  onFocus: ({ editor }) => {
    emit('focus', editor)
  },
})

// 监听外部 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue || '')
  }
})

// 监听 readonly 变化
watch(() => props.readonly, (readonly) => {
  if (editor.value) {
    editor.value.setEditable(!readonly)
  }
})

// 工具栏按钮状态
function isActive(name: string, attrs?: Record<string, any>) {
  return editor.value?.isActive(name, attrs) ?? false
}

const canUndo = computed(() => editor.value?.can().undo() ?? false)
const canRedo = computed(() => editor.value?.can().redo() ?? false)

// 工具栏操作
const toggleBold = () => editor.value?.chain().focus().toggleBold().run()
const toggleItalic = () => editor.value?.chain().focus().toggleItalic().run()
const toggleStrike = () => editor.value?.chain().focus().toggleStrike().run()
const toggleCode = () => editor.value?.chain().focus().toggleCode().run()
const toggleCodeBlock = () => editor.value?.chain().focus().toggleCodeBlock().run()
const toggleBlockquote = () => editor.value?.chain().focus().toggleBlockquote().run()
const toggleBulletList = () => editor.value?.chain().focus().toggleBulletList().run()
const toggleOrderedList = () => editor.value?.chain().focus().toggleOrderedList().run()

function setHeading(level: 1 | 2 | 3) {
  editor.value?.chain().focus().toggleHeading({ level }).run()
}

function setLink() {
  const url = window.prompt('输入链接地址:')
  if (url) {
    editor.value?.chain().focus().setLink({ href: url }).run()
  }
}

const undo = () => editor.value?.chain().focus().undo().run()
const redo = () => editor.value?.chain().focus().redo().run()

// 清理
onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="rich-text-editor border rounded-lg overflow-hidden">
    <!-- 工具栏 -->
    <div v-if="showToolbar && !readonly" class="toolbar border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center">
      <!-- 撤销/重做 -->
      <div class="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          :disabled="!canUndo"
          @click="undo"
        >
          <Undo class="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          :disabled="!canRedo"
          @click="redo"
        >
          <Redo class="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" class="h-6" />

      <!-- 标题 -->
      <ToggleGroup type="single" class="flex gap-1">
        <ToggleGroupItem
          value="h1"
          :pressed="isActive('heading', { level: 1 })"
          @click="setHeading(1)"
        >
          <Heading1 class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="h2"
          :pressed="isActive('heading', { level: 2 })"
          @click="setHeading(2)"
        >
          <Heading2 class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="h3"
          :pressed="isActive('heading', { level: 3 })"
          @click="setHeading(3)"
        >
          <Heading3 class="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" class="h-6" />

      <!-- 文本样式 -->
      <ToggleGroup type="multiple" class="flex gap-1">
        <ToggleGroupItem
          value="bold"
          :pressed="isActive('bold')"
          @click="toggleBold"
        >
          <Bold class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="italic"
          :pressed="isActive('italic')"
          @click="toggleItalic"
        >
          <Italic class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="strike"
          :pressed="isActive('strike')"
          @click="toggleStrike"
        >
          <Strikethrough class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="code"
          :pressed="isActive('code')"
          @click="toggleCode"
        >
          <Code class="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" class="h-6" />

      <!-- 列表和引用 -->
      <ToggleGroup type="multiple" class="flex gap-1">
        <ToggleGroupItem
          value="bulletList"
          :pressed="isActive('bulletList')"
          @click="toggleBulletList"
        >
          <List class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="orderedList"
          :pressed="isActive('orderedList')"
          @click="toggleOrderedList"
        >
          <ListOrdered class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="blockquote"
          :pressed="isActive('blockquote')"
          @click="toggleBlockquote"
        >
          <Quote class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="codeBlock"
          :pressed="isActive('codeBlock')"
          @click="toggleCodeBlock"
        >
          <Code2 class="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <Separator orientation="vertical" class="h-6" />

      <!-- 链接 -->
      <Button
        variant="ghost"
        size="sm"
        :class="{ 'bg-muted': isActive('link') }"
        @click="setLink"
      >
        <LinkIcon class="h-4 w-4" />
      </Button>
    </div>

    <!-- 编辑器内容区 -->
    <EditorContent
      :editor="editor"
      class="editor-content prose max-w-none p-4 focus:outline-none overflow-y-auto"
      :style="{
        minHeight,
        maxHeight,
      }"
    />
  </div>
</template>

<style scoped lang="scss">
.rich-text-editor {
  display: flex;
  flex-direction: column;
}

.toolbar {
  flex-shrink: 0;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
}

/* TipTap 编辑器样式 */
.editor-content :deep(.ProseMirror) {
  outline: none;

  /* 占位符样式 */
  p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  /* 标题样式 */
  h1 {
    @apply text-3xl font-bold leading-tight mb-4 mt-6;
  }

  h2 {
    @apply text-2xl font-semibold leading-snug mb-3 mt-5;
  }

  h3 {
    @apply text-xl font-semibold mb-2 mt-4;
  }

  h4 {
    @apply text-lg font-medium mb-2 mt-3;
  }

  h5 {
    @apply text-base font-medium mb-1.5 mt-2;
  }

  h6 {
    @apply text-sm font-medium mb-1 mt-2;
  }

  /* 段落 */
  p {
    @apply mb-3;
  }

  /* 列表 */
  ul,
  ol {
    @apply pl-6 mb-4;

    li {
      @apply mb-1;
    }
  }

  ul {
    list-style-type: disc;
  }

  ol {
    list-style-type: decimal;
  }

  /* 引用块 */
  blockquote {
    @apply border-l-4 border-primary/50 pl-4 py-2 my-4 italic text-muted-foreground;
  }

  /* 行内代码 */
  code {
    @apply bg-muted px-1.5 py-0.5 rounded text-sm font-mono;
  }

  /* 代码块 */
  pre {
    @apply bg-muted p-4 rounded-md my-4 overflow-x-auto;

    code {
      @apply bg-transparent p-0 text-sm;
      color: inherit;
    }
  }

  /* 链接 */
  a {
    @apply text-primary underline cursor-pointer;

    &:hover {
      @apply text-primary/80;
    }
  }

  /* 水平线 */
  hr {
    @apply my-6 border-border;
  }

  /* 加粗 */
  strong {
    @apply font-semibold;
  }

  /* 斜体 */
  em {
    @apply italic;
  }

  /* 删除线 */
  s {
    @apply line-through;
  }
}
</style>
