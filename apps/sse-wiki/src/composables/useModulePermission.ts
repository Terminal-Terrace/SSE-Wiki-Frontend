import type { ModuleTreeNode } from '@/types/module'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * 模块权限检查 Composable
 *
 * 权限规则：
 * 1. 全局 admin 角色可以管理所有模块
 * 2. 模块的 owner 可以管理该模块（编辑、删除、管理协作者）
 * 3. 模块的 moderator（isModerator=true）可以编辑模块，但不能删除或管理协作者
 */
export function useModulePermission(module?: ModuleTreeNode | null) {
  const authStore = useAuthStore()

  // 当前用户是否为管理员
  const isAdmin = computed(() => {
    const admin = authStore.isAdmin
    return admin
  })

  // 当前用户ID
  const currentUserId = computed(() => authStore.user?.id)

  // 当前用户是否为该模块的 owner
  const isOwner = computed(() => {
    if (!module || !currentUserId.value)
      return false
    const owner = module.owner_id === currentUserId.value
    return owner
  })

  // 当前用户是否为该模块的协作者
  const isModerator = computed(() => {
    if (!module)
      return false
    const moderator = module.isModerator === true
    return moderator
  })

  // 是否可以编辑模块（重命名）
  const canEdit = computed(() => {
    return isAdmin.value || isOwner.value || isModerator.value
  })

  // 是否可以删除模块
  const canDelete = computed(() => {
    return isAdmin.value || isOwner.value
  })

  // 是否可以管理协作者
  const canManageCollaborators = computed(() => {
    return isAdmin.value || isOwner.value
  })

  // 是否可以创建子模块
  const canCreateChild = computed(() => {
    return isAdmin.value || isOwner.value || isModerator.value
  })

  // 是否可以创建顶级模块（仅管理员）
  const canCreateTopLevel = computed(() => {
    return isAdmin.value
  })

  return {
    isAdmin,
    isOwner,
    isModerator,
    canEdit,
    canDelete,
    canManageCollaborators,
    canCreateChild,
    canCreateTopLevel,
  }
}
