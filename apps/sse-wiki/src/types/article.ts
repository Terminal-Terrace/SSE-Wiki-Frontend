// TODO：带校验是否和其他ts有重复类型定义，需要治理
// 文章模块类型定义
export interface User {
  id: number
  username: string
  email?: string
  avatar?: string
}

// 文章基础信息
export interface Article {
  id: number
  currentVersionId: number | null
  title: string
  moduleId: number
  createdBy: number
  createdAt: string
  updatedAt: string
  isReviewRequired: boolean
  viewCount: number

  // 扩展字段（前端使用）
  currentUserRole?: ArticleRole | null
  pendingReviewsCount?: number
  module?: {
    id: number
    name: string
  }
  author?: User
}

// 文章版本
export interface ArticleVersion {
  id: number
  articleId: number
  versionNumber: number
  content: string
  commitMessage: string
  authorId: number
  baseVersionId?: number | null
  mergedAgainstVersionId?: number | null
  status: VersionStatus
  createdAt: string

  // 扩展字段
  author?: User
}

// 审核提交（等同于 Pull Request）
export interface ReviewSubmission {
  id: number
  articleId: number
  proposedVersionId: number
  baseVersionId: number
  mergedAgainstVersionId?: number | null
  aiScore: number | null
  aiSuggestions: string | null
  submittedBy: number
  reviewedBy: number | null
  status: SubmissionStatus
  reviewNotes: string
  mergeResult: string
  hasConflict: boolean
  createdAt: string
  reviewedAt: string | null

  // 扩展字段
  submitter?: User
  reviewer?: User
  article?: Article
  proposedVersion?: ArticleVersion
}

// 版本冲突记录
export interface VersionConflict {
  id: number
  submissionId: number
  conflictWithVersionId: number
  status: ConflictStatus
  resolvedVersionId: number | null
  resolvedBy: number | null
  conflictDetails: string
  createdAt: string
  resolvedAt: string | null

  // 扩展字段
  resolver?: User
}

// 文章协作者
export interface ArticleCollaborator {
  articleId: number
  userId: number
  role: ArticleRole
  createdAt: string

  // API 直接返回的用户信息字段
  username: string
  avatar: string

  // 扩展字段（可选，用于嵌套用户对象）
  user?: User
}

// 文章引用关系
export interface ArticleReference {
  fromArticleId: number
  toArticleId: number
  referenceType: ReferenceType
  createdAt: string

  // 扩展字段
  fromArticle?: Article
  toArticle?: Article
}

// 文章-标签关联
export interface ArticleTag {
  articleId: number
  tagId: number
  createdAt: string
}

// 讨论主题
export interface Discussion {
  id: number
  articleId: number
  title: string
  description: string
  createdBy: number
  createdAt: string
  updatedAt: string

  // 扩展字段
  author?: User
  commentsCount?: number
}

// 讨论评论
export interface DiscussionComment {
  id: number
  discussionId: number
  parentId: number | null
  content: string
  createdBy: number
  createdAt: string
  updatedAt: string

  // 扩展字段
  author?: User
  replies?: DiscussionComment[]
}

// 收藏
export interface Favorite {
  userId: number
  articleId: number
  createdAt: string
}

// ========== 枚举类型 ==========

// 文章角色
// admin: 管理员协作者，可以编辑、审核、删除、管理协作者
// moderator: 审核员协作者，可以编辑、审核
export type ArticleRole = 'admin' | 'moderator'

// 版本状态
export type VersionStatus = 'published' | 'rejected'

// 提交状态
export type SubmissionStatus = 'pending' | 'conflict_detected' | 'rejected' | 'auto_published' | 'merged'

// 冲突状态
export type ConflictStatus = 'detected' | 'resolved'

// 引用类型
export type ReferenceType = 'prerequisite' | 'related' | 'extends'

// 历史条目（统一结构）
export interface HistoryEntry {
  entryType: 'version' | 'submission'
  entryId: number
  versionId: number | null
  submissionId: number | null
  status: 'published' | 'rejected' | null // 版本状态
  submissionStatus: 'pending' | 'conflict_detected' | 'rejected' | 'auto_published' | 'merged' | null // 提交状态
  baseVersionId: number | null
  mergedAgainstVersionId: number | null
  hasConflict: boolean
  mergeResult: string | null
  commitMessage: string
  authorId: number
  author?: User
  reviewedBy?: number | null
  reviewer?: User
  reviewNotes?: string | null
  createdAt: string
  reviewedAt?: string | null
}

// ========== API 请求/响应类型 ==========

// 创建文章请求
export interface CreateArticleRequest {
  title: string
  moduleId: number
  content: string
  commitMessage: string // 初始版本的提交说明
  isReviewRequired?: boolean
  tags?: string[] // 用户自定义标签，字符串数组
}

// 添加协作者请求
export interface AddCollaboratorRequest {
  userId: number
  role: ArticleRole
}

// 提交修改请求
export interface SubmissionRequest {
  content: string
  commitMessage: string
  baseVersionId: number
}

// 审核操作请求
export interface ReviewActionRequest {
  action: 'approve' | 'reject'
  notes?: string
  mergedContent?: string // 仅当手动解决冲突时需要
}

// 批量审核请求
export interface BatchReviewRequest {
  submissionIds: number[]
  action: 'approve' | 'reject'
}

// 文章列表查询参数
export interface ArticleListQuery {
  moduleId?: number
  page?: number
  pageSize?: number
  status?: VersionStatus
}

// 审核列表查询参数
export interface ReviewListQuery {
  status?: SubmissionStatus
  articleId?: number
  page?: number
  pageSize?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// 文章详情响应
export interface ArticleDetailResponse extends Article {
  content?: string // 当前版本的内容（便捷字段，等同于 currentVersion.content）
  currentVersion?: ArticleVersion
  tags?: string[]
  collaborators?: ArticleCollaborator[]
  history?: HistoryEntry[] // 统一历史列表（替代 pendingSubmissions）
  references?: ArticleReference[]
  // 权限相关字段（后端计算）
  isAuthor?: boolean // 当前用户是否是文章作者（createdBy == userID）
  canDelete?: boolean // 当前用户是否可以删除文章（Global_Admin 或 Author/Admin）
}

// 冲突检测元数据
export interface ConflictData {
  hasConflict: boolean
  baseVersionNumber?: number
  currentVersionNumber?: number
  submitterName?: string
}

// 三路合并冲突数据（前端构建的完整版）
export interface ThreeWayMergeData {
  baseContent: string
  theirContent: string // 提交者的内容（proposed）
  ourContent: string // 当前版本的内容（current）
  mergedContent?: string // 带冲突标记的内容（可选，前端会动态生成）
  hasConflict: boolean
  baseVersionNumber?: number
  theirVersionNumber?: number
  ourVersionNumber?: number
  submitterName?: string
}

// 版本差异对比响应
export interface VersionDiffResponse {
  baseVersion: ArticleVersion | null
  currentVersion: ArticleVersion
  diff?: string
}

// 审核详情响应（API 返回的嵌套结构）
export interface ReviewDetailResponse {
  submission: ReviewSubmission | null
  proposedVersion: ArticleVersion | null
  baseVersion: ArticleVersion | null
  currentVersion?: ArticleVersion // 当前线上版本
  article: Article | null
  conflictData?: ConflictData
}

// 冲突解决请求
export interface ResolveConflictRequest {
  submissionId: number
  resolvedContent: string
}

// 审核操作成功响应
export interface ReviewActionResponse {
  success: true
  publishedVersion?: ArticleVersion
  newVersionId?: number
}

// 审核操作冲突响应
export interface ConflictResponse {
  code: 409
  message: string
  data: {
    conflictData: ThreeWayMergeData
  }
}

// API 通用响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 错误响应
export interface ApiError {
  code: number
  message: string
  details?: any
}

// ========== 前端状态类型 ==========

// 文章编辑状态
export interface ArticleEditState {
  article: Article | null
  currentVersion: ArticleVersion | null
  content: string
  isDirty: boolean
  isSaving: boolean
  lastSaved: string | null
}

// 审核工作台状态
export interface ReviewDashboardState {
  submissions: ReviewSubmission[]
  filterStatus: SubmissionStatus | 'all'
  loading: boolean
  total: number
  page: number
  pageSize: number
}

// 版本对比状态
export interface VersionCompareState {
  oldVersion: ArticleVersion | null
  newVersion: ArticleVersion | null
  diffResult: DiffResult | null
  loading: boolean
}

// Diff 结果
export interface DiffResult {
  changes: DiffChange[]
  additions: number
  deletions: number
  unchanged: number
}

// Diff 变更
export interface DiffChange {
  type: 'add' | 'delete' | 'unchanged'
  content: string
  lineNumber?: number
}

// ========== 权限相关 ==========

// 文章权限
export interface ArticlePermissions {
  canRead: boolean
  canEdit: boolean
  canReview: boolean
  canManageSettings: boolean
  canManageCollaborators: boolean
  canDelete: boolean
}

// 根据角色计算权限
// 注意：canDelete 应该使用后端返回的 can_delete 字段，而不是仅根据角色判断
// 因为 Global_Admin 也可以删除文章，但他们没有文章角色
export function getArticlePermissions(
  role: ArticleRole | null | undefined,
  options?: { isAuthor?: boolean, canDelete?: boolean },
): ArticlePermissions {
  const { isAuthor = false, canDelete: canDeleteFromBackend } = options || {}

  if (!role && !isAuthor) {
    return {
      canRead: true,
      canEdit: false,
      canReview: false,
      canManageSettings: false,
      canManageCollaborators: false,
      canDelete: canDeleteFromBackend ?? false,
    }
  }

  // 角色等级：admin > moderator
  // 注意：owner 角色已移除，作者身份通过 isAuthor 参数传入
  const roleLevel = {
    moderator: 1,
    admin: 2,
  }

  const level = role ? (roleLevel[role] || 0) : 0

  return {
    canRead: true,
    canEdit: level >= 1 || isAuthor, // moderator 及以上，或作者
    canReview: level >= 1 || isAuthor, // moderator 及以上，或作者
    canManageSettings: level >= 2 || isAuthor, // admin 或作者
    canManageCollaborators: level >= 2 || isAuthor, // admin 或作者
    // 删除权限使用后端返回的 can_delete 字段（考虑 Global_Admin）
    canDelete: canDeleteFromBackend ?? (level >= 2 || isAuthor),
  }
}

// ========== 工具函数类型 ==========

// 版本号格式化
export function formatVersionNumber(versionNumber: number): string {
  return `v${versionNumber}`
}

// 状态徽章配置
export interface StatusBadgeConfig {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
}

// 获取提交状态配置
export function getSubmissionStatusConfig(status: SubmissionStatus): StatusBadgeConfig {
  const configs: Record<SubmissionStatus, StatusBadgeConfig> = {
    pending: { label: '待审核', variant: 'secondary' },
    conflict_detected: { label: '冲突处理中', variant: 'destructive' },
    rejected: { label: '已驳回', variant: 'destructive' },
    auto_published: { label: '已自动发布', variant: 'default' },
    merged: { label: '已合并', variant: 'default' },
  }

  return configs[status] || { label: status, variant: 'default' }
}

// 获取版本状态配置
export function getVersionStatusConfig(status: VersionStatus): StatusBadgeConfig {
  const configs: Record<VersionStatus, StatusBadgeConfig> = {
    published: { label: '已发布', variant: 'default' },
    rejected: { label: '已驳回', variant: 'destructive' },
  }

  return configs[status] || { label: status, variant: 'default' }
}
