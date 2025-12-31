<script setup lang="ts">
/**
 * 文章内容渲染组件
 *
 * 使用 RichViewer 只读组件渲染内容
 */
// 延迟加载 RichViewer：减少初始 bundle 大小
import { defineAsyncComponent } from 'vue'
import { createFileHandlers } from '@/utils/editorFileHandlers'
import '@sse-wiki/vue-rich-editor/styles'

interface Props {
  content: string
}

const props = defineProps<Props>()

const RichViewer = defineAsyncComponent(() =>
  import('@sse-wiki/vue-rich-editor').then(m => m.RichViewer),
)

const fileHandlers = createFileHandlers()
</script>

<template>
  <div class="article-content">
    <RichViewer
      :content="props.content"
      :file-handlers="{ getFileInfo: fileHandlers.getFileInfo }"
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
