import type { ModuleTreeNode } from '@/types/module'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * 模块权限检查 Composable
 *
 * 权限规则（基于 module.role 字段）：
 * - role="owner": 模块所有者，拥有所有权限
 * - role="admin": 模块管理员，可以编辑、管理协作者（添加/移除 moderator）、创建子模块
 * - role="moderator": 模块协作者，可以编辑模块、创建子模块，但不能管理协作者
 * - role="": 无权限
 *
 * 全局 admin（JWT role="admin"）对所有模块都有 admin 权限
 */
export function useModulePermission(module?: ModuleTreeNode | null) {
  const authStore = useAuthStore()

  // 当前用户是否为全局管理员
  const isGlobalAdmin = computed(() => authStore.isAdmin)

  // 当前用户在该模块的角色
  const moduleRole = computed(() => module?.role || '')

  // 当前用户是否为该模块的 owner
  const isOwner = computed(() => moduleRole.value === 'owner')

  // 当前用户是否为该模块的 admin 协作者
  const isModuleAdmin = computed(() => moduleRole.value === 'admin')

  // 当前用户是否为该模块的 moderator 协作者
  const isModerator = computed(() => moduleRole.value === 'moderator')

  // 是否有任何权限
  const hasPermission = computed(() => moduleRole.value !== '')

  // 是否可以编辑模块（owner、admin、moderator 都可以编辑）
  const canEdit = computed(() => {
    return isOwner.value || isModuleAdmin.value || isModerator.value
  })

  // 是否可以删除模块（owner 或 全局管理员 可以删除）
  const canDelete = computed(() => {
    return isOwner.value || isGlobalAdmin.value
  })

  // 是否可以管理协作者（owner、admin 可以管理，moderator 只能查看）
  const canManageCollaborators = computed(() => {
    return isOwner.value || isModuleAdmin.value
  })

  // 是否可以查看协作者列表（owner、admin、moderator 都可以查看）
  const canViewCollaborators = computed(() => {
    return hasPermission.value
  })

  // 是否可以创建子模块（owner、admin、moderator 都可以创建）
  const canCreateChild = computed(() => {
    return isOwner.value || isModuleAdmin.value || isModerator.value
  })

  // 是否可以创建顶级模块（仅全局管理员）
  const canCreateTopLevel = computed(() => {
    return isGlobalAdmin.value
  })

  return {
    isGlobalAdmin,
    moduleRole,
    isOwner,
    isModuleAdmin,
    isModerator,
    hasPermission,
    canEdit,
    canDelete,
    canManageCollaborators,
    canViewCollaborators,
    canCreateChild,
    canCreateTopLevel,
  }
}
