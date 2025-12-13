<script setup lang="ts">
/**
 * 文章协作者管理模态框
 * 基于通用 CollaboratorsModal 组件封装
 */
import type { ArticleRole } from '@/types/article'
import { computed } from 'vue'
import CollaboratorsModal from '@/components/common/CollaboratorsModal.vue'
import { articleApi } from '@/services/articleApi'

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

// API 方法
async function fetchCollaborators() {
  if (!props.articleId)
    return []
  const data = await articleApi.getCollaborators(props.articleId)
  // 转换数据格式以匹配通用组件
  // API 返回的数据结构: { user_id, username, avatar, role, created_at }
  return (data || []).map(c => ({
    user_id: c.user_id,
    username: c.username,
    avatar: c.avatar,
    role: c.role,
    created_at: c.created_at,
  }))
}

async function addCollaborator(userId: number, role: string) {
  if (!props.articleId)
    throw new Error('文章ID无效')
  await articleApi.addCollaborator(props.articleId, {
    user_id: userId,
    role: role as ArticleRole,
  })
}

async function removeCollaborator(userId: number) {
  if (!props.articleId)
    throw new Error('文章ID无效')
  await articleApi.removeCollaborator(props.articleId, userId)
}

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
    :fetch-collaborators="fetchCollaborators"
    :add-collaborator="addCollaborator"
    :remove-collaborator="removeCollaborator"
    @success="handleSuccess"
  />
</template>
