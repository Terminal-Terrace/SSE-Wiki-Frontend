import type {
  ApiResponse,
  Comment,
  CommentsListResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '@/types/discussion'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

/**
 * 讨论区 API 服务
 */
export const discussionApi = {
  /**
   * 获取文章的所有评论（树状结构）
   * GET /api/v1/articles/:articleId/discussions
   */
  async getArticleComments(articleId: number): Promise<CommentsListResponse> {
    const response = await axios.get<ApiResponse<CommentsListResponse>>(
      `${API_BASE_URL}/articles/${articleId}/discussions`,
    )
    return response.data.data || { comments: [], total: 0 }
  },

  /**
   * 发表新评论（顶级评论）
   * POST /api/v1/articles/:articleId/discussions
   */
  async createComment(
    articleId: number,
    request: CreateCommentRequest,
  ): Promise<Comment> {
    const response = await axios.post<ApiResponse<Comment>>(
      `${API_BASE_URL}/articles/${articleId}/discussions`,
      request,
    )
    return response.data.data!
  },

  /**
   * 回复评论
   * POST /api/v1/discussions/:commentId/replies
   */
  async replyComment(
    commentId: number,
    request: CreateCommentRequest,
  ): Promise<Comment> {
    const response = await axios.post<ApiResponse<Comment>>(
      `${API_BASE_URL}/discussions/${commentId}/replies`,
      request,
    )
    return response.data.data!
  },

  /**
   * 编辑评论
   * PUT /api/v1/discussions/:commentId
   */
  async updateComment(
    commentId: number,
    request: UpdateCommentRequest,
  ): Promise<Comment> {
    const response = await axios.put<ApiResponse<Comment>>(
      `${API_BASE_URL}/discussions/${commentId}`,
      request,
    )
    return response.data.data!
  },

  /**
   * 删除评论
   * DELETE /api/v1/discussions/:commentId
   */
  async deleteComment(commentId: number): Promise<void> {
    await axios.delete<ApiResponse<void>>(
      `${API_BASE_URL}/discussions/${commentId}`,
    )
  },
}
