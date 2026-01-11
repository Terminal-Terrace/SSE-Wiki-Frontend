<script setup lang="ts">
import type { ReviewDetailResponse, ThreeWayMergeData } from '@/types/article'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
  Textarea,
  toast,
} from '@sse-wiki/ui'

import { AlertCircle, ArrowLeft, CheckCircle2, FileText, XCircle } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import { useRouter } from 'vue-router'

import ComparisonPanel from '@/components/article/ComparisonPanel.vue'
import MergeConflictPanel from '@/components/article/MergeConflictPanel.vue'
import { TooltipWrapper } from '@/components/common/tooltip'
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
// 需要是 admin 或 moderator
const canReview = computed(() => {
  if (!authStore.isAuthenticated || !reviewData.value) {
    return false
  }

  // 从 article.currentUserRole 读取用户角色
  const userRole = reviewData.value.article?.currentUserRole
  return userRole === 'admin' || userRole === 'moderator'
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
  // 从 submission.status 读取状态
  const status = reviewData.value.submission?.status
  return status !== 'pending' && status !== 'conflict_detected'
})

// 提交者信息
const submitterName = computed(() => {
  return reviewData.value?.submission?.submitter?.username || `用户${reviewData.value?.submission?.submittedBy || '未知'}`
})

// 提交说明
const commitMessage = computed(() => {
  return reviewData.value?.proposedVersion?.commitMessage || '未命名提交'
})

// 提交时间
const createdAt = computed(() => {
  return reviewData.value?.submission?.createdAt || ''
})

// 基础版本号
const baseVersionNumber = computed(() => {
  return reviewData.value?.baseVersion?.versionNumber || 0
})

// 当前版本号
const currentVersionNumber = computed(() => {
  return reviewData.value?.currentVersion?.versionNumber || 0
})

// 状态Badge
const statusBadge = computed(() => {
  if (!reviewData.value?.submission)
    return null

  const status = reviewData.value.submission.status
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

    // 如果检测到冲突，从版本对象获取内容构建三路合并数据
    const hasConflict = data.submission?.hasConflict || data.conflictData?.hasConflict
    if (hasConflict) {
      // 从版本对象获取内容，从 conflictData 获取元数据
      const conflictMeta = data.conflictData
      if (conflictMeta) {
        conflictData.value = {
          hasConflict: true,
          baseContent: data.baseVersion?.content || '',
          theirContent: data.proposedVersion?.content || '',
          ourContent: data.currentVersion?.content || '',
          mergedContent: undefined,
          baseVersionNumber: conflictMeta.baseVersionNumber || data.baseVersion?.versionNumber,
          theirVersionNumber: data.proposedVersion?.versionNumber,
          ourVersionNumber: conflictMeta.currentVersionNumber || data.currentVersion?.versionNumber,
          submitterName: conflictMeta.submitterName || data.submission?.submitter?.username,
        }
        showConflict.value = true
      }
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
      const conflictMeta = error.response?.data?.data?.conflictData
      if (conflictMeta && reviewData.value) {
        // 从版本对象获取内容，从 conflictData 获取元数据
        conflictData.value = {
          hasConflict: true,
          baseContent: reviewData.value.baseVersion?.content || '',
          theirContent: reviewData.value.proposedVersion?.content || '',
          ourContent: reviewData.value.currentVersion?.content || '',
          mergedContent: undefined,
          baseVersionNumber: conflictMeta.baseVersionNumber || reviewData.value.baseVersion?.versionNumber,
          theirVersionNumber: reviewData.value.proposedVersion?.versionNumber,
          ourVersionNumber: conflictMeta.currentVersionNumber || reviewData.value.currentVersion?.versionNumber,
          submitterName: conflictMeta.submitterName || reviewData.value.submission?.submitter?.username,
        }
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
 * @param notes - 驳回原因（从 ThreeWayMerge 传入，或使用表单中的 reviewNotes）
 */
async function handleReject(notes?: string) {
  // 防抖：如果正在提交，直接返回
  if (submitting.value)
    return

  const rejectNotes = notes || reviewNotes.value

  if (!rejectNotes.trim()) {
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
      notes: rejectNotes,
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
 * @param notes - 审核备注（可选，从 ThreeWayMerge 传入）
 */
async function handleConflictResolve(mergedContent: string, notes?: string) {
  // 防抖：如果正在提交，直接返回
  if (submitting.value)
    return

  submitting.value = true
  try {
    // 使用解决后的内容重新提交审核
    await articleApi.reviewSubmission(props.submissionId, {
      action: 'approve',
      mergedContent,
      notes: notes || reviewNotes.value || undefined,
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

    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-12 w-3/4" />
      <Skeleton class="h-4 w-1/2" />
      <Skeleton class="h-96 w-full" />
    </div>

    <div v-else-if="errorMessage" class="flex items-center justify-center min-h-96 p-6">
      <Alert variant="destructive" class="max-w-lg">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>加载失败</AlertTitle>
        <AlertDescription class="mt-2 space-y-3">
          <p>{{ errorMessage }}</p>
          <Button variant="outline" size="sm" @click="goBack">
            返回
          </Button>
        </AlertDescription>
      </Alert>
    </div>

    <div v-else-if="reviewData" class="space-y-6">
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

      <Card class="p-6">
        <div class="space-y-3">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-semibold">
                {{ commitMessage }}
              </h2>
              <p class="text-sm text-muted-foreground mt-1">
                由 {{ submitterName }} 提交于 {{ formatDate(createdAt) }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <TooltipWrapper tooltip="提交者基于此版本进行的修改">
              <div class="cursor-help">
                <span class="text-muted-foreground">基于版本:</span>
                <span class="ml-2 font-mono">v{{ baseVersionNumber }}</span>
              </div>
            </TooltipWrapper>
            <TooltipWrapper tooltip="文章的最新版本（可能包含其他人的修改）">
              <div class="cursor-help">
                <span class="text-muted-foreground">当前版本:</span>
                <span class="ml-2 font-mono">v{{ currentVersionNumber }}</span>
              </div>
            </TooltipWrapper>
          </div>

          <div v-if="reviewData.submission?.hasConflict" class="flex items-center gap-2 text-destructive text-sm">
            <XCircle class="h-4 w-4" />
            <span>检测到冲突，需要手动解决</span>
          </div>

          <div v-if="reviewData.submission?.reviewNotes" class="pt-3 border-t">
            <p class="text-sm text-muted-foreground mb-1">
              审核备注
            </p>
            <p class="text-sm">
              {{ reviewData.submission.reviewNotes }}
            </p>
          </div>
        </div>
      </Card>

      <div v-if="showConflict && conflictData">
        <MergeConflictPanel
          :conflict-data="conflictData"
          :submission-id="Number(submissionId)"
          :can-review="canReview"
          :is-read-only="isReadOnly"
          @resolve="handleConflictResolve"
          @reject="handleReject"
        />
      </div>

      <div v-else-if="reviewData.baseVersion && reviewData.proposedVersion" class="bg-muted/50 border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">
          内容对比
        </h2>
        <ComparisonPanel
          :old-content="reviewData.baseVersion.content"
          :new-content="reviewData.proposedVersion.content"
          :old-label="`Base v${baseVersionNumber}`"
          new-label="提交版本"
        />
      </div>

      <div v-if="!showConflict && canReview && !isReadOnly" class="space-y-4">
        <Card class="p-6">
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">审核备注</label>
              <Textarea
                v-model="reviewNotes"
                :placeholder="reviewData.submission?.status === 'rejected' ? '请填写驳回原因（必填）' : '审核备注（可选）'"
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

      <div v-else-if="!showConflict" class="space-y-4">
        <Card class="p-6">
          <div class="text-center text-muted-foreground py-4">
            <p v-if="!canReview">
              您没有审核权限，只能查看审核内容
            </p>
            <p v-else-if="reviewData.submission?.status === 'merged'">
              此提交已审核通过并合并
            </p>
            <p v-else-if="reviewData.submission?.status === 'rejected'">
              此提交已被驳回
            </p>
            <p v-else>
              此提交已处理
            </p>
          </div>
        </Card>
      </div>
    </div>

    <Empty v-else class="py-12">
      <EmptyMedia variant="icon">
        <FileText class="h-8 w-8" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>无法加载审核数据</EmptyTitle>
        <EmptyDescription>审核数据不存在或已被删除</EmptyDescription>
      </EmptyHeader>
      <Button class="mt-4" @click="goBack">
        返回
      </Button>
    </Empty>
  </div>
</template>
