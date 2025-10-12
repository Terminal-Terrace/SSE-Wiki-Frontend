<script setup lang="ts">
import type { Page } from '@/types'
import { ref, watch } from 'vue'

interface Props {
  page: Page
}

const props = defineProps<Props>()
const emit = defineEmits<{
  save: [data: Partial<Page>]
  cancel: []
}>()

const formData = ref({
  title: props.page.title || '',
  content: props.page.content || '',
})

watch(() => props.page, (newPage) => {
  formData.value.title = newPage.title || ''
  formData.value.content = newPage.content || ''
})

function handleSave() {
  emit('save', formData.value)
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-muted/50 border border-border rounded-lg p-6">
      <h2 class="text-lg font-semibold mb-4">
        编辑页面
      </h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">标题</label>
          <input
            v-model="formData.title"
            type="text"
            class="w-full px-3 py-2 border border-input rounded-md bg-background"
            placeholder="输入标题"
          >
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">内容</label>
          <textarea
            v-model="formData.content"
            rows="20"
            class="w-full px-3 py-2 border border-input rounded-md bg-background font-mono text-sm"
            placeholder="输入 Markdown 内容..."
          />
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors"
            @click="handleCancel"
          >
            取消
          </button>
          <button
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            @click="handleSave"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
