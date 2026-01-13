// 模块相关类型定义

// ========== BFF 返回的 snake_case 类型（后端契约） ==========

export interface ModuleDTO {
  id: number
  module_name: string
  description: string
  parent_id: number | null
  owner_id: number
  created_at: string
  updated_at: string
  children?: ModuleDTO[]
  is_moderator?: boolean
}

export interface ModuleTreeNodeDTO {
  id: number
  name: string
  module_name?: string
  description?: string
  owner_id: number
  parent_id?: number | null
  created_at?: string
  updated_at?: string
  children: ModuleTreeNodeDTO[]
  is_moderator?: boolean
  role?: string
}

export interface UserDTO {
  id: number
  username: string
  email?: string
  avatar?: string
  role?: string
}

export interface ArticleDTO {
  id: number
  module_id: number
  title: string
  summary: string
  content?: string
  author_id: number
  author?: UserDTO
  created_at: string
  updated_at: string
  tags?: string[]
  view_count?: number
}

export interface ArticleListResponseDTO {
  total: number
  page: number
  page_size: number
  articles: ArticleDTO[]
}

export interface BreadcrumbItemDTO {
  id: number
  name: string
}

export interface ModuleModeratorDTO {
  user_id: number
  username: string
  avatar?: string
  role: 'admin' | 'moderator'
  created_at: string
}

export interface NavigationLockDTO {
  id: number
  locked_by: number | null
  locked_at: string | null
  locked_by_user?: UserDTO
}

// ========== 前端使用的 camelCase 类型 ==========

export interface Module {
  id: number
  name: string
  description: string | null
  parentId: number | null
  ownerId: number
  createdAt: string
  updatedAt: string
  children?: Module[]

  // 权限相关
  isModerator?: boolean

  // 前端计算的权限
  canEdit?: boolean
  canDelete?: boolean
  canManageCollaborators?: boolean
}

export interface ModuleTreeNode {
  id: number
  name: string
  description?: string
  ownerId: number
  parentId?: number | null
  createdAt?: string
  updatedAt?: string
  children: ModuleTreeNode[]

  // 权限相关
  isModerator?: boolean
  role?: string

  // 前端计算的权限
  canEdit?: boolean
  canDelete?: boolean
  canManageCollaborators?: boolean
}

export interface User {
  id: number
  username: string
  email?: string
  avatar?: string
  role?: string
}

export interface Article {
  id: number
  moduleId: number
  title: string
  summary: string
  content?: string
  authorId: number
  author?: User
  createdAt: string
  updatedAt: string
  tags?: string[]
  viewCount?: number
}

export interface ArticleListResponse {
  total: number
  page: number
  pageSize: number
  articles: Article[]
}

export interface BreadcrumbItem {
  id: number
  name: string
}

export interface ModuleModerator {
  userId: number
  username: string
  avatar?: string
  role: 'admin' | 'moderator'
  createdAt: string
}

export interface NavigationLock {
  id: number
  lockedBy: number | null
  lockedAt: string | null
  lockedByUser?: User
}

// API 请求/响应类型
export interface CreateModuleRequest {
  name: string
  description?: string
  parentId?: number | null
}

export interface UpdateModuleRequest {
  name?: string
  description?: string
  parentId?: number | null
}

export interface LockRequest {
  action: 'acquire' | 'release'
}

export interface LockResponse {
  success: boolean
  lockedBy?: User | null
  lockedAt?: string | null
}

export interface AddModeratorRequest {
  userId: number
  role: 'admin' | 'moderator'
}

export interface DeleteModuleResponse {
  success: boolean
  deletedModules: number
  deletedArticles: number
}

// 模态框状态
export interface ModuleModalState {
  type: 'create' | 'edit' | 'delete' | 'collaborators' | null
  isOpen: boolean
  targetModule?: Module | ModuleTreeNode
  parentModule?: Module | ModuleTreeNode
}

// 权限检查接口
export interface PermissionChecker {
  canCreateModule: (parentId?: number) => boolean
  canEditModule: (moduleId: number) => boolean
  canDeleteModule: (moduleId: number) => boolean
  canManageCollaborators: (moduleId: number) => boolean
}

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}

// 模块管理操作类型
export enum ModuleAction {
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  MANAGE_COLLABORATORS = 'manage_collaborators',
}
