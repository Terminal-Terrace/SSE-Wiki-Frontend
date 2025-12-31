<script setup lang="ts">
import type { RichViewerProps } from '../types'
/**
 * RichViewer 组件 - 只读的富文本查看器
 * 支持内容水合（通过 fileHandlers.getFileInfo 注入）
 */
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { common, createLowlight } from 'lowlight'
import { toRef } from 'vue'
import { useContentHydration } from '../composables'
import { FileCard } from '../extensions/FileCardExtension'

const props = defineProps<RichViewerProps>()

const lowlight = createLowlight(common)

// 创建只读编辑器实例
const editor = useEditor({
  content: props.content || '',
  editable: false, // 只读模式
  extensions: [
    StarterKit.configure({
      codeBlock: false,
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
    Link.configure({
      openOnClick: true, // 预览模式下可以直接点击链接
      HTMLAttributes: {
        class: 'text-primary underline cursor-pointer',
      },
    }),
    Typography,
    FileCard, // 文件卡片扩展
  ],
})

// 内容水合 - 使用 composable 统一处理初始化和后续变化
useContentHydration({
  editor,
  initialContent: toRef(props, 'content'),
  getFileInfo: props.fileHandlers?.getFileInfo,
})
</script>

<template>
  <div class="vre-rich-viewer">
    <EditorContent
      :editor="editor"
      class="vre-viewer-content prose max-w-none p-4"
    />
  </div>
</template>

<style scoped lang="scss">
.vre-rich-viewer {
  width: 100%;
}

.vre-viewer-content :deep(.ProseMirror) {
  outline: none;

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
