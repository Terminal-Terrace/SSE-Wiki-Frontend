<script setup lang="ts">
import type { ModuleModalState } from '@/types/module'
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
} from '@sse-wiki/ui'
import { AlertTriangle } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
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
const confirmationName = ref('')
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

// 计算属性
const isOpen = computed(() =>
  props.modalState.isOpen && props.modalState.type === 'delete',
)

const targetModule = computed(() => props.modalState.targetModule)

const canDelete = computed(() => {
  return confirmationName.value === targetModule.value?.name && !isSubmitting.value
})

// 监听模态框状态变化
watch(
  () => props.modalState,
  (newState) => {
    if (newState.isOpen && newState.type === 'delete') {
      resetForm()
    }
  },
  { immediate: true },
)

// 重置表单
function resetForm() {
  confirmationName.value = ''
  errors.value = {}
  isSubmitting.value = false
}

// 清除错误
function clearError(field: string) {
  delete errors.value[field]
}

// 验证删除确认
function validateDelete() {
  errors.value = {}

  if (confirmationName.value !== targetModule.value?.name) {
    errors.value.confirmation = '模块名称不匹配'
  }

  return Object.keys(errors.value).length === 0
}

// 处理删除
async function handleDelete() {
  if (!validateDelete() || !targetModule.value)
    return

  try {
    isSubmitting.value = true
    await moduleStore.deleteModule(targetModule.value.id)
    emit('success')
  }
  catch (error) {
    console.error('删除失败:', error)
    errors.value.confirmation = error instanceof Error ? error.message : '删除失败'
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
        <DialogTitle class="flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-destructive" />
          删除模块
        </DialogTitle>
        <DialogDescription>
          确定要删除模块「{{ targetModule?.name }}」吗？此操作将同时删除该模块下的所有子模块和文章，且不可撤销。
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="bg-destructive/10 p-3 rounded-md">
          <p class="text-sm text-muted-foreground mb-2">
            此操作将同时删除：
          </p>
          <ul class="text-sm text-muted-foreground space-y-1">
            <li>• 该模块下的所有子模块</li>
            <li>• 该模块及子模块下的所有文章</li>
          </ul>
        </div>

        <div class="space-y-2">
          <Label for="confirm-name">
            请输入模块名称「<strong>{{ targetModule?.name }}</strong>」以确认删除：
          </Label>
          <Input
            id="confirm-name"
            v-model="confirmationName"
            placeholder="输入模块名称"
            :class="{ 'border-destructive': errors.confirmation }"
            @input="clearError('confirmation')"
          />
          <p v-if="errors.confirmation" class="text-sm text-destructive">
            {{ errors.confirmation }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('close')">
          取消
        </Button>
        <Button
          variant="destructive"
          :disabled="!canDelete || isSubmitting"
          :loading="isSubmitting"
          @click="handleDelete"
        >
          确认删除
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
