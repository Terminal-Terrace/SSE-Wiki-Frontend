<script setup lang="ts">
import { toRefs } from 'vue'
import { useRoute } from 'vue-router'
import articleEdit from '@/components/edit/articleEdit.vue'

interface Props {
  articleId?: string
}

const props = defineProps<Props>()
const route = useRoute()

const { articleId } = toRefs(props)
const moduleId = route.query.moduleId as string
</script>

<template>
  <div>
    <div class="mx-auto max-w-5xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">
        文章编辑器
      </h1>
      <div class="space-y-4 mb-6">
        <p v-if="articleId" class="text-gray-700">
          编辑文章ID: {{ articleId }}
        </p>
        <p v-else class="text-gray-700">
          创建新文章
        </p>
        <p v-if="moduleId" class="text-gray-700">
          所属模块ID: {{ moduleId }}
        </p>
      </div>
    </div>
    <articleEdit />
  </div>
</template>
