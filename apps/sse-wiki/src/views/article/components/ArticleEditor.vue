<script setup lang="ts">
import type { Page } from '@/types'
import { Button, Input, Label, toast } from '@sse-wiki/ui'
import { ref, watch } from 'vue'
import ContentEditor from '@/components/common/editor/ContentEditor.vue'

interface Props {
  page: Page
}

const props = defineProps<Props>()
const emit = defineEmits<{
  save: [data: Partial<Page> & { commitMessage?: string }]
  cancel: []
}>()

const formData = ref({
  content: props.page.content || '',
  commitMessage: '',
})

watch(() => props.page, (newPage) => {
  formData.value.content = newPage.content || ''
  formData.value.commitMessage = ''
})

function handleSave() {
  if (!formData.value.commitMessage.trim()) {
    toast({
      title: '请填写提交说明',
      variant: 'destructive',
    })
    return
  }

  emit('save', {
    content: formData.value.content,
    commitMessage: formData.value.commitMessage,
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="space-y-6 pb-6">
    <div class="space-y-6">
      <!-- 提交说明（移到顶部） -->
      <div>
        <Label for="edit-commit" class="text-base font-semibold">
          提交说明 <span class="text-red-500">*</span>
        </Label>
        <Input
          id="edit-commit"
          v-model="formData.commitMessage"
          type="text"
          placeholder="描述本次修改的内容..."
          required
          class="mt-2"
        />
      </div>

      <!-- 内容编辑器 -->
      <div class="flex-1">
        <Label for="edit-content" class="text-base font-semibold">文章内容</Label>
        <div class="mt-2 border rounded-md">
          <ContentEditor v-model="formData.content" min-height="400px" />
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-end gap-3 pt-4 border-t">
      <Button variant="outline" size="lg" @click="handleCancel">
        取消
      </Button>
      <Button size="lg" @click="handleSave">
        提交
      </Button>
    </div>
  </div>
</template>
