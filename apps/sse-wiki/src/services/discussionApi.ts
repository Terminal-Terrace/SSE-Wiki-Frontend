import type {
  Comment,
  CommentsListResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '@/types/discussion'
import request from '@/utils/request'

/**
 * 讨论区 API 服务
 */
export class DiscussionAPI {
  private readonly baseURL = '/api/v1'

  /**
   * 获取文章的所有评论（树状结构）
   * GET /api/v1/articles/:articleId/discussions
   */
  async getArticleComments(articleId: number): Promise<CommentsListResponse> {
    return request.get(`${this.baseURL}/articles/${articleId}/discussions`)
  }

  /**
   * 发表新评论（顶级评论）
   * POST /api/v1/articles/:articleId/discussions
   */
  async createComment(articleId: number, data: CreateCommentRequest): Promise<Comment> {
    return request.post(`${this.baseURL}/articles/${articleId}/discussions`, data)
  }

  /**
   * 回复评论
   * POST /api/v1/discussions/:commentId/replies
   */
  async replyComment(commentId: number, data: CreateCommentRequest): Promise<Comment> {
    return request.post(`${this.baseURL}/discussions/${commentId}/replies`, data)
  }

  /**
   * 编辑评论
   * PUT /api/v1/discussions/:commentId
   */
  async updateComment(commentId: number, data: UpdateCommentRequest): Promise<Comment> {
    return request.put(`${this.baseURL}/discussions/${commentId}`, data)
  }

  /**
   * 删除评论
   * DELETE /api/v1/discussions/:commentId
   */
  async deleteComment(commentId: number): Promise<void> {
    await request.delete(`${this.baseURL}/discussions/${commentId}`)
  }
}

export const discussionApi = new DiscussionAPI()

export default discussionApi
