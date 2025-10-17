<script setup lang="ts">
import type { Page } from '@/types'
import ArticleEditCard from '@/components/ArticleEditCard.vue'

const page: Page = {
  id: 1,
  title: '示例页面标题',
  content: '# 示例页面\n\n这是页面的示例内容。',
  lastEditedAt: new Date().toISOString(),
  editor: {
    id: 1,
    username: '示例用户',
  },
  viewCount: 100,
  tags: [
    { id: 1, name: '示例' },
    { id: 2, name: '测试' },
  ],
  currentVersionId: 1,
}
</script>

<template>
  <div class="max-h-[92vh] overflow-y-auto w-full">
    <ArticleEditCard :page="page" />
  </div>
</template>
