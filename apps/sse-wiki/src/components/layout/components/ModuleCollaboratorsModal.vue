<script setup lang="ts">
/**
 * 模块协作者管理模态框
 * 基于通用 CollaboratorsModal 组件封装
 */
import type { ModuleModalState } from '@/types/module'
import { computed } from 'vue'
import CollaboratorsModal from '@/components/common/CollaboratorsModal.vue'
import { moduleApi } from '@/services/moduleApi'

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

const moduleId = computed(() => targetModule.value?.id || 0)
const moduleName = computed(() => targetModule.value?.name || targetModule.value?.module_name || '')

// API 方法
async function fetchCollaborators() {
  if (!moduleId.value)
    return []
  return moduleApi.getModerators(moduleId.value)
}

async function addCollaborator(userId: number, role: string) {
  if (!moduleId.value)
    throw new Error('模块ID无效')
  await moduleApi.addModerator(moduleId.value, {
    user_id: userId,
    role: role as 'admin' | 'moderator',
  })
}

async function removeCollaborator(userId: number) {
  if (!moduleId.value)
    throw new Error('模块ID无效')
  await moduleApi.removeModerator(moduleId.value, userId)
}

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
    :fetch-collaborators="fetchCollaborators"
    :add-collaborator="addCollaborator"
    :remove-collaborator="removeCollaborator"
    @success="handleSuccess"
  />
</template>
