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
  current_version_id: number | null
  title: string
  module_id: number
  created_by: number
  created_at: string
  updated_at: string
  is_review_required: boolean
  view_count: number

  // 扩展字段（前端使用）
  current_user_role?: ArticleRole | null
  pending_reviews_count?: number
  module?: {
    id: number
    name: string
  }
  author?: User
}

// 文章版本
export interface ArticleVersion {
  id: number
  article_id: number
  version_number: number
  content: string
  commit_message: string
  author_id: number
  base_version_id?: number | null
  merged_against_version_id?: number | null
  status: VersionStatus
  created_at: string

  // 扩展字段
  author?: User
}

// 审核提交（等同于 Pull Request）
export interface ReviewSubmission {
  id: number
  article_id: number
  proposed_version_id: number
  base_version_id: number
  merged_against_version_id?: number | null
  ai_score: number | null
  ai_suggestions: string | null
  submitted_by: number
  reviewed_by: number | null
  status: SubmissionStatus
  review_notes: string
  merge_result: string
  has_conflict: boolean
  created_at: string
  reviewed_at: string | null

  // 扩展字段
  submitter?: User
  reviewer?: User
  article?: Article
  proposed_version?: ArticleVersion
}

// 版本冲突记录
export interface VersionConflict {
  id: number
  submission_id: number
  conflict_with_version_id: number
  status: ConflictStatus
  resolved_version_id: number | null
  resolved_by: number | null
  conflict_details: string
  created_at: string
  resolved_at: string | null

  // 扩展字段
  resolver?: User
}

// 文章协作者
export interface ArticleCollaborator {
  article_id: number
  user_id: number
  role: ArticleRole
  created_at: string

  // 扩展字段
  user?: User
}

// 文章引用关系
export interface ArticleReference {
  from_article_id: number
  to_article_id: number
  reference_type: ReferenceType
  created_at: string

  // 扩展字段
  from_article?: Article
  to_article?: Article
}

// 标签
export interface Tag {
  id: number
  name: string
  color: string
  created_at: string
}

// 文章-标签关联
export interface ArticleTag {
  article_id: number
  tag_id: number
  created_at: string
}

// 讨论主题
export interface Discussion {
  id: number
  article_id: number
  title: string
  description: string
  created_by: number
  created_at: string
  updated_at: string

  // 扩展字段
  author?: User
  comments_count?: number
}

// 讨论评论
export interface DiscussionComment {
  id: number
  discussion_id: number
  parent_id: number | null
  content: string
  created_by: number
  created_at: string
  updated_at: string

  // 扩展字段
  author?: User
  replies?: DiscussionComment[]
}

// 收藏
export interface Favorite {
  user_id: number
  article_id: number
  created_at: string
}

// ========== 枚举类型 ==========

// 文章角色
export type ArticleRole = 'owner' | 'admin' | 'moderator' | 'editor'

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
  entry_type: 'version' | 'submission'
  entry_id: number
  version_id: number | null
  submission_id: number | null
  status: 'published' | 'rejected' | null // 版本状态
  submission_status: 'pending' | 'conflict_detected' | 'rejected' | 'auto_published' | 'merged' | null // 提交状态
  base_version_id: number | null
  merged_against_version_id: number | null
  has_conflict: boolean
  merge_result: string | null
  commit_message: string
  author_id: number
  author?: User
  reviewed_by?: number | null
  reviewer?: User
  review_notes?: string | null
  created_at: string
  reviewed_at?: string | null
}

// ========== API 请求/响应类型 ==========

// 创建文章请求
export interface CreateArticleRequest {
  title: string
  module_id: number
  content: string
  commit_message: string // 初始版本的提交说明
  is_review_required?: boolean
  tags?: string[] // 用户自定义标签，字符串数组
}

// 更新文章设置请求
export interface UpdateArticleSettingsRequest {
  is_review_required?: boolean
}

// 添加协作者请求
export interface AddCollaboratorRequest {
  user_id: number
  role: ArticleRole
}

// 提交修改请求
export interface SubmissionRequest {
  content: string
  commit_message: string
  base_version_id: number
  tags?: string[] // 用户自定义标签，字符串数组
}

// 审核操作请求
export interface ReviewActionRequest {
  action: 'approve' | 'reject'
  notes?: string
  merged_content?: string // 仅当手动解决冲突时需要
}

// 批量审核请求
export interface BatchReviewRequest {
  submission_ids: number[]
  action: 'approve' | 'reject'
}

// 文章列表查询参数
export interface ArticleListQuery {
  module_id?: number
  page?: number
  page_size?: number
  status?: VersionStatus
}

// 审核列表查询参数
export interface ReviewListQuery {
  status?: SubmissionStatus
  article_id?: number
  page?: number
  page_size?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}

// 文章详情响应
export interface ArticleDetailResponse extends Article {
  content?: string // 当前版本的内容（便捷字段，等同于 current_version.content）
  current_version?: ArticleVersion
  tags?: string[]
  collaborators?: ArticleCollaborator[]
  history?: HistoryEntry[] // 统一历史列表（替代 pending_submissions）
  references?: ArticleReference[]
}

// 三路合并冲突数据
export interface ThreeWayMergeData {
  base_content: string
  their_content: string // 提交者的内容（proposed）
  our_content: string // 当前版本的内容（current）
  merged_content?: string // 带冲突标记的内容（可选，前端会动态生成）
  has_conflict: boolean
  base_version_number?: number
  their_version_number?: number
  our_version_number?: number
  submitter_name?: string
}

// 版本差异对比响应
export interface VersionDiffResponse {
  base_version: ArticleVersion
  current_version: ArticleVersion
  diff?: string
}

// 审核详情响应
export interface ReviewDetailResponse extends ReviewSubmission {
  base_version?: ArticleVersion
  current_version?: ArticleVersion // 当前线上版本
  conflict_data?: ThreeWayMergeData
  current_user_role?: string // 当前用户在该文章的角色（admin/owner/moderator/空）
}

// 冲突解决请求
export interface ResolveConflictRequest {
  submission_id: number
  resolved_content: string
}

// 审核操作成功响应
export interface ReviewActionResponse {
  success: true
  published_version?: ArticleVersion
  new_version_id?: number
}

// 审核操作冲突响应
export interface ConflictResponse {
  code: 409
  message: string
  data: {
    conflict_data: ThreeWayMergeData
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
export function getArticlePermissions(role: ArticleRole | null | undefined): ArticlePermissions {
  if (!role) {
    return {
      canRead: true,
      canEdit: false,
      canReview: false,
      canManageSettings: false,
      canManageCollaborators: false,
      canDelete: false,
    }
  }

  const roleLevel = {
    editor: 1,
    moderator: 2,
    admin: 3,
    owner: 4,
  }

  const level = roleLevel[role] || 0

  return {
    canRead: true,
    canEdit: level >= 1, // editor 及以上
    canReview: level >= 2, // moderator 及以上
    canManageSettings: level >= 3, // admin 及以上
    canManageCollaborators: level >= 3, // admin 及以上
    canDelete: level >= 4, // owner
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
