<script setup lang="ts">
import type { Page } from '@/types'
import { Input, Label, toast } from '@sse-wiki/ui'
import { ref, watch } from 'vue'
import ArticleEditor from './ArticleEditor.vue'

interface Props {
  page: Page
}

const props = defineProps<Props>()
const emit = defineEmits<{
  save: [data: Partial<Page> & { commitMessage?: string }]
  cancel: []
}>()

const formData = ref({
  title: props.page.title || '',
  content: props.page.content || '',
  tags: props.page.tags?.map(t => t.name).join(', ') || '',
  commitMessage: '',
})

watch(() => props.page, (newPage) => {
  formData.value.title = newPage.title || ''
  formData.value.content = newPage.content || ''
  formData.value.tags = newPage.tags?.map(t => t.name).join(', ') || ''
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

  // 将逗号分隔的标签字符串转换为 Tag[] 格式
  const tagsArray = formData.value.tags
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .map(name => ({ id: name, name })) // 使用名称作为临时 ID

  emit('save', {
    title: formData.value.title,
    content: formData.value.content,
    tags: tagsArray,
    commitMessage: formData.value.commitMessage,
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div class="space-y-6 pb-6">
      <div class="bg-muted/50 border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">
          编辑页面
        </h2>

        <div class="space-y-4">
          <div>
            <Label for="edit-title">标题</Label>
            <Input
              id="edit-title"
              v-model="formData.title"
              type="text"
              placeholder="输入标题"
              readonly
              disabled
              class="bg-muted"
            />
            <p class="text-xs text-muted-foreground mt-1">
              注意：标题不可修改
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label for="edit-tags">标签</Label>
              <Input
                id="edit-tags"
                v-model="formData.tags"
                type="text"
                placeholder="输入标签，用逗号分隔"
              />
              <p class="text-xs text-muted-foreground mt-1">
                多个标签用逗号（,）分隔
              </p>
            </div>

            <div>
              <Label for="edit-commit">提交说明 *</Label>
              <Input
                id="edit-commit"
                v-model="formData.commitMessage"
                type="text"
                placeholder="描述本次修改的内容..."
                required
              />
            </div>
          </div>

          <div>
            <Label for="edit-content">内容</Label>
            <ArticleEditor v-model="formData.content" />
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
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
              保存并提交审核
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
