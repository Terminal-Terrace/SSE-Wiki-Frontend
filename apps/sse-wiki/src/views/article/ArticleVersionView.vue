<script setup lang="ts">
import type { ArticleDetailResponse, ArticleVersion, ReviewSubmission } from '@/types/article'
import { Badge, Button, Card, Skeleton, Textarea, toast } from '@sse-wiki/ui'
import { ArrowLeft } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DiffViewer from '@/components/article/DiffViewer.vue'
import ThreeWayMerge from '@/components/article/ThreeWayMerge.vue'
import { articleApi } from '@/services/articleApi'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const loading = ref(true)
const article = ref<ArticleDetailResponse | null>(null)
const versionData = ref<ArticleVersion | null>(null)
const submissionData = ref<ReviewSubmission | null>(null)
const reviewNotes = ref('')
const isReviewing = ref(false)
const showConflictMerge = ref(false)
const conflictData = ref<any>(null)

// 从路由参数获取信息
const articleId = computed(() => route.params.articleId as string)
const versionId = computed(() => route.query.versionId as string)
const submissionId = computed(() => route.query.submissionId as string)
const isReviewMode = computed(() => !!submissionId.value)

// 判断当前用户是否有审核权限
const canReview = computed(() => {
  if (!article.value || !user.value)
    return false

  const role = article.value.current_user_role
  return role === 'admin' || role === 'moderator' || role === 'owner'
})

// 获取当前版本（用于对比）
const currentVersion = computed(() => article.value?.current_version)

// 格式化时间
function formatTime(date: string) {
  return formatDate(date)
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    // 1. 获取文章详情
    article.value = await articleApi.getArticle(articleId.value)

    // 2. 根据模式加载不同数据
    if (isReviewMode.value) {
      // 审核模式：加载 ReviewSubmission
      const review = await articleApi.getReview(submissionId.value)
      submissionData.value = review
      versionData.value = review.proposed_version || null
    }
    else if (versionId.value) {
      // 查看模式：加载 ArticleVersion
      versionData.value = await articleApi.getVersion(versionId.value)
    }
  }
  catch (error) {
    console.error('Failed to load data:', error)
    toast({
      title: '加载失败',
      description: '无法加载版本信息',
      variant: 'destructive',
    })
  }
  finally {
    loading.value = false
  }
}

// 返回历史列表
function goBack() {
  router.push({
    path: `/articles/${articleId.value}`,
    query: { tab: 'history' },
  })
}

// 批准审核
async function approveReview() {
  if (!submissionId.value || !canReview.value)
    return

  isReviewing.value = true
  try {
    const result = await articleApi.approveReview(submissionId.value, reviewNotes.value)

    toast({
      title: '审核通过',
      description: `已批准该提交，新版本ID: ${result.new_version_id}`,
    })

    // 返回历史列表
    goBack()
  }
  catch (error: any) {
    // 检查是否是冲突错误（409）
    if (error.response?.status === 409) {
      const responseData = error.response.data
      conflictData.value = responseData.data?.conflict_data

      if (conflictData.value) {
        showConflictMerge.value = true
        toast({
          title: '检测到冲突',
          description: '请手动解决冲突后再提交',
          variant: 'destructive',
        })
      }
    }
    else {
      console.error('Failed to approve:', error)
      toast({
        title: '批准失败',
        description: error.message || '请重试',
        variant: 'destructive',
      })
    }
  }
  finally {
    isReviewing.value = false
  }
}

// 拒绝审核
async function rejectReview() {
  if (!submissionId.value || !canReview.value)
    return

  if (!reviewNotes.value.trim()) {
    toast({
      title: '请填写拒绝原因',
      variant: 'destructive',
    })
    return
  }

  isReviewing.value = true
  try {
    await articleApi.rejectReview(submissionId.value, reviewNotes.value)

    toast({
      title: '已拒绝',
      description: '该提交已被拒绝',
    })

    // 返回历史列表
    goBack()
  }
  catch (error: any) {
    console.error('Failed to reject:', error)
    toast({
      title: '拒绝失败',
      description: error.message || '请重试',
      variant: 'destructive',
    })
  }
  finally {
    isReviewing.value = false
  }
}

// 处理冲突解决
async function handleConflictResolve(mergedContent: string) {
  if (!submissionId.value)
    return

  isReviewing.value = true
  try {
    const result = await articleApi.approveWithConflictResolution(
      submissionId.value,
      mergedContent,
      reviewNotes.value,
    )

    toast({
      title: '冲突已解决',
      description: `已批准该提交，新版本ID: ${result.new_version_id}`,
    })

    // 返回历史列表
    goBack()
  }
  catch (error: any) {
    console.error('Failed to resolve conflict:', error)
    toast({
      title: '提交失败',
      description: error.message || '请重试',
      variant: 'destructive',
    })
  }
  finally {
    isReviewing.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="w-full px-6 sm:px-8 lg:px-12 py-6">
    <!-- 加载状态 -->
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-64 w-full" />
    </div>

    <!-- 主内容 -->
    <div v-else-if="article && versionData" class="space-y-6">
      <!-- 顶部导航 -->
      <div class="flex items-center justify-between">
        <Button variant="ghost" size="sm" @click="goBack">
          <ArrowLeft class="h-4 w-4 mr-2" />
          返回历史列表
        </Button>

        <div class="flex items-center gap-2">
          <Badge v-if="isReviewMode && submissionData" variant="outline" class="bg-yellow-500/10 text-yellow-600 border-yellow-600">
            待审核
          </Badge>
          <Badge v-if="submissionData?.has_conflict" variant="destructive">
            有冲突
          </Badge>
        </div>
      </div>

      <!-- 提交信息卡片 -->
      <Card class="p-6">
        <div class="space-y-4">
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <h2 class="text-2xl font-bold">
                {{ versionData.commit_message || '无提交说明' }}
              </h2>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span v-if="isReviewMode && submissionData">
                  提交者: {{ submissionData.submitter?.username || '未知' }}
                </span>
                <span v-else>
                  作者: {{ versionData.author?.username || '未知' }}
                </span>
                <span>版本号: v{{ versionData.version_number }}</span>
                <span>
                  {{ isReviewMode ? '提交时间' : '创建时间' }}: {{ formatTime(submissionData?.created_at || versionData.created_at) }}
                </span>
              </div>
            </div>

            <div class="text-sm text-muted-foreground">
              文章: {{ article.title }}
            </div>
          </div>

          <!-- 审核备注（仅审核模式显示） -->
          <div v-if="isReviewMode && canReview" class="pt-4 border-t">
            <label class="text-sm font-medium">审核备注 {{ !reviewNotes.trim() && '（拒绝时必填）' }}</label>
            <Textarea
              v-model="reviewNotes"
              placeholder="填写审核意见..."
              rows="3"
              class="mt-2 resize-none"
            />
          </div>
        </div>
      </Card>

      <!-- 内容对比区域 -->
      <div v-if="!showConflictMerge">
        <h3 class="text-lg font-semibold mb-4">
          {{ isReviewMode ? '提交的修改' : '与当前版本对比' }}
        </h3>

        <DiffViewer
          v-if="currentVersion"
          :old-content="currentVersion.content"
          :new-content="versionData.content"
          old-label="当前版本"
          :new-label="isReviewMode ? '提交的版本' : `v${versionData.version_number}`"
        />

        <div v-else class="bg-muted/30 rounded-lg p-6">
          <p class="text-sm text-muted-foreground mb-2">
            版本内容
          </p>
          <pre class="text-sm whitespace-pre-wrap break-words font-mono">{{ versionData.content }}</pre>
        </div>
      </div>

      <!-- 三路合并区域 -->
      <div v-else-if="conflictData">
        <h3 class="text-lg font-semibold mb-4">
          解决冲突
        </h3>

        <ThreeWayMerge
          :conflict-data="conflictData"
          :submission-id="Number(submissionId)"
          @resolve="handleConflictResolve"
          @cancel="showConflictMerge = false"
        />
      </div>

      <!-- 操作按钮（仅审核模式且有权限时显示） -->
      <div v-if="isReviewMode && canReview && !showConflictMerge" class="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          :disabled="isReviewing"
          @click="goBack"
        >
          取消
        </Button>
        <Button
          variant="destructive"
          :disabled="isReviewing"
          @click="rejectReview"
        >
          {{ isReviewing ? '拒绝中...' : '拒绝' }}
        </Button>
        <Button
          variant="default"
          :disabled="isReviewing"
          @click="approveReview"
        >
          {{ isReviewing ? '批准中...' : '批准' }}
        </Button>
      </div>

      <!-- 无权限提示 -->
      <div v-if="isReviewMode && !canReview" class="bg-muted/50 border border-border rounded-lg p-6 text-center">
        <p class="text-muted-foreground">
          您没有审核权限，只能查看此提交的内容
        </p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="text-center py-12">
      <h2 class="text-2xl font-semibold mb-2">
        数据加载失败
      </h2>
      <p class="text-muted-foreground mb-4">
        无法加载版本信息
      </p>
      <Button @click="goBack">
        返回历史列表
      </Button>
    </div>
  </div>
</template>
