/**
 * 用户信息（简化版）
 */
export interface UserInfo {
  id: number
  username: string
  avatar?: string
}

/**
 * 评论（树状结构）
 */
export interface Comment {
  id: number
  discussion_id: number
  parent_id?: number
  content: string
  created_by: number
  creator?: UserInfo
  created_at: string
  updated_at: string
  replies: Comment[] // 子评论（递归）
  reply_count: number
  is_deleted?: boolean // 评论是否已被删除
}

/**
 * 讨论区信息
 */
export interface Discussion {
  id: number
  article_id: number
  title: string
  description?: string
  created_by: number
  created_at: string
  updated_at: string
}

/**
 * 评论列表响应
 */
export interface CommentsListResponse {
  discussion?: Discussion
  comments: Comment[]
  total: number
}

/**
 * 创建评论请求
 */
export interface CreateCommentRequest {
  content: string
}

/**
 * 更新评论请求
 */
export interface UpdateCommentRequest {
  content: string
}

/**
 * API 响应包装
 */
export interface ApiResponse<T> {
  code: number
  message: string
  data?: T
}

/**
 * API 错误响应
 */
export interface ApiErrorResponse {
  code: number
  message: string
  error?: string
}

/**
 * 评论编辑器模式
 */
export enum CommentEditorMode {
  CREATE = 'create', // 创建新评论
  REPLY = 'reply', // 回复评论
  EDIT = 'edit', // 编辑评论
}

/**
 * 评论编辑器配置
 */
export interface CommentEditorConfig {
  mode: CommentEditorMode
  parent_id?: number
  editing_comment_id?: number
  initial_content?: string
  placeholder?: string
}
