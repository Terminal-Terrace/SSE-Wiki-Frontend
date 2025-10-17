<script setup lang="ts">
import type { Page, Tag } from '@/types'
import { Button, Input, Label, toast } from '@sse-wiki/ui'
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
  tags: props.page.tags || [],
  commitMessage: '',
})

const newTag = ref('')

watch(() => props.page, (newPage) => {
  formData.value.title = newPage.title || ''
  formData.value.content = newPage.content || ''
  formData.value.tags = newPage.tags || []
  formData.value.commitMessage = ''
  newTag.value = ''
})

function addTag() {
  const tagName = newTag.value.trim()
  if (tagName && !formData.value.tags.some(tag => tag.name === tagName)) {
    formData.value.tags.push({ id: tagName, name: tagName }) // Use name as temp id
    newTag.value = ''
  }
}

function removeTag(tagToRemove: Tag) {
  formData.value.tags = formData.value.tags.filter(tag => tag.name !== tagToRemove.name)
}

function handleSave() {
  if (!formData.value.commitMessage.trim()) {
    toast({
      title: '请填写提交说明',
      variant: 'destructive',
    })
    return
  }

  emit('save', {
    title: formData.value.title,
    content: formData.value.content,
    tags: formData.value.tags,
    commitMessage: formData.value.commitMessage,
  })
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="space-y-8 pb-6">
    <div class="space-y-4">
      <div class="flex items-center justify-center gap-8">
        <h1 class="m-0">
          标题
        </h1>
        <Input
          id="edit-title"
          v-model="formData.title"
          type="text"
          placeholder="输入标题"
          readonly
          disabled
          class="text-lg h-12 w-[60vw] border-gray-500 border-2"
        />
      </div>
      <p class="text-muted-foreground">
        注意：标题不可修改
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label for="edit-tags" class="text-base">标签</Label>
          <div class="flex items-center gap-2 mt-1">
            <Input
              id="edit-tags"
              v-model="newTag"
              type="text"
              placeholder="输入新标签"
              class="flex-grow"
              @keydown.enter.prevent="addTag"
            />
            <Button variant="outline" @click="addTag">
              添加
            </Button>
          </div>
          <div v-if="formData.tags.length" class="flex flex-wrap gap-2 mt-3">
            <span
              v-for="tag in formData.tags"
              :key="tag.id"
              class="flex items-center gap-1.5 bg-secondary text-secondary-foreground text-sm px-2.5 py-1 rounded-full"
            >
              {{ tag.name }}
              <button class="rounded-full hover:bg-secondary-foreground/20" @click="removeTag(tag)">
                <X class="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            添加相关标签以提高可发现性。
          </p>
        </div>

        <div>
          <Label for="edit-commit" class="text-base">提交说明 *</Label>
          <Input
            id="edit-commit"
            v-model="formData.commitMessage"
            type="text"
            placeholder="描述本次修改的内容..."
            required
            class="mt-1"
          />
          <p class="text-xs text-muted-foreground mt-2">
            简要说明您所做的更改。
          </p>
        </div>
      </div>

      <div>
        <Label for="edit-content" class="text-base">内容</Label>
        <div class="mt-1 border rounded-md">
          <ArticleEditor v-model="formData.content" />
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t">
      <Button variant="outline" size="lg" @click="handleCancel">
        取消
      </Button>
      <Button size="lg" @click="handleSave">
        保存并提交审核
      </Button>
    </div>
  </div>
</template>
