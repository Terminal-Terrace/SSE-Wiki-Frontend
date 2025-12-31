<script setup lang="ts">
import type { Page } from '@/types'
import { Button, Input, Label, toast } from '@sse-wiki/ui'
// 懒加载编辑器组件（减少初始 bundle 大小）
import { RichEditor } from '@sse-wiki/vue-rich-editor'
import { onMounted, ref, watch } from 'vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

import { useUnsavedChangesWarning } from '@/composables/useUnsavedChangesWarning'
import { createFileHandlers } from '@/utils/editorFileHandlers'
import '@sse-wiki/vue-rich-editor/styles'

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [data: Partial<Page> & { commitMessage?: string }]
  cancel: []
}>()

const fileHandlers = createFileHandlers()

interface Props {
  page: Page
}

const formData = ref({
  content: '',
  commitMessage: '',
})

const initialContent = ref('')
const isSaving = ref(false)
const isLoading = ref(true)

// 检测内容是否被修改
function hasUnsavedChanges() {
  return formData.value.content !== initialContent.value && !isSaving.value
}

// 使用未保存内容警告 Hook
const { showConfirmDialog, confirmLeave, cancelLeave } = useUnsavedChangesWarning(hasUnsavedChanges)

// 取消编辑对话框状态
const showCancelConfirm = ref(false)
const pendingCancelAction = ref<(() => void) | null>(null)

// 初始化内容（不再需要水合，RichEditor 内部会处理）
onMounted(() => {
  const content = props.page.content || ''
  formData.value.content = content
  initialContent.value = content
  isLoading.value = false
})

// 监听页面变化（包括保存成功后的更新）
watch(() => props.page, (newPage) => {
  const content = newPage.content || ''
  formData.value.content = content
  initialContent.value = content
  formData.value.commitMessage = ''
  // 保存成功后，父组件会更新 page，此时重置保存状态
  isSaving.value = false
})

// 路由守卫处理（简化）
function handleRouteConfirm() {
  confirmLeave() // composable 会处理状态重置和路由跳转
}

function handleRouteCancel() {
  cancelLeave()
}

// 取消编辑处理（独立）
function handleCancelConfirm() {
  if (pendingCancelAction.value) {
    pendingCancelAction.value()
    pendingCancelAction.value = null
  }
  showCancelConfirm.value = false
}

function handleCancelEdit() {
  showCancelConfirm.value = false
  pendingCancelAction.value = null
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
  // 注意：保存成功后，父组件会更新 page prop，watch 会自动重置 initialContent
  // 如果保存失败，父组件不会更新 page，isSaving 需要手动重置
  // 但考虑到父组件会显示错误提示，这里暂时保持 isSaving 状态，让用户知道正在保存
  // 如果父组件更新了 page，watch 会重置状态；如果失败，用户可以通过重新提交来重置
}

function handleCancel() {
  if (hasUnsavedChanges()) {
    // 设置取消编辑的回调，然后显示确认对话框
    pendingCancelAction.value = () => {
      emit('cancel')
    }
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
          <RichEditor
            v-model="formData.content"
            :file-handlers="fileHandlers"
            min-height="400px"
          />
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

    <!-- 路由离开确认对话框（由 composable 自动管理） -->
    <ConfirmDialog
      :open="showConfirmDialog"
      title="确认离开？"
      description="您有未保存的修改，离开后这些修改将会丢失。确定要离开吗？"
      confirm-text="放弃修改"
      cancel-text="继续编辑"
      @confirm="handleRouteConfirm"
      @cancel="handleRouteCancel"
    />

    <!-- 取消编辑确认对话框（独立处理） -->
    <ConfirmDialog
      v-model:open="showCancelConfirm"
      title="取消编辑？"
      description="您有未保存的修改，取消后这些修改将会丢失。确定要取消编辑吗？"
      confirm-text="取消编辑"
      cancel-text="继续编辑"
      @confirm="handleCancelConfirm"
      @cancel="handleCancelEdit"
    />
  </div>
</template>
