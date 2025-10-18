// 文章状态管理
import type {
  ArticleDetailResponse,
  ArticleVersion,
} from '@/types/article'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { articleApi } from '@/services/articleApi'

export const useArticleStore = defineStore('article', () => {
  // ========== 状态 ==========

  // 当前文章详情
  const currentArticle = ref<ArticleDetailResponse | null>(null)

  // 当前文章的版本列表（已废弃，改用 history 字段）
  // TODO: 考虑移除此字段，使用 currentArticle.history 替代
  const versions = ref<ArticleVersion[]>([])

  // 标签已改为用户自定义输入，不再需要全局标签列表

  // 加载状态
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ========== Actions ==========

  /**
   * 获取文章详情
   */
  async function fetchArticle(articleId: number | string) {
    try {
      loading.value = true
      error.value = null

      const data = await articleApi.getArticle(articleId)
      currentArticle.value = data

      // 同时加载版本列表
      if (data.id) {
        await fetchVersions(data.id)
      }

      return data
    }
    catch (err: any) {
      error.value = err.message || '获取文章详情失败'
      console.error('Failed to fetch article:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 获取文章版本列表
   */
  async function fetchVersions(articleId: number | string) {
    try {
      const data = await articleApi.getVersions(articleId)
      versions.value = data
      return data
    }
    catch (err: any) {
      console.error('Failed to fetch versions:', err)
      throw err
    }
  }

  /**
   * 获取特定版本详情
   */
  async function fetchVersion(versionId: number | string) {
    try {
      const data = await articleApi.getVersion(versionId)
      return data
    }
    catch (err: any) {
      console.error('Failed to fetch version:', err)
      throw err
    }
  }

  /**
   * 创建文章
   */
  async function createArticle(data: {
    title: string
    module_id: number
    content: string
    commit_message: string
    is_review_required?: boolean
    tags?: string[]
  }) {
    try {
      loading.value = true
      error.value = null

      const article = await articleApi.createArticle(data)
      return article
    }
    catch (err: any) {
      error.value = err.message || '创建文章失败'
      console.error('Failed to create article:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 提交修改（创建审核提交）
   */
  async function submitArticle(
    articleId: number | string,
    data: {
      content: string
      commit_message: string
      base_version_id: number
    },
  ) {
    try {
      loading.value = true
      error.value = null

      const submission = await articleApi.createSubmission(articleId, data)

      // 重新加载文章详情以更新待审核列表
      await fetchArticle(articleId)

      return submission
    }
    catch (err: any) {
      error.value = err.message || '提交文章失败'
      console.error('Failed to submit article:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 审核提交（批准/拒绝）
   */
  async function reviewSubmission(
    reviewId: number | string,
    action: 'approve' | 'reject',
    notes?: string,
    mergedContent?: string,
  ) {
    try {
      loading.value = true
      error.value = null

      const result = await articleApi.reviewSubmission(reviewId, {
        action,
        notes,
        merged_content: mergedContent,
      })

      // 重新加载当前文章（如果有）
      if (currentArticle.value) {
        await fetchArticle(currentArticle.value.id)
      }

      return result
    }
    catch (err: any) {
      // 如果是冲突错误（409），不设置 error，让调用者处理
      if (err.response?.status === 409) {
        throw err
      }

      error.value = err.message || '审核操作失败'
      console.error('Failed to review submission:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 删除文章
   */
  async function deleteArticle(articleId: number | string) {
    try {
      loading.value = true
      error.value = null

      await articleApi.deleteArticle(articleId)

      // 清空当前文章
      if (currentArticle.value?.id === articleId) {
        currentArticle.value = null
        versions.value = []
      }
    }
    catch (err: any) {
      error.value = err.message || '删除文章失败'
      console.error('Failed to delete article:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 比较两个版本
   */
  async function compareVersions(fromVersionId: number, toVersionId: number) {
    try {
      const result = await articleApi.compareVersions(fromVersionId, toVersionId)
      return result
    }
    catch (err: any) {
      console.error('Failed to compare versions:', err)
      throw err
    }
  }

  // 标签管理函数已移除，标签现在由用户直接输入

  /**
   * 增加阅读量
   */
  async function incrementViewCount(articleId: number | string) {
    try {
      await articleApi.incrementViewCount(articleId)

      // 更新本地状态
      if (currentArticle.value?.id === articleId) {
        currentArticle.value.view_count += 1
      }
    }
    catch (err: any) {
      // 阅读量更新失败不影响用户体验，静默处理
      console.warn('Failed to increment view count:', err)
    }
  }

  /**
   * 清空当前文章
   */
  function clearCurrentArticle() {
    currentArticle.value = null
    versions.value = []
    error.value = null
  }

  /**
   * 清空错误
   */
  function clearError() {
    error.value = null
  }

  // ========== Getters ==========

  /**
   * 获取当前版本内容
   */
  function getCurrentVersionContent(): string {
    if (!currentArticle.value?.current_version) {
      return ''
    }
    return currentArticle.value.current_version.content
  }

  /**
   * 获取当前用户权限
   */
  function getCurrentUserPermissions() {
    const role = currentArticle.value?.current_user_role

    return {
      canEdit: ['owner', 'admin', 'moderator', 'editor'].includes(role || ''),
      canReview: ['owner', 'admin', 'moderator'].includes(role || ''),
      canManage: ['owner', 'admin'].includes(role || ''),
      canDelete: role === 'owner',
    }
  }

  /**
   * 是否有待审核的提交
   * 检查 history 中是否有 pending 或 conflict_detected 状态的提交
   */
  function hasPendingReviews(): boolean {
    if (!currentArticle.value?.history) {
      return false
    }

    return currentArticle.value.history.some(
      entry =>
        entry.entry_type === 'submission'
        && (entry.submission_status === 'pending' || entry.submission_status === 'conflict_detected'),
    )
  }

  return {
    // State
    currentArticle,
    versions, // TODO: 考虑废弃，使用 currentArticle.history
    loading,
    error,

    // Actions
    fetchArticle,
    fetchVersions,
    fetchVersion,
    createArticle,
    submitArticle,
    reviewSubmission,
    deleteArticle,
    compareVersions,
    incrementViewCount,
    clearCurrentArticle,
    clearError,

    // Getters
    getCurrentVersionContent,
    getCurrentUserPermissions,
    hasPendingReviews,
  }
})
