<script setup lang="ts">
import type { ArticleVersion, ReviewDetailResponse, ThreeWayMergeData } from '@/types/article'
import { Badge, Button, Skeleton } from '@sse-wiki/ui'

import { ArrowLeft } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import { useRoute, useRouter } from 'vue-router'
import DiffViewer from '@/components/article/DiffViewer.vue'
import ThreeWayMerge from '@/components/article/ThreeWayMerge.vue'

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
  const userRole = reviewData.value.current_user_role
  return userRole === 'admin' || userRole === 'owner' || userRole === 'moderator'
})

// 页面标题
const pageTitle = computed(() => {
  if (isSubmission.value) {
    if (reviewData.value?.proposed_version) {
      return reviewData.value.proposed_version.commit_message || '未命名提交'
    }
    return '查看提交'
  }
  if (currentVersion.value) {
    return currentVersion.value.commit_message || '未命名版本'
  }
  return '查看版本'
})

// 作者信息
const authorName = computed(() => {
  if (isSubmission.value && reviewData.value?.submitter) {
    return reviewData.value.submitter.username
  }
  if (currentVersion.value?.author) {
    return currentVersion.value.author.username
  }
  return '未知'
})

// 创建时间
const createdAt = computed(() => {
  if (isSubmission.value && reviewData.value) {
    return reviewData.value.created_at
  }
  if (currentVersion.value) {
    return currentVersion.value.created_at
  }
  return ''
})

// 状态Badge
const statusBadge = computed(() => {
  if (isSubmission.value && reviewData.value) {
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

      baseVersion.value = diffData.base_version
      currentVersion.value = diffData.current_version
    }
    else if (submissionIdFromQuery.value) {
      // 加载提交审核数据
      const submissionId = Number(submissionIdFromQuery.value)
      const data = await articleApi.getReview(submissionId)
      reviewData.value = data

      // 设置版本数据用于diff显示
      baseVersion.value = data.base_version || null
      currentVersion.value = data.proposed_version || null

      // 如果检测到冲突，构建 conflict_data（只读查看模式）
      if (data.has_conflict || data.conflict_data) {
        if (data.conflict_data) {
          conflictData.value = data.conflict_data
        }
        else {
          // 手动构建 conflict_data
          conflictData.value = {
            has_conflict: true,
            base_content: data.base_version?.content || '',
            their_content: data.proposed_version?.content || '',
            our_content: data.current_version?.content || '',
            merged_content: undefined,
            base_version_number: data.base_version?.version_number,
            their_version_number: data.proposed_version?.version_number,
            our_version_number: data.current_version?.version_number,
            submitter_name: data.submitter?.username,
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

    <!-- 版本内容 -->
    <div v-else-if="currentVersion" class="space-y-6">
      <!-- 头部信息 -->
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

        <!-- 提交审核信息 -->
        <div v-if="isSubmission && reviewData" class="border-t pt-4 space-y-2">
          <div v-if="baseVersion" class="text-sm">
            <span class="text-muted-foreground">基于版本:</span>
            <span class="ml-2 font-mono">v{{ baseVersion.version_number }}</span>
          </div>
          <div v-else class="text-sm">
            <span class="text-muted-foreground">基于版本:</span>
            <span class="ml-2 font-mono">初始版本</span>
          </div>
          <div v-if="reviewData.has_conflict" class="text-sm text-destructive">
            <span class="font-semibold">检测到冲突</span>
            <span class="ml-2">此提交与当前版本存在冲突</span>
          </div>
          <div v-if="reviewData.review_notes" class="text-sm">
            <span class="text-muted-foreground">审核备注:</span>
            <span class="ml-2">{{ reviewData.review_notes }}</span>
          </div>
        </div>

        <div class="border-b" />
      </header>

      <!-- 冲突处理视图（只读模式） -->
      <div v-if="conflictData">
        <ThreeWayMerge
          :conflict-data="conflictData"
          :submission-id="Number(submissionIdFromQuery)"
          :can-review="false"
          :is-read-only="true"
          @resolve="() => {}"
        />
      </div>

      <!-- Diff 对比视图（无冲突） -->
      <div v-else class="bg-muted/50 border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">
          {{ baseVersion ? '内容对比' : '版本内容' }}
        </h2>
        <DiffViewer
          :old-content="baseVersion?.content || null"
          :new-content="currentVersion.content"
          :old-label="baseVersion ? `Base v${baseVersion.version_number}` : undefined"
          :new-label="`${isSubmission ? '提交版本' : `v${currentVersion.version_number}`}`"
        />
      </div>

      <!-- 操作按钮（仅有审核权限的用户可见） -->
      <div v-if="isSubmission && reviewData && canReview && (reviewData.status === 'pending' || reviewData.status === 'conflict_detected')" class="flex justify-end gap-4">
        <Button variant="default" @click="goToReview">
          进入审核
        </Button>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="text-center py-12">
      <div class="text-muted-foreground mb-4">
        无法加载版本数据
      </div>
      <Button @click="goBack">
        返回
      </Button>
    </div>
  </div>
</template>
