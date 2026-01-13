<script setup lang="ts">
import type { Module, ModuleModalState, ModuleTreeNode } from '@/types/module'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@sse-wiki/ui'
import { computed, nextTick, ref, watch } from 'vue'
import { useModuleStore } from '@/stores/module'

interface Props {
  modalState: ModuleModalState
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const moduleStore = useModuleStore()

// 响应式状态
const formData = ref({ name: '', description: '' })
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

// 计算属性
const isOpen = computed(() =>
  props.modalState.isOpen && (props.modalState.type === 'create' || props.modalState.type === 'edit'),
)

const isCreateModal = computed(() => props.modalState.type === 'create')

const targetModule = computed(() => props.modalState.targetModule)

function resolveModuleName(mod?: Module | ModuleTreeNode) {
  if (!mod)
    return ''
  return mod.name ?? ''
}

const parentModuleName = computed(() => resolveModuleName(props.modalState.parentModule))

const canSubmit = computed(() => {
  return formData.value.name.trim().length > 0 && !isSubmitting.value
})

// 监听模态框状态变化
watch(
  () => props.modalState,
  (newState) => {
    if (newState.isOpen && (newState.type === 'create' || newState.type === 'edit')) {
      resetForm()

      // 如果是编辑模式，填充现有数据
      if (newState.type === 'edit' && newState.targetModule) {
        formData.value.name = resolveModuleName(newState.targetModule)
        formData.value.description = newState.targetModule.description || ''
      }

      // 自动聚焦输入框
      nextTick(() => {
        const input = document.querySelector('#module-name') as HTMLInputElement
        if (input) {
          input.focus()
        }
      })
    }
  },
  { immediate: true },
)

// 重置表单
function resetForm() {
  formData.value = { name: '', description: '' }
  errors.value = {}
  isSubmitting.value = false
}

// 清除错误
function clearError(field: string) {
  delete errors.value[field]
}

// 验证表单
function validateForm() {
  errors.value = {}

  if (!formData.value.name.trim()) {
    errors.value.name = '模块名称不能为空'
  }
  else if (formData.value.name.trim().length > 100) {
    errors.value.name = '模块名称不能超过100个字符'
  }

  if (formData.value.description.trim().length > 512) {
    errors.value.description = '模块描述不能超过512个字符'
  }

  return Object.keys(errors.value).length === 0
}

// 处理提交
async function handleSubmit() {
  if (!validateForm())
    return

  try {
    isSubmitting.value = true

    const trimmedDescription = formData.value.description.trim()
    const payloadDescription = trimmedDescription.length > 0 ? trimmedDescription : undefined

    if (isCreateModal.value) {
      const payload = {
        name: formData.value.name.trim(),
        parentId: props.modalState.parentModule?.id,
      } as { name: string, description?: string, parentId?: number }

      if (payloadDescription !== undefined)
        payload.description = payloadDescription

      await moduleStore.createModule(payload)
    }
    else {
      if (!targetModule.value) {
        throw new Error('目标模块不存在')
      }

      const payload = {
        name: formData.value.name.trim(),
      } as { name?: string, description?: string }

      if (payloadDescription !== undefined)
        payload.description = payloadDescription

      await moduleStore.updateModule(targetModule.value.id, payload)
    }

    emit('success')
  }
  catch (error) {
    console.error('操作失败:', error)
    errors.value.submit = error instanceof Error ? error.message : '操作失败'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ isCreateModal ? '创建模块' : '编辑模块' }}</DialogTitle>
        <DialogDescription v-if="isCreateModal && parentModuleName">
          在「{{ parentModuleName }}」下创建子模块
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="module-name">模块名称</Label>
          <Input
            id="module-name"
            v-model="formData.name"
            placeholder="请输入模块名称"
            :class="{ 'border-destructive': errors.name }"
            @keyup.enter="handleSubmit"
            @input="clearError('name')"
          />
          <p v-if="errors.name" class="text-sm text-destructive">
            {{ errors.name }}
          </p>
        </div>
        <div class="space-y-2">
          <Label for="module-description">模块描述（可选）</Label>
          <Textarea
            id="module-description"
            v-model="formData.description"
            placeholder="请输入模块描述（不超过512字符，可不填）"
            :class="{ 'border-destructive': errors.description }"
            @input="clearError('description')"
          />
          <p v-if="errors.description" class="text-sm text-destructive">
            {{ errors.description }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('close')">
          取消
        </Button>
        <Button
          :disabled="!canSubmit || isSubmitting"
          :loading="isSubmitting"
          @click="handleSubmit"
        >
          {{ isCreateModal ? '创建' : '保存' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
