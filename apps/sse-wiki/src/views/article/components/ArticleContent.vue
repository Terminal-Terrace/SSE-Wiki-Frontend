<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  content: string
}

const props = defineProps<Props>()

/**
 * 渲染 HTML 内容
 *
 * 安全性说明：
 * - 当前内容来源为 TipTap 富文本编辑器，TipTap 内置了 XSS 防护机制
 * - TipTap 使用严格的 schema 定义，只允许安全的 HTML 标签和属性
 * - 如果未来需要支持其他来源的 HTML（如外部导入），必须先使用 DOMPurify 进行清理
 *
 * @see https://tiptap.dev/guide/security
 */
const renderedContent = computed(() => {
  // 直接返回 TipTap 生成的 HTML（已由编辑器保证安全）
  return props.content
})
</script>

<template>
  <div class="prose prose-slate dark:prose-invert max-w-none">
    <!--
      使用 v-html 渲染 TipTap 编辑器生成的 HTML
      TipTap 已提供 XSS 防护，无需额外 sanitization
    -->
    <div v-html="renderedContent" />
  </div>
</template>
