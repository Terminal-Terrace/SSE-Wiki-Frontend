// 模块相关类型定义

export interface Module {
  id: number
  module_name: string
  name?: string // 用于兼容性，实际使用 module_name
  description: string
  parent_id: number | null
  owner_id: number
  created_at: string
  updated_at: string
  children?: Module[]

  // 权限相关
  isModerator?: boolean // 当前用户是否为该模块的协作者或管理员

  // 前端计算的权限
  canEdit?: boolean
  canDelete?: boolean
  canManageCollaborators?: boolean
}

export interface ModuleTreeNode {
  id: number
  name: string
  module_name?: string
  description?: string
  owner_id: number
  parent_id?: number | null
  created_at?: string
  updated_at?: string
  children: ModuleTreeNode[]

  // 权限相关
  isModerator?: boolean // 当前用户是否为该模块的协作者或管理员
  role?: string // 当前用户在该模块的角色: owner, admin, moderator, 空字符串表示无权限

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
  module_id: number
  title: string
  summary: string
  content?: string
  author_id: number
  author?: User
  created_at: string
  updated_at: string
  tags?: string[] // 文章标签
  view_count?: number // 浏览次数
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
  user_id: number
  username: string
  avatar?: string
  role: 'admin' | 'moderator'
  created_at: string
}

export interface NavigationLock {
  id: number
  locked_by: number | null
  locked_at: string | null
  locked_by_user?: User
}

// API 请求/响应类型
export interface CreateModuleRequest {
  name: string
  description?: string
  parent_id?: number | null
}

export interface UpdateModuleRequest {
  name?: string
  description?: string
  parent_id?: number | null
}

export interface LockRequest {
  action: 'acquire' | 'release'
}

export interface LockResponse {
  success: boolean
  locked_by?: User | null
  locked_at?: string | null
}

export interface AddModeratorRequest {
  user_id: number
  role: 'admin' | 'moderator'
}

export interface DeleteModuleResponse {
  success: boolean
  deleted_modules: number
  deleted_articles: number
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
