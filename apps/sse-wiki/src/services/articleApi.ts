// 文章管理 API 服务
import type {
  AddCollaboratorRequest,
  Article,
  ArticleCollaborator,
  ArticleDetailResponse,
  ArticleListQuery,
  ArticleVersion,
  BatchReviewRequest,
  CreateArticleRequest,
  PaginatedResponse,
  ResolveConflictRequest,
  ReviewActionRequest,
  ReviewActionResponse,
  ReviewListQuery,
  ReviewSubmission,
  SubmissionRequest,
  UpdateArticleSettingsRequest,
} from '@/types/article'
import request from '@/utils/request'

/**
 * 文章管理 API 类
 * 对接后端的文章、版本、审核等接口
 */
export class ArticleAPI {
  private baseURL = '/api/v1/articles'
  private versionURL = '/api/v1/versions'
  private reviewURL = '/api/v1/reviews'

  // ========== 文章 CRUD ==========

  /**
   * 获取文章列表
   * GET /api/v1/articles
   */
  async getArticles(params?: ArticleListQuery): Promise<PaginatedResponse<Article>> {
    return request.get(this.baseURL, { params })
  }

  /**
   * 获取文章详情
   * GET /api/v1/articles/:id
   */
  async getArticle(id: number | string): Promise<ArticleDetailResponse> {
    return request.get(`${this.baseURL}/${id}`)
  }

  /**
   * 创建文章
   * POST /api/v1/articles
   */
  async createArticle(data: CreateArticleRequest): Promise<Article> {
    return request.post(this.baseURL, data)
  }

  /**
   * 删除文章
   * DELETE /api/v1/articles/:id
   */
  async deleteArticle(id: number | string): Promise<{ success: boolean }> {
    return request.delete(`${this.baseURL}/${id}`)
  }

  /**
   * 更新文章设置
   * PATCH /api/v1/articles/:id/settings
   */
  async updateSettings(
    id: number | string,
    data: UpdateArticleSettingsRequest,
  ): Promise<{ success: boolean }> {
    return request.patch(`${this.baseURL}/${id}/settings`, data)
  }

  // ========== 版本管理 ==========

  /**
   * 获取文章的版本列表
   * GET /api/v1/articles/:id/versions
   */
  async getVersions(articleId: number | string): Promise<ArticleVersion[]> {
    return request.get(`${this.baseURL}/${articleId}/versions`)
  }

  /**
   * 获取特定版本详情
   * GET /api/v1/versions/:id
   */
  async getVersion(versionId: number | string): Promise<ArticleVersion> {
    return request.get(`${this.versionURL}/${versionId}`)
  }

  /**
   * 比较两个版本
   * GET /api/v1/versions/compare?from=:fromId&to=:toId
   */
  async compareVersions(
    fromVersionId: number,
    toVersionId: number,
  ): Promise<{
    from_version: ArticleVersion
    to_version: ArticleVersion
    diff: string
  }> {
    return request.get(`${this.versionURL}/compare`, {
      params: {
        from: fromVersionId,
        to: toVersionId,
      },
    })
  }

  // ========== 提交和审核 ==========

  /**
   * 提交修改（创建审核提交）
   * POST /api/v1/articles/:id/submissions
   */
  async createSubmission(
    articleId: number | string,
    data: SubmissionRequest,
  ): Promise<ReviewSubmission> {
    return request.post(`${this.baseURL}/${articleId}/submissions`, data)
  }

  /**
   * 获取审核列表
   * GET /api/v1/reviews
   */
  async getReviews(params?: ReviewListQuery): Promise<PaginatedResponse<ReviewSubmission>> {
    return request.get(this.reviewURL, { params })
  }

  /**
   * 获取审核详情
   * GET /api/v1/reviews/:id
   */
  async getReview(reviewId: number | string): Promise<ReviewSubmission> {
    return request.get(`${this.reviewURL}/${reviewId}`)
  }

  /**
   * 审核操作（批准/拒绝）
   * POST /api/v1/reviews/:id/action
   *
   * 注意：如果返回 409 状态码，表示有冲突需要手动解决
   * 错误响应中会包含 conflict_data 字段
   */
  async reviewSubmission(
    reviewId: number | string,
    data: ReviewActionRequest,
  ): Promise<ReviewActionResponse> {
    return request.post(`${this.reviewURL}/${reviewId}/action`, data)
  }

  /**
   * 获取审核详情（别名方法，符合联调文档术语）
   * GET /api/v1/reviews/:id
   */
  async getReviewDetail(reviewId: number | string): Promise<ReviewSubmission> {
    return this.getReview(reviewId)
  }

  /**
   * 审核操作（别名方法，符合联调文档术语）
   * POST /api/v1/reviews/:id/action
   */
  async reviewAction(
    reviewId: number | string,
    data: ReviewActionRequest,
  ): Promise<ReviewActionResponse> {
    return this.reviewSubmission(reviewId, data)
  }

  /**
   * 批量审核
   * POST /api/v1/reviews/batch-action
   */
  async batchReview(data: BatchReviewRequest): Promise<{ success: boolean, results: any[] }> {
    return request.post(`${this.reviewURL}/batch-action`, data)
  }

  /**
   * 解决冲突
   * POST /api/v1/reviews/:id/resolve
   */
  async resolveConflict(
    reviewId: number | string,
    data: ResolveConflictRequest,
  ): Promise<{ success: boolean, new_version_id: number }> {
    return request.post(`${this.reviewURL}/${reviewId}/resolve`, data)
  }

  // ========== 协作者管理 ==========

  /**
   * 获取文章协作者列表
   * GET /api/v1/articles/:id/collaborators
   */
  async getCollaborators(articleId: number | string): Promise<ArticleCollaborator[]> {
    return request.get(`${this.baseURL}/${articleId}/collaborators`)
  }

  /**
   * 添加协作者
   * POST /api/v1/articles/:id/collaborators
   */
  async addCollaborator(
    articleId: number | string,
    data: AddCollaboratorRequest,
  ): Promise<ArticleCollaborator> {
    return request.post(`${this.baseURL}/${articleId}/collaborators`, data)
  }

  /**
   * 移除协作者
   * DELETE /api/v1/articles/:id/collaborators/:userId
   */
  async removeCollaborator(
    articleId: number | string,
    userId: number,
  ): Promise<{ success: boolean }> {
    return request.delete(`${this.baseURL}/${articleId}/collaborators/${userId}`)
  }

  /**
   * 更新协作者角色
   * PATCH /api/v1/articles/:id/collaborators/:userId
   */
  async updateCollaboratorRole(
    articleId: number | string,
    userId: number,
    role: string,
  ): Promise<ArticleCollaborator> {
    return request.patch(`${this.baseURL}/${articleId}/collaborators/${userId}`, { role })
  }

  // ========== 标签管理 ==========

  // 标签管理相关接口已移除
  // 标签现在由用户在创建/编辑文章时直接输入，作为字符串数组提交

  // ========== 文章引用 ==========

  /**
   * 获取文章的引用关系
   * GET /api/v1/articles/:id/references
   */
  async getReferences(articleId: number | string): Promise<{
    incoming: Article[] // 引用了本文的文章
    outgoing: Article[] // 本文引用的文章
  }> {
    return request.get(`${this.baseURL}/${articleId}/references`)
  }

  /**
   * 添加文章引用
   * POST /api/v1/articles/:id/references
   */
  async addReference(
    articleId: number | string,
    data: { to_article_id: number, reference_type: string },
  ): Promise<{ success: boolean }> {
    return request.post(`${this.baseURL}/${articleId}/references`, data)
  }

  /**
   * 移除文章引用
   * DELETE /api/v1/articles/:id/references/:toArticleId
   */
  async removeReference(
    articleId: number | string,
    toArticleId: number,
  ): Promise<{ success: boolean }> {
    return request.delete(`${this.baseURL}/${articleId}/references/${toArticleId}`)
  }

  // ========== 统计和搜索 ==========

  /**
   * 增加文章阅读量
   * POST /api/v1/articles/:id/view
   */
  async incrementViewCount(articleId: number | string): Promise<{ view_count: number }> {
    return request.post(`${this.baseURL}/${articleId}/view`)
  }

  /**
   * 搜索文章
   * GET /api/v1/articles/search
   */
  async searchArticles(params: {
    q: string
    module_id?: number
    tags?: number[]
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<Article>> {
    return request.get(`${this.baseURL}/search`, { params })
  }

  /**
   * 获取模块下的文章列表
   * GET /api/v1/modules/:moduleId/articles
   */
  async getArticlesByModule(
    moduleId: number | string,
    params?: { page?: number, page_size?: number },
  ): Promise<PaginatedResponse<Article>> {
    return request.get(`/api/v1/modules/${moduleId}/articles`, { params })
  }

  // ========== 便捷方法 ==========

  /**
   * 批准审核（无冲突情况）
   */
  async approveReview(reviewId: number | string, notes?: string) {
    return this.reviewSubmission(reviewId, {
      action: 'approve',
      notes,
    })
  }

  /**
   * 拒绝审核
   */
  async rejectReview(reviewId: number | string, notes: string) {
    return this.reviewSubmission(reviewId, {
      action: 'reject',
      notes,
    })
  }

  /**
   * 批准审核并手动解决冲突
   */
  async approveWithConflictResolution(
    reviewId: number | string,
    mergedContent: string,
    notes?: string,
  ) {
    return this.reviewSubmission(reviewId, {
      action: 'approve',
      merged_content: mergedContent,
      notes,
    })
  }
}

// 导出单例实例
export const articleApi = new ArticleAPI()

// 默认导出
export default articleApi
