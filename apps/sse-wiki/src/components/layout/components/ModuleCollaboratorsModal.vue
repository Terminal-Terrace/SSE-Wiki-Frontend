<script setup lang="ts">
/**
 * 模块协作者管理模态框
 * 基于通用 CollaboratorsModal 组件封装
 */
import type { Module, ModuleModalState, ModuleTreeNode } from '@/types/module'
import { computed } from 'vue'
import CollaboratorsModal from '@/components/common/CollaboratorsModal.vue'

interface Props {
  modalState: ModuleModalState
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算属性
const isOpen = computed({
  get: () => props.modalState.isOpen && props.modalState.type === 'collaborators',
  set: (value) => {
    if (!value)
      emit('close')
  },
})

const targetModule = computed(() => props.modalState.targetModule)

function resolveModuleName(mod?: Module | ModuleTreeNode) {
  if (!mod)
    return ''
  return mod.name ?? ''
}

const moduleId = computed(() => targetModule.value?.id || 0)
const moduleName = computed(() => resolveModuleName(targetModule.value))

function handleSuccess() {
  emit('success')
}
</script>

<template>
  <CollaboratorsModal
    v-model:open="isOpen"
    resource-type="module"
    :resource-id="moduleId"
    :resource-name="moduleName"
    @success="handleSuccess"
  />
</template>
