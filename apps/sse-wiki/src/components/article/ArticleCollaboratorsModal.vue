<script setup lang="ts">
/**
 * 文章协作者管理模态框
 * 基于通用 CollaboratorsModal 组件封装
 */
import type { ArticleRole } from '@/types/article'
import { computed } from 'vue'
import CollaboratorsModal from '@/components/common/CollaboratorsModal.vue'

interface Props {
  open: boolean
  articleId: number
  articleTitle: string
  currentUserRole?: ArticleRole | null
  /** 当前用户是否是文章作者（created_by == userID） */
  isAuthor?: boolean
  /** 文章创建者ID（用于在协作者列表中标识作者） */
  createdBy?: number | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  currentUserRole: null,
  isAuthor: false,
  createdBy: null,
})

const emit = defineEmits<Emits>()
// 计算有效角色：如果是作者，视为 admin 权限
const effectiveRole = computed(() => {
  if (props.isAuthor) {
    return 'admin' // 作者拥有最高权限
  }
  return props.currentUserRole
})
// 计算属性
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

function handleSuccess() {
  emit('success')
}
</script>

<template>
  <CollaboratorsModal
    v-model:open="isOpen"
    resource-type="article"
    :resource-id="articleId"
    :resource-name="articleTitle"
    :current-user-role="effectiveRole"
    :created-by="createdBy"
    @success="handleSuccess"
  />
</template>
