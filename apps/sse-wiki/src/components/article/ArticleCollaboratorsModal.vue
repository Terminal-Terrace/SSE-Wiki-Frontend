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
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  currentUserRole: null,
})
const emit = defineEmits<Emits>()

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
    :current-user-role="currentUserRole"
    :fetch-collaborators="fetchCollaborators"
    :add-collaborator="addCollaborator"
    :remove-collaborator="removeCollaborator"
    @success="handleSuccess"
  />
</template>
