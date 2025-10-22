import type {
  Comment,
  CommentsListResponse,
  CreateCommentRequest,
  Discussion,
  UpdateCommentRequest,
} from '@/types/discussion'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { discussionApi } from '@/services/discussionApi'

export const useDiscussionStore = defineStore('discussion', () => {
  // ========== 状态 ==========
  const discussion = ref<Discussion | null>(null)
  const comments = ref<Comment[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 当前正在查看的文章ID
  const currentArticleId = ref<number | null>(null)

  // ========== Actions ==========

  /**
   * 加载文章的评论列表
   */
  async function loadComments(articleId: number, force = false) {
    // 如果是同一篇文章且不强制刷新，直接返回
    if (currentArticleId.value === articleId && !force && comments.value.length > 0) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const response: CommentsListResponse = await discussionApi.getArticleComments(articleId)

      discussion.value = response.discussion || null
      comments.value = response.comments || []
      total.value = response.total || 0
      currentArticleId.value = articleId
    }
    catch (err: any) {
      error.value = err.response?.data?.message || '加载评论失败'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 发表新评论（顶级评论）
   */
  async function createComment(articleId: number, request: CreateCommentRequest) {
    try {
      const newComment = await discussionApi.createComment(articleId, request)

      // 刷新评论列表
      await loadComments(articleId, true)

      return newComment
    }
    catch (err: any) {
      error.value = err.response?.data?.message || '发表评论失败'
      throw err
    }
  }

  /**
   * 回复评论
   */
  async function replyComment(commentId: number, request: CreateCommentRequest) {
    if (!currentArticleId.value) {
      throw new Error('当前文章ID不存在')
    }

    try {
      const reply = await discussionApi.replyComment(commentId, request)

      // 刷新评论列表
      await loadComments(currentArticleId.value, true)

      return reply
    }
    catch (err: any) {
      error.value = err.response?.data?.message || '回复评论失败'
      throw err
    }
  }

  /**
   * 编辑评论
   */
  async function updateComment(commentId: number, request: UpdateCommentRequest) {
    if (!currentArticleId.value) {
      throw new Error('当前文章ID不存在')
    }

    try {
      const updatedComment = await discussionApi.updateComment(commentId, request)

      // 刷新评论列表
      await loadComments(currentArticleId.value, true)

      return updatedComment
    }
    catch (err: any) {
      error.value = err.response?.data?.message || '编辑评论失败'
      throw err
    }
  }

  /**
   * 删除评论
   */
  async function deleteComment(commentId: number) {
    if (!currentArticleId.value) {
      throw new Error('当前文章ID不存在')
    }

    try {
      await discussionApi.deleteComment(commentId)

      // 刷新评论列表
      await loadComments(currentArticleId.value, true)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || '删除评论失败'
      throw err
    }
  }

  /**
   * 清空状态
   */
  function clearState() {
    discussion.value = null
    comments.value = []
    total.value = 0
    currentArticleId.value = null
    error.value = null
  }

  return {
    // 状态
    discussion,
    comments,
    total,
    loading,
    error,
    currentArticleId,

    // 方法
    loadComments,
    createComment,
    replyComment,
    updateComment,
    deleteComment,
    clearState,
  }
})
