<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  content: string
}

const props = defineProps<Props>()

// TODO: 实现真正的 Markdown 渲染，可以使用 marked 或 markdown-it
const renderedContent = computed(() => {
  // 临时简单的文本渲染
  return `<div class="text-foreground">${props.content}</div>`
})
</script>

<template>
  <div class="prose prose-slate dark:prose-invert max-w-none">
    <div v-html="renderedContent" />
  </div>
</template>
