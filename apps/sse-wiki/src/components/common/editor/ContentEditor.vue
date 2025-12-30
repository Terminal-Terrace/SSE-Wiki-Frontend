<script setup lang="ts">
/**
 * 通用富文本编辑器组件 (基于 TipTap)
 */
import { TooltipProvider } from '@sse-wiki/ui'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { common, createLowlight } from 'lowlight'
import { ref, toRef, watch } from 'vue'
import EditorToolbar from './components/EditorToolbar.vue'
import UploadProgress from './components/UploadProgress.vue'
import { useFileUpload } from './composables'
import { FileCard } from './utils'
import { hydrateContent } from './utils/hydrateContent'

interface Props {
  modelValue?: string
  placeholder?: string
  minHeight?: string
  maxHeight?: string
  readonly?: boolean
  showToolbar?: boolean
  autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '开始编写内容...',
  minHeight: '300px',
  maxHeight: 'none',
  readonly: false,
  showToolbar: true,
  autofocus: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': [editor: any]
  'focus': [editor: any]
}>()

const readonlyRef = toRef(props, 'readonly')
const isInternalChange = ref(false)
const lastRawContent = ref('')
const lowlight = createLowlight(common)

// 编辑器实例
const editor = useEditor({
  content: '',
  editable: !props.readonly,
  autofocus: props.autofocus,
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    CodeBlockLowlight.configure({ lowlight }),
    Link.configure({ openOnClick: false }),
    Placeholder.configure({ placeholder: props.placeholder }),
    Typography,
    FileCard,
  ],
  onBlur: ({ editor: ed }) => emit('blur', ed),
  onFocus: ({ editor: ed }) => emit('focus', ed),
  editorProps: {
    handleDrop: (view, event, _slice, moved) => {
      if (readonlyRef.value || moved)
        return false
      const files = event.dataTransfer?.files
      if (!files?.length)
        return false
      event.preventDefault()
      const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
      if (pos)
        handleFileDrop(Array.from(files), pos.pos)
      return true
    },
    handlePaste: (view, event) => {
      if (readonlyRef.value)
        return false
      const files = event.clipboardData?.files
      if (!files?.length)
        return false
      event.preventDefault()
      handleFileDrop(Array.from(files), view.state.selection.from)
      return true
    },
  },
})

// 监听 transaction
watch(editor, (ed) => {
  if (!ed)
    return
  ed.on('transaction', ({ transaction }) => {
    if (!transaction.docChanged)
      return
    isInternalChange.value = true
    emit('update:modelValue', ed.getHTML())
  })
}, { immediate: true })

// 监听 readonly
watch(readonlyRef, (val) => {
  editor.value?.setEditable(!val)
})

// 监听外部 modelValue 变化
watch(() => props.modelValue, async (newValue) => {
  if (isInternalChange.value) {
    isInternalChange.value = false
    return
  }
  const raw = newValue || ''
  if (raw === lastRawContent.value)
    return
  lastRawContent.value = raw
  if (editor.value) {
    const hydrated = await hydrateContent(raw)
    editor.value.commands.setContent(hydrated || '')
  }
})

// 初始水合
watch(editor, async (ed) => {
  if (!ed)
    return
  const raw = props.modelValue || ''
  if (raw && raw !== lastRawContent.value) {
    lastRawContent.value = raw
    const hydrated = await hydrateContent(raw)
    ed.commands.setContent(hydrated || '')
  }
}, { immediate: true })

// 文件上传
const { uploadQueue, addFiles, retryTask, removeTask } = useFileUpload({
  onSuccess: (task) => {
    if (!editor.value || !task.result)
      return
    const commands = editor.value.commands as any
    commands.setFileCard({
      fileId: task.result.fileId,
      fileName: task.result.fileName,
      fileSize: task.result.fileSize,
      fileType: task.result.fileType,
      fileUrl: task.result.fileUrl,
      category: task.result.category,
    })
  },
})

function handleFileDrop(files: File[], position: number) {
  if (!editor.value || !files.length)
    return
  editor.value.commands.setTextSelection(position)
  addFiles(files)
}

function triggerFileUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files
    if (files?.length) {
      const pos = editor.value?.state.selection.from ?? 0
      handleFileDrop(Array.from(files), pos)
    }
  }
  input.click()
}
</script>

<template>
  <TooltipProvider>
    <div class="rich-text-editor border rounded-lg overflow-hidden">
      <EditorToolbar
        v-if="showToolbar && !readonly"
        :editor="editor"
        @upload-click="triggerFileUpload"
      />
      <UploadProgress
        :tasks="uploadQueue"
        @retry="retryTask"
        @remove="removeTask"
      />
      <EditorContent
        :editor="editor"
        class="editor-content prose max-w-none p-4 focus:outline-none overflow-y-auto"
        :style="{ minHeight, maxHeight }"
      />
    </div>
  </TooltipProvider>
</template>

<style scoped lang="scss">
.rich-text-editor {
  display: flex;
  flex-direction: column;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
}

.editor-content :deep(.ProseMirror) {
  outline: none;

  p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  h1 {
    @apply text-3xl font-bold mb-4 mt-6;
  }
  h2 {
    @apply text-2xl font-semibold mb-3 mt-5;
  }
  h3 {
    @apply text-xl font-semibold mb-2 mt-4;
  }
  p {
    @apply mb-3;
  }
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
  blockquote {
    @apply border-l-4 border-primary/50 pl-4 py-2 my-4 italic text-muted-foreground;
  }
  code {
    @apply bg-muted px-1.5 py-0.5 rounded text-sm font-mono;
  }
  pre {
    @apply bg-muted p-4 rounded-md my-4 overflow-x-auto;
    code {
      @apply bg-transparent p-0;
    }
  }
  a {
    @apply text-primary underline cursor-pointer;
  }
  hr {
    @apply my-6 border-border;
  }
  strong {
    @apply font-semibold;
  }
  em {
    @apply italic;
  }
  s {
    @apply line-through;
  }
}
</style>
