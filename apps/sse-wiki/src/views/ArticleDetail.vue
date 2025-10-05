<script setup lang="ts">
import { toRefs } from 'vue'

interface Props {
  articleId: string
}

const props = defineProps<Props>()
const { articleId } = toRefs(props)
</script>

<template>
  <div class="p-6">
    <div class="mx-auto max-w-4xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        文章详情页面
      </h1>
      <p class="text-gray-700 mb-4">
        文章ID: {{ articleId }}
      </p>
      <p class="text-gray-500 italic">
        这是文章详情页面的占位符，等待后续实现。
      </p>
    </div>
  </div>
</template>
