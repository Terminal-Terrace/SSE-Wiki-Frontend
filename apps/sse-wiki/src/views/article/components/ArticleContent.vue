<script setup lang="ts">
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import StarterKit from '@tiptap/starter-kit'
/**
 * 文章内容渲染组件
 *
 * 使用 TipTap 只读编辑器渲染内容，确保：
 * 1. 自定义节点（如文件卡片）正确显示
 * 2. 保持与编辑器一致的样式
 * 3. 支持所有 TipTap 扩展功能
 */
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { common, createLowlight } from 'lowlight'
import { onBeforeUnmount, watch } from 'vue'
import { FileCard } from '@/components/common/editor/utils'
import { hydrateContent } from '@/utils/editor/hydrateContent'

interface Props {
  content: string
}

const props = defineProps<Props>()

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

// 监听 content 变化，水合占位符
watch(
  () => props.content,
  async (newContent) => {
    if (!editor.value || !newContent)
      return

    try {
      // 水合内容：将占位符替换为 file-card
      const hydratedHtml = await hydrateContent(newContent)

      if (hydratedHtml !== editor.value.getHTML()) {
        editor.value.commands.setContent(hydratedHtml)
      }
    }
    catch (error) {
      console.error('Failed to hydrate content:', error)
      // 如果水合失败，直接设置原始内容
      editor.value.commands.setContent(newContent)
    }
  },
  { immediate: true }, // 立即执行一次，处理初始内容
)

// 清理
onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="article-content">
    <EditorContent
      :editor="editor"
      class="prose prose-slate dark:prose-invert max-w-none"
    />
  </div>
</template>

<style scoped lang="scss">
.article-content {
  /* 文章内容容器样式 */

  :deep(.ProseMirror) {
    outline: none;

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
}
</style>
