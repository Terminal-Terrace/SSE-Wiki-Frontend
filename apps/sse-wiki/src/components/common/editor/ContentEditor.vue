<script setup lang="ts">
import type { UploadProgress } from '@/utils/fileUpload'
/**
 * 通用富文本编辑器组件 (基于 TipTap)
 *
 * 功能：
 * - 工具栏（加粗、斜体、标题、列表、代码等）
 * - Markdown 快捷键支持
 * - 可配置（只读、占位符、高度等）
 * - v-model 双向绑定
 * - 自定义扩展
 * - 拖拽上传文件
 */
import { Progress, Separator, ToggleGroup, TooltipProvider } from '@sse-wiki/ui'
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
  Upload,
  X,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { TooltipButton, TooltipToggleButton } from '@/components/common/tooltip'
import { uploadFile } from '@/utils/fileUpload'
import { FileCard } from './utils'

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

// 上传状态
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadFileName = ref('')
const uploadError = ref('')

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
    FileCard, // 文件卡片扩展
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
  editorProps: {
    handleDrop: (view, event, slice, moved) => {
      // 只读模式下禁用拖拽上传
      if (props.readonly)
        return false

      // 如果是移动操作，使用默认行为
      if (moved)
        return false

      // 获取拖放的文件
      const files = event.dataTransfer?.files
      if (!files || files.length === 0)
        return false

      // 阻止默认行为
      event.preventDefault()

      // 获取光标位置
      const coordinates = { left: event.clientX, top: event.clientY }
      const pos = view.posAtCoords(coordinates)
      if (!pos)
        return true

      // 处理文件上传
      handleFileDrop(Array.from(files), pos.pos)
      return true
    },
    handlePaste: (view, event) => {
      // 只读模式下禁用粘贴上传
      if (props.readonly)
        return false

      // 获取粘贴的文件
      const files = event.clipboardData?.files
      if (!files || files.length === 0)
        return false

      // 阻止默认行为
      event.preventDefault()

      // 在当前光标位置插入
      const pos = view.state.selection.from
      handleFileDrop(Array.from(files), pos)
      return true
    },
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

// 文件上传处理
async function handleFileDrop(files: File[], position: number) {
  if (!editor.value || files.length === 0)
    return

  // 设置光标位置
  editor.value.commands.setTextSelection(position)

  // 逐个上传文件
  for (const file of files) {
    try {
      uploading.value = true
      uploadError.value = ''
      uploadFileName.value = file.name
      uploadProgress.value = 0

      const fileInfo = await uploadFile(file, (progress: UploadProgress) => {
        uploadProgress.value = progress.percentage
      })

      // 插入文件卡片
      ;(editor.value.commands as any).setFileCard({
        fileId: fileInfo.fileId,
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        fileType: fileInfo.fileType,
        fileUrl: fileInfo.fileUrl,
        category: fileInfo.category,
      })

      // 上传成功后暂停一下，让用户看到进度
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    catch (error) {
      console.error('文件上传失败:', error)
      uploadError.value = error instanceof Error ? error.message : '上传失败'
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }
}

// 手动选择文件上传
function triggerFileUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = async (e) => {
    const files = (e.target as HTMLInputElement).files
    if (!files || files.length === 0)
      return

    // 在当前光标位置插入
    const pos = editor.value?.state.selection.from ?? 0
    await handleFileDrop(Array.from(files), pos)
  }
  input.click()
}

// 清理
onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <TooltipProvider>
    <div class="rich-text-editor border rounded-lg overflow-hidden">
      <!-- 工具栏 -->
      <div v-if="showToolbar && !readonly" class="toolbar border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center">
        <!-- 撤销/重做 -->
        <div class="flex gap-1">
          <TooltipButton
            :icon="Undo"
            tooltip="撤销 (Ctrl+Z)"
            :disabled="!canUndo"
            @click="undo"
          />
          <TooltipButton
            :icon="Redo"
            tooltip="重做 (Ctrl+Y)"
            :disabled="!canRedo"
            @click="redo"
          />
        </div>

        <Separator orientation="vertical" class="h-6" />

        <!-- 标题 -->
        <ToggleGroup type="single" class="flex gap-1">
          <TooltipToggleButton
            :icon="Heading1"
            value="h1"
            tooltip="一级标题"
            :pressed="isActive('heading', { level: 1 })"
            @click="setHeading(1)"
          />
          <TooltipToggleButton
            :icon="Heading2"
            value="h2"
            tooltip="二级标题"
            :pressed="isActive('heading', { level: 2 })"
            @click="setHeading(2)"
          />
          <TooltipToggleButton
            :icon="Heading3"
            value="h3"
            tooltip="三级标题"
            :pressed="isActive('heading', { level: 3 })"
            @click="setHeading(3)"
          />
        </ToggleGroup>

        <Separator orientation="vertical" class="h-6" />

        <!-- 文本样式 -->
        <ToggleGroup type="multiple" class="flex gap-1">
          <TooltipToggleButton
            :icon="Bold"
            value="bold"
            tooltip="加粗 (Ctrl+B)"
            :pressed="isActive('bold')"
            @click="toggleBold"
          />
          <TooltipToggleButton
            :icon="Italic"
            value="italic"
            tooltip="斜体 (Ctrl+I)"
            :pressed="isActive('italic')"
            @click="toggleItalic"
          />
          <TooltipToggleButton
            :icon="Strikethrough"
            value="strike"
            tooltip="删除线"
            :pressed="isActive('strike')"
            @click="toggleStrike"
          />
          <TooltipToggleButton
            :icon="Code"
            value="code"
            tooltip="行内代码"
            :pressed="isActive('code')"
            @click="toggleCode"
          />
        </ToggleGroup>

        <Separator orientation="vertical" class="h-6" />

        <!-- 列表和引用 -->
        <ToggleGroup type="multiple" class="flex gap-1">
          <TooltipToggleButton
            :icon="List"
            value="bulletList"
            tooltip="无序列表"
            :pressed="isActive('bulletList')"
            @click="toggleBulletList"
          />
          <TooltipToggleButton
            :icon="ListOrdered"
            value="orderedList"
            tooltip="有序列表"
            :pressed="isActive('orderedList')"
            @click="toggleOrderedList"
          />
          <TooltipToggleButton
            :icon="Quote"
            value="blockquote"
            tooltip="引用块"
            :pressed="isActive('blockquote')"
            @click="toggleBlockquote"
          />
          <TooltipToggleButton
            :icon="Code2"
            value="codeBlock"
            tooltip="代码块"
            :pressed="isActive('codeBlock')"
            @click="toggleCodeBlock"
          />
        </ToggleGroup>

        <Separator orientation="vertical" class="h-6" />

        <!-- 链接 -->
        <TooltipButton
          :icon="LinkIcon"
          tooltip="插入链接"
          :active="isActive('link')"
          @click="setLink"
        />

        <Separator orientation="vertical" class="h-6" />

        <!-- 上传文件 -->
        <TooltipButton
          :icon="Upload"
          @click="triggerFileUpload"
        >
          <template #tooltip>
            <div class="text-xs">
              <div class="font-medium mb-1">
                上传文件
              </div>
              <div class="text-muted-foreground">
                支持图片、PDF、文档等
              </div>
              <div class="text-muted-foreground">
                最大 50MB
              </div>
            </div>
          </template>
        </TooltipButton>
      </div>

      <!-- 上传进度条 -->
      <div
        v-if="uploading"
        class="upload-progress border-b bg-muted/50 p-3"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Upload class="h-4 w-4 animate-pulse text-primary" />
            <span class="text-sm font-medium">上传中: {{ uploadFileName }}</span>
          </div>
          <span class="text-sm text-muted-foreground">{{ uploadProgress }}%</span>
        </div>
        <Progress :model-value="uploadProgress" class="h-2" />
        <div v-if="uploadError" class="mt-2 text-sm text-destructive flex items-center gap-2">
          <X class="h-4 w-4" />
          {{ uploadError }}
        </div>
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
  </TooltipProvider>
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
