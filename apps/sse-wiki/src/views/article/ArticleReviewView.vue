<script setup lang="ts">
import type { ReviewDetailResponse, ThreeWayMergeData } from '@/types/article'
import { Badge, Button, Card, Skeleton, Textarea, toast } from '@sse-wiki/ui'

import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import { useRouter } from 'vue-router'

import DiffViewer from '@/components/article/DiffViewer.vue'
import ThreeWayMerge from '@/components/article/ThreeWayMerge.vue'

import { articleApi } from '@/services/articleApi'
import { useAuthStore } from '@/stores/auth'

interface Props {
  articleId: string | number
  submissionId: string | number
}

const props = defineProps<Props>()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const submitting = ref(false) // 防止重复提交的标志
const reviewData = ref<ReviewDetailResponse | null>(null)
const reviewNotes = ref('')
const errorMessage = ref<string | null>(null)

// 冲突处理状态
const showConflict = ref(false)
const conflictData = ref<ThreeWayMergeData | null>(null)

// 判断当前用户是否有审核权限
// 需要是 admin、owner 或 moderator
const canReview = computed(() => {
  if (!authStore.isAuthenticated || !reviewData.value) {
    return false
  }

  const userRole = reviewData.value.current_user_role
  return userRole === 'admin' || userRole === 'owner' || userRole === 'moderator'
})

// 是否为只读模式（无权限或已审核完成）
const isReadOnly = computed(() => {
  if (!reviewData.value) {
    return true
  }

  // 没有审核权限
  if (!canReview.value) {
    return true
  }

  // 已经处理过的提交（merged 或 rejected）
  const status = reviewData.value.status
  return status !== 'pending' && status !== 'conflict_detected'
})

// 提交者信息
const submitterName = computed(() => {
  return reviewData.value?.submitter?.username || `用户${reviewData.value?.submitted_by || '未知'}`
})

// 提交说明
const commitMessage = computed(() => {
  return reviewData.value?.proposed_version?.commit_message || '未命名提交'
})

// 基础版本号
const baseVersionNumber = computed(() => {
  return reviewData.value?.base_version?.version_number || 0
})

// 当前版本号
const currentVersionNumber = computed(() => {
  return reviewData.value?.current_version?.version_number || 0
})

// 状态Badge
const statusBadge = computed(() => {
  if (!reviewData.value)
    return null

  const status = reviewData.value.status
  if (status === 'pending') {
    return { label: '待审核', variant: 'secondary' as const }
  }
  if (status === 'conflict_detected') {
    return { label: '冲突处理中', variant: 'destructive' as const }
  }
  if (status === 'rejected') {
    return { label: '已驳回', variant: 'destructive' as const }
  }
  if (status === 'auto_published' || status === 'merged') {
    return { label: '已发布', variant: 'default' as const }
  }
  return null
})

// 格式化日期
function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

// 加载审核数据
async function loadReviewData() {
  loading.value = true
  errorMessage.value = null

  try {
    const data = await articleApi.getReview(props.submissionId)
    reviewData.value = data

    // 如果已经有冲突数据，直接显示
    if (data.conflict_data) {
      conflictData.value = data.conflict_data
      showConflict.value = true
    }
  }
  catch (error: any) {
    console.error('Failed to load review data:', error)
    errorMessage.value = error.response?.data?.message || '加载失败，请重试'
  }
  finally {
    loading.value = false
  }
}

/**
 * 审核通过
 * 使用 submitting 标志防止重复点击
 */
async function handleApprove() {
  // 防抖：如果正在提交，直接返回
  if (submitting.value)
    return

  submitting.value = true
  try {
    await articleApi.reviewSubmission(props.submissionId, {
      action: 'approve',
      notes: reviewNotes.value || undefined,
    })

    // 成功发布
    toast({
      title: '审核成功',
      description: '提交已通过并发布',
    })

    // 返回文章详情页
    router.push({
      path: `/articles/${props.articleId}`,
      query: { tab: 'history' },
    })
  }
  catch (error: any) {
    // 检查是否为冲突错误（409）
    if (error.response?.status === 409) {
      const conflictDataFromError = error.response?.data?.data?.conflict_data
      if (conflictDataFromError) {
        conflictData.value = conflictDataFromError
        showConflict.value = true
        toast({
          title: '检测到冲突',
          description: '请解决冲突后重新提交',
          variant: 'destructive',
        })
      }
      else {
        toast({
          title: '冲突错误',
          description: '无法获取冲突数据，请刷新页面重试',
          variant: 'destructive',
        })
      }
    }
    else {
      console.error('Failed to approve submission:', error)
      toast({
        title: '审核失败',
        description: error.response?.data?.message || '请重试',
        variant: 'destructive',
      })
    }
  }
  finally {
    submitting.value = false
  }
}

/**
 * 审核驳回
 * 使用 submitting 标志防止重复点击
 * 要求必须填写驳回原因
 */
async function handleReject() {
  // 防抖：如果正在提交，直接返回
  if (submitting.value)
    return

  if (!reviewNotes.value.trim()) {
    toast({
      title: '请填写驳回原因',
      variant: 'destructive',
    })
    return
  }

  submitting.value = true
  try {
    await articleApi.reviewSubmission(props.submissionId, {
      action: 'reject',
      notes: reviewNotes.value,
    })

    toast({
      title: '已驳回',
      description: '提交已被驳回',
    })

    // 返回文章详情页
    router.push({
      path: `/articles/${props.articleId}`,
      query: { tab: 'history' },
    })
  }
  catch (error: any) {
    console.error('Failed to reject submission:', error)
    toast({
      title: '操作失败',
      description: error.response?.data?.message || '请重试',
      variant: 'destructive',
    })
  }
  finally {
    submitting.value = false
  }
}

/**
 * 处理冲突解决
 * 使用 submitting 标志防止重复提交
 * @param mergedContent - 解决冲突后的合并内容
 */
async function handleConflictResolve(mergedContent: string) {
  // 防抖：如果正在提交，直接返回
  if (submitting.value)
    return

  submitting.value = true
  try {
    // 使用解决后的内容重新提交审核
    await articleApi.reviewSubmission(props.submissionId, {
      action: 'approve',
      merged_content: mergedContent,
      notes: reviewNotes.value || undefined,
    })

    toast({
      title: '冲突已解决',
      description: '提交已通过并发布',
    })

    // 返回文章详情页
    router.push({
      path: `/articles/${props.articleId}`,
      query: { tab: 'history' },
    })
  }
  catch (error: any) {
    console.error('Failed to resolve conflict:', error)
    toast({
      title: '提交失败',
      description: error.response?.data?.message || '请重试',
      variant: 'destructive',
    })
  }
  finally {
    submitting.value = false
  }
}

/**
 * 取消冲突处理
 * 关闭冲突处理界面，返回普通审核视图
 */
function handleConflictCancel() {
  showConflict.value = false
  conflictData.value = null
}

/**
 * 返回文章详情页的历史标签页
 */
function goBack() {
  router.push({
    path: `/articles/${props.articleId}`,
    query: { tab: 'history' },
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadReviewData()
})
</script>

<template>
  <div class="w-full px-6 sm:px-8 lg:px-12 py-6">
    <!-- 返回按钮 -->
    <div class="mb-4">
      <Button variant="ghost" size="sm" @click="goBack">
        <ArrowLeft class="h-4 w-4 mr-2" />
        返回历史列表
      </Button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-12 w-3/4" />
      <Skeleton class="h-4 w-1/2" />
      <Skeleton class="h-96 w-full" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMessage" class="text-center py-12">
      <div class="text-destructive mb-4">
        {{ errorMessage }}
      </div>
      <Button @click="goBack">
        返回
      </Button>
    </div>

    <!-- 审核内容 -->
    <div v-else-if="reviewData" class="space-y-6">
      <!-- 头部信息 -->
      <header class="space-y-4">
        <div class="flex items-start justify-between">
          <h1 class="text-3xl font-bold tracking-tight">
            审核提交
          </h1>
          <div v-if="statusBadge" class="flex items-center gap-2">
            <Badge :variant="statusBadge.variant">
              {{ statusBadge.label }}
            </Badge>
          </div>
        </div>

        <div class="border-b" />
      </header>

      <!-- 提交信息卡片 -->
      <Card class="p-6">
        <div class="space-y-3">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-semibold">
                {{ commitMessage }}
              </h2>
              <p class="text-sm text-muted-foreground mt-1">
                由 {{ submitterName }} 提交于 {{ formatDate(reviewData.created_at) }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">基于版本:</span>
              <span class="ml-2 font-mono">v{{ baseVersionNumber }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">当前版本:</span>
              <span class="ml-2 font-mono">v{{ currentVersionNumber }}</span>
            </div>
          </div>

          <div v-if="reviewData.has_conflict" class="flex items-center gap-2 text-destructive text-sm">
            <XCircle class="h-4 w-4" />
            <span>检测到冲突，需要手动解决</span>
          </div>

          <div v-if="reviewData.review_notes" class="pt-3 border-t">
            <p class="text-sm text-muted-foreground mb-1">
              审核备注
            </p>
            <p class="text-sm">
              {{ reviewData.review_notes }}
            </p>
          </div>
        </div>
      </Card>

      <!-- 冲突处理视图 -->
      <div v-if="showConflict && conflictData">
        <ThreeWayMerge
          :conflict-data="conflictData"
          :submission-id="Number(submissionId)"
          @resolve="handleConflictResolve"
          @cancel="handleConflictCancel"
        />
      </div>

      <!-- Diff 对比视图 -->
      <div v-else-if="reviewData.base_version && reviewData.proposed_version" class="bg-muted/50 border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">
          内容对比
        </h2>
        <DiffViewer
          :old-content="reviewData.base_version.content"
          :new-content="reviewData.proposed_version.content"
          :old-label="`Base v${baseVersionNumber}`"
          new-label="提交版本"
        />
      </div>

      <!-- 审核操作 -->
      <div v-if="!showConflict && canReview && !isReadOnly" class="space-y-4">
        <Card class="p-6">
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">审核备注</label>
              <Textarea
                v-model="reviewNotes"
                :placeholder="reviewData.status === 'rejected' ? '请填写驳回原因（必填）' : '审核备注（可选）'"
                class="min-h-[100px]"
              />
            </div>

            <div class="flex items-center justify-end gap-3">
              <Button
                variant="destructive"
                :disabled="submitting"
                @click="handleReject"
              >
                <XCircle class="h-4 w-4 mr-2" />
                驳回
              </Button>
              <Button
                variant="default"
                :disabled="submitting"
                @click="handleApprove"
              >
                <CheckCircle2 class="h-4 w-4 mr-2" />
                {{ submitting ? '处理中...' : '通过' }}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <!-- 只读模式提示（无审核权限或已审核） -->
      <div v-else-if="!showConflict" class="space-y-4">
        <Card class="p-6">
          <div class="text-center text-muted-foreground py-4">
            <p v-if="!canReview">
              您没有审核权限，只能查看审核内容
            </p>
            <p v-else-if="reviewData.status === 'merged'">
              此提交已审核通过并合并
            </p>
            <p v-else-if="reviewData.status === 'rejected'">
              此提交已被驳回
            </p>
            <p v-else>
              此提交已处理
            </p>
          </div>
        </Card>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="text-center py-12">
      <div class="text-muted-foreground mb-4">
        无法加载审核数据
      </div>
      <Button @click="goBack">
        返回
      </Button>
    </div>
  </div>
</template>
