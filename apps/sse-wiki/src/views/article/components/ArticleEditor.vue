<script setup lang="ts">
import type { Page } from '@/types'
import { Button, Input, Label, toast } from '@sse-wiki/ui'
import { ref, watch } from 'vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ContentEditor from '@/components/common/editor/ContentEditor.vue'
import { useUnsavedChangesWarning } from '@/composables/useUnsavedChangesWarning'

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

const initialContent = ref(props.page.content || '')
const isSaving = ref(false)

// 检测内容是否被修改
function hasUnsavedChanges() {
  return formData.value.content !== initialContent.value && !isSaving.value
}

// 使用未保存内容警告 Hook
const { showConfirmDialog: showLeaveConfirm, confirmLeave, cancelLeave } = useUnsavedChangesWarning(hasUnsavedChanges)

// 取消编辑确认对话框（单独的）
const showCancelConfirm = ref(false)

watch(() => props.page, (newPage) => {
  formData.value.content = newPage.content || ''
  formData.value.commitMessage = ''
  initialContent.value = newPage.content || ''
})

// 确认取消编辑
function confirmCancelEdit() {
  showCancelConfirm.value = false
  emit('cancel')
}

function cancelCancelEdit() {
  showCancelConfirm.value = false
}

function handleSave() {
  if (!formData.value.commitMessage.trim()) {
    toast({
      title: '请填写提交说明',
      variant: 'destructive',
    })
    return
  }

  isSaving.value = true
  emit('save', {
    content: formData.value.content,
    commitMessage: formData.value.commitMessage,
  })

  // 保存成功后重置状态（假设父组件会处理成功后的逻辑）
  setTimeout(() => {
    isSaving.value = false
    initialContent.value = formData.value.content
  }, 1000)
}

function handleCancel() {
  if (hasUnsavedChanges()) {
    showCancelConfirm.value = true
    return
  }
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

    <!-- 路由离开确认对话框 -->
    <ConfirmDialog
      v-model:open="showLeaveConfirm"
      title="确认离开？"
      description="您有未保存的修改，离开后这些修改将会丢失。确定要离开吗？"
      confirm-text="放弃修改"
      cancel-text="继续编辑"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />

    <!-- 取消编辑确认对话框 -->
    <ConfirmDialog
      v-model:open="showCancelConfirm"
      title="确认取消？"
      description="您有未保存的修改，取消后这些修改将会丢失。确定要取消编辑吗？"
      confirm-text="确认取消"
      cancel-text="继续编辑"
      @confirm="confirmCancelEdit"
      @cancel="cancelCancelEdit"
    />
  </div>
</template>
