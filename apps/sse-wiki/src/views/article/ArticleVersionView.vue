<script setup lang="ts">
import type { ArticleVersion, ReviewDetailResponse, ThreeWayMergeData } from '@/types/article'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@sse-wiki/ui'

import { AlertCircle, ArrowLeft, FileText } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import { useRoute, useRouter } from 'vue-router'
import ComparisonPanel from '@/components/article/ComparisonPanel.vue'
import MergeConflictPanel from '@/components/article/MergeConflictPanel.vue'

import { articleApi } from '@/services/articleApi'

interface Props {
  articleId: string | number
  versionId?: string | number
  submissionId?: string | number
}

const props = defineProps<Props>()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const baseVersion = ref<ArticleVersion | null>(null)
const currentVersion = ref<ArticleVersion | null>(null)
const reviewData = ref<ReviewDetailResponse | null>(null)
const conflictData = ref<ThreeWayMergeData | null>(null)
const errorMessage = ref<string | null>(null)

// 从 URL query 获取参数
const versionIdFromQuery = computed(() => props.versionId || route.query.versionId)
const submissionIdFromQuery = computed(() => props.submissionId || route.query.submissionId)

// 是否为提交查看模式
const isSubmission = computed(() => !!submissionIdFromQuery.value)

// 判断当前用户是否有审核权限
const canReview = computed(() => {
  if (!reviewData.value) {
    return false
  }
  // 从 article.currentUserRole 读取用户角色
  const userRole = reviewData.value.article?.currentUserRole
  return userRole === 'admin' || userRole === 'moderator'
})

// 页面标题
const pageTitle = computed(() => {
  if (isSubmission.value) {
    if (reviewData.value?.proposedVersion) {
      return reviewData.value.proposedVersion.commitMessage || '未命名提交'
    }
    return '查看提交'
  }
  if (currentVersion.value) {
    return currentVersion.value.commitMessage || '未命名版本'
  }
  return '查看版本'
})

// 作者信息
const authorName = computed(() => {
  // 从 submission.submitter 读取提交者信息
  if (isSubmission.value && reviewData.value?.submission?.submitter) {
    return reviewData.value.submission.submitter.username
  }
  if (currentVersion.value?.author) {
    return currentVersion.value.author.username
  }
  return '未知'
})

// 创建时间
const createdAt = computed(() => {
  // 从 submission.createdAt 读取创建时间
  if (isSubmission.value && reviewData.value?.submission) {
    return reviewData.value.submission.createdAt || ''
  }
  if (currentVersion.value) {
    return currentVersion.value.createdAt || ''
  }
  return ''
})

// 状态Badge
const statusBadge = computed(() => {
  // 从 submission.status 读取状态
  if (isSubmission.value && reviewData.value?.submission) {
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
  }
  if (currentVersion.value) {
    const status = currentVersion.value.status
    if (status === 'published') {
      return { label: '已发布', variant: 'default' as const }
    }
    if (status === 'rejected') {
      return { label: '已驳回', variant: 'destructive' as const }
    }
  }
  return null
})

// 格式化日期
function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

// 加载版本数据
async function loadVersionData() {
  loading.value = true
  errorMessage.value = null

  try {
    if (versionIdFromQuery.value) {
      // 加载版本对比数据
      const versionId = Number(versionIdFromQuery.value)
      const diffData = await articleApi.getVersionDiff(versionId)

      baseVersion.value = diffData.baseVersion
      currentVersion.value = diffData.currentVersion
    }
    else if (submissionIdFromQuery.value) {
      // 加载提交审核数据
      const submissionId = Number(submissionIdFromQuery.value)
      const data = await articleApi.getReview(submissionId)
      reviewData.value = data

      // 设置版本数据用于diff显示
      baseVersion.value = data.baseVersion || null
      currentVersion.value = data.proposedVersion || null

      // 如果检测到冲突，从版本对象获取内容构建三路合并数据（只读查看模式）
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
        }
      }
    }
    else {
      errorMessage.value = '缺少版本ID或提交ID参数'
    }
  }
  catch (error: any) {
    console.error('Failed to load version data:', error)
    errorMessage.value = error.response?.data?.message || '加载失败，请重试'
  }
  finally {
    loading.value = false
  }
}

// 返回文章详情
function goBack() {
  router.push({
    path: `/articles/${props.articleId}`,
    query: { tab: 'history' },
  })
}

// 进入审核模式
function goToReview() {
  if (submissionIdFromQuery.value) {
    router.push({
      path: `/articles/${props.articleId}/review/${submissionIdFromQuery.value}`,
    })
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadVersionData()
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

    <div v-else-if="currentVersion" class="space-y-6">
      <header class="space-y-4">
        <div class="flex items-start justify-between">
          <h1 class="text-3xl font-bold tracking-tight">
            {{ pageTitle }}
          </h1>
          <div v-if="statusBadge" class="flex items-center gap-2">
            <Badge :variant="statusBadge.variant">
              {{ statusBadge.label }}
            </Badge>
          </div>
        </div>

        <div class="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>作者: {{ authorName }}</span>
          <span>{{ formatDate(createdAt) }}</span>
        </div>

        <div v-if="isSubmission && reviewData" class="border-t pt-4 space-y-2">
          <div v-if="baseVersion" class="text-sm">
            <span class="text-muted-foreground">基于版本:</span>
            <span class="ml-2 font-mono">v{{ baseVersion.versionNumber }}</span>
          </div>
          <div v-else class="text-sm">
            <span class="text-muted-foreground">基于版本:</span>
            <span class="ml-2 font-mono">初始版本</span>
          </div>
          <div v-if="reviewData.submission?.hasConflict" class="text-sm text-destructive">
            <span class="font-semibold">检测到冲突</span>
            <span class="ml-2">此提交与当前版本存在冲突</span>
          </div>
          <div v-if="reviewData.submission?.reviewNotes" class="text-sm">
            <span class="text-muted-foreground">审核备注:</span>
            <span class="ml-2">{{ reviewData.submission.reviewNotes }}</span>
          </div>
        </div>

        <div class="border-b" />
      </header>

      <div v-if="conflictData">
        <MergeConflictPanel
          :conflict-data="conflictData"
          :submission-id="Number(submissionIdFromQuery)"
          :can-review="false"
          :is-read-only="true"
          @resolve="() => {}"
        />
      </div>

      <div v-else class="bg-muted/50 border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">
          {{ baseVersion ? '内容对比' : '版本内容' }}
        </h2>
        <ComparisonPanel
          :old-content="baseVersion?.content || null"
          :new-content="currentVersion.content"
          :old-label="baseVersion ? `Base v${baseVersion.versionNumber}` : undefined"
          :new-label="`${isSubmission ? '提交版本' : `v${currentVersion.versionNumber}`}`"
        />
      </div>

      <div v-if="isSubmission && reviewData && canReview && (reviewData.submission?.status === 'pending' || reviewData.submission?.status === 'conflict_detected')" class="flex justify-end gap-4">
        <Button variant="default" @click="goToReview">
          进入审核
        </Button>
      </div>
    </div>

    <Empty v-else class="py-12">
      <EmptyMedia variant="icon">
        <FileText class="h-8 w-8" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>无法加载版本数据</EmptyTitle>
        <EmptyDescription>版本数据不存在或已被删除</EmptyDescription>
      </EmptyHeader>
      <Button class="mt-4" @click="goBack">
        返回
      </Button>
    </Empty>
  </div>
</template>
