<script setup lang="ts">
import type { ArticleVersion, ReviewSubmission } from '@/types/article'
import { Badge, Button } from '@sse-wiki/ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { articleApi } from '@/services/articleApi'
import { useAuthStore } from '@/stores/auth'

interface HistoryItem {
  type: 'pending' | 'version'
  id: number
  title: string
  subtitle: string
  timestamp: string
  isCurrent?: boolean
  hasConflict?: boolean
  status?: string
}

interface Props {
  pageId: string | number
  versions?: any[]
}

const props = defineProps<Props>()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const loading = ref(false)
const historyItems = ref<HistoryItem[]>([])
const currentUserRole = ref<string | null>(null)

// 判断当前用户是否有审核权限
const canReview = computed(() => {
  const role = currentUserRole.value
  return role === 'admin' || role === 'moderator' || role === 'owner'
})

// 格式化日期
function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

// 加载历史记录（包括待审核提交和已发布版本）
async function loadHistory() {
  if (!props.pageId)
    return

  loading.value = true
  try {
    // 从文章详情获取完整信息（包含 pending_submissions 和 current_user_role）
    const article = await articleApi.getArticle(props.pageId)

    // 保存当前用户角色
    currentUserRole.value = article.current_user_role || null

    const items: HistoryItem[] = []

    // 1. 添加待审核的提交（只有登录用户可见）
    if (user.value && article.pending_submissions && article.pending_submissions.length > 0) {
      article.pending_submissions.forEach((submission: ReviewSubmission) => {
        // 只显示 pending 状态的提交
        if (submission.status === 'pending') {
          items.push({
            type: 'pending',
            id: submission.id,
            title: submission.proposed_version?.commit_message || '待审核的修改',
            subtitle: `由 ${submission.submitter?.username || `用户${submission.submitted_by}`} 提交`,
            timestamp: submission.created_at,
            hasConflict: submission.has_conflict,
            status: submission.status,
          })
        }
      })
    }

    // 2. 添加当前版本
    if (article.current_version) {
      items.push({
        type: 'version',
        id: article.current_version.id,
        title: article.current_version.commit_message,
        subtitle: `由 ${article.current_version.author?.username || '未知'} 编辑`,
        timestamp: article.current_version.created_at,
        isCurrent: true,
      })
    }

    // 3. 添加历史版本
    const versions = await articleApi.getVersions(props.pageId)
    versions.forEach((v: ArticleVersion) => {
      // 排除当前版本（已经添加过了）
      if (article.current_version && v.id === article.current_version.id)
        return

      items.push({
        type: 'version',
        id: v.id,
        title: v.commit_message,
        subtitle: `由 ${v.author?.username || `用户${v.author_id}`} 编辑`,
        timestamp: v.created_at,
      })
    })

    historyItems.value = items
  }
  catch (error) {
    console.error('Failed to load history:', error)
    historyItems.value = []
  }
  finally {
    loading.value = false
  }
}

// 查看版本详情
function viewVersion(item: HistoryItem) {
  router.push({
    path: `/articles/${props.pageId}/version`,
    query: {
      versionId: String(item.id),
    },
  })
}

// 审核待提交的修改
function reviewSubmission(item: HistoryItem) {
  router.push({
    path: `/articles/${props.pageId}/version`,
    query: {
      submissionId: String(item.id),
    },
  })
}

// 组件挂载时加载历史记录
onMounted(() => {
  loadHistory()
})

// 监听 pageId 变化
watch(() => props.pageId, () => {
  loadHistory()
})
</script>

<template>
  <div class="space-y-6">
    <div class="bg-muted/50 border border-border rounded-lg p-6">
      <h2 class="text-lg font-semibold mb-4">
        历史版本
      </h2>

      <div v-if="loading" class="text-center py-8 text-muted-foreground">
        加载中...
      </div>

      <div v-else-if="historyItems.length === 0" class="text-center py-8 text-muted-foreground">
        暂无历史版本
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in historyItems"
          :key="`${item.type}-${item.id}`"
          class="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <div class="font-medium">
                {{ item.title }}
              </div>

              <!-- 待审核标识 -->
              <Badge v-if="item.type === 'pending'" variant="outline" class="bg-yellow-500/10 text-yellow-600 border-yellow-600">
                待审核
              </Badge>

              <!-- 当前版本标识 -->
              <Badge v-if="item.isCurrent" class="bg-primary text-primary-foreground">
                当前版本
              </Badge>

              <!-- 冲突标识 -->
              <Badge v-if="item.hasConflict" variant="destructive">
                有冲突
              </Badge>
            </div>
            <div class="text-sm text-muted-foreground mt-1">
              {{ item.subtitle }} 于 {{ formatDate(item.timestamp) }}
            </div>
          </div>

          <!-- 待审核：显示"审核"按钮（仅有权限用户可见） -->
          <Button
            v-if="item.type === 'pending' && canReview"
            size="sm"
            variant="default"
            @click="reviewSubmission(item)"
          >
            审核
          </Button>

          <!-- 待审核：无权限用户显示"查看"按钮 -->
          <Button
            v-else-if="item.type === 'pending' && !canReview"
            size="sm"
            variant="outline"
            @click="reviewSubmission(item)"
          >
            查看
          </Button>

          <!-- 已发布版本：显示"查看"按钮 -->
          <Button
            v-else
            size="sm"
            variant="outline"
            @click="viewVersion(item)"
          >
            查看
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
