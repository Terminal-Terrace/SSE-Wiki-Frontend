<script setup lang="ts">
import type { HistoryEntry } from '@/types/article'
import { Badge, Button } from '@sse-wiki/ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { articleApi } from '@/services/articleApi'
import { getSubmissionStatusConfig, getVersionStatusConfig } from '@/types/article'

interface Props {
  pageId: string | number
  versions?: any[] // 已废弃，保留以兼容旧代码
}

const props = defineProps<Props>()
const router = useRouter()

const loading = ref(false)
const historyItems = ref<HistoryEntry[]>([])
const currentUserRole = ref<string | null>(null)
const currentVersionId = ref<number | null>(null)

// 判断当前用户是否有审核权限
const canReview = computed(() => {
  const role = currentUserRole.value
  return role === 'admin' || role === 'moderator' || role === 'owner'
})

/**
 * 格式化日期为本地化字符串
 * @param date - ISO 格式的日期字符串
 * @returns 本地化的日期时间字符串
 */
function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

/**
 * 获取历史条目的显示标题
 * @param entry - 历史条目数据
 * @returns 提交信息或默认文本
 */
function getTitle(entry: HistoryEntry): string {
  return entry.commit_message || '未命名修改'
}

/**
 * 获取历史条目的副标题（作者信息）
 * @param entry - 历史条目数据
 * @returns 格式化的作者和操作类型文本
 */
function getSubtitle(entry: HistoryEntry): string {
  const author = entry.author?.username || `用户${entry.author_id}`
  return `由 ${author} ${entry.entry_type === 'submission' ? '提交' : '编辑'}`
}

/**
 * 判断条目是否为当前版本
 * @param entry - 历史条目数据
 * @returns 如果是当前版本返回 true
 */
function isCurrent(entry: HistoryEntry): boolean {
  return entry.entry_type === 'version' && entry.version_id === currentVersionId.value
}

/**
 * 获取状态徽章配置
 * @param entry - 历史条目数据
 * @returns Badge 配置对象或 null
 */
function getBadgeConfig(entry: HistoryEntry) {
  if (entry.entry_type === 'submission' && entry.submission_status) {
    return getSubmissionStatusConfig(entry.submission_status)
  }
  if (entry.entry_type === 'version' && entry.status) {
    return getVersionStatusConfig(entry.status)
  }
  return null
}

/**
 * 获取操作按钮的配置
 * 根据条目类型、状态和用户权限决定按钮文本和样式
 * @param entry - 历史条目数据
 * @returns 包含按钮文本和变体的对象
 */
function getActionButton(entry: HistoryEntry): { text: string, variant: 'default' | 'outline' } {
  // 提交类型
  if (entry.entry_type === 'submission') {
    // 有审核权限
    if (canReview.value) {
      if (entry.submission_status === 'pending') {
        return { text: '审核', variant: 'default' }
      }
      if (entry.submission_status === 'conflict_detected') {
        return { text: '继续审核', variant: 'default' }
      }
    }
    // 无权限或其他状态
    return { text: '查看', variant: 'outline' }
  }

  // 版本类型
  return { text: '查看', variant: 'outline' }
}

/**
 * 加载文章历史记录
 * 从 API 获取文章详情，包含统一的 history 字段
 * history 字段包含版本和提交的统一列表
 */
async function loadHistory() {
  if (!props.pageId)
    return

  loading.value = true
  try {
    // 获取文章详情（包含 history 和 current_user_role）
    const article = await articleApi.getArticle(props.pageId)

    // 保存当前用户角色和当前版本ID
    currentUserRole.value = article.current_user_role || null
    currentVersionId.value = article.current_version_id

    // 使用统一的 history 字段
    if (article.history && article.history.length > 0) {
      // 按时间倒序排序（最新的在前）
      historyItems.value = [...article.history].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    }
    else {
      historyItems.value = []
    }
  }
  catch (error) {
    console.error('Failed to load history:', error)
    historyItems.value = []
  }
  finally {
    loading.value = false
  }
}

/**
 * 处理历史条目的点击操作
 * 根据条目类型和用户权限跳转到相应页面（审核或查看）
 * @param entry - 被点击的历史条目
 */
function handleAction(entry: HistoryEntry) {
  if (entry.entry_type === 'submission' && entry.submission_id) {
    // 审核或查看提交
    if (canReview.value && (entry.submission_status === 'pending' || entry.submission_status === 'conflict_detected')) {
      // 跳转到审核页面
      router.push({
        path: `/articles/${props.pageId}/review/${entry.submission_id}`,
      })
    }
    else {
      // 跳转到查看页面
      router.push({
        path: `/articles/${props.pageId}/version`,
        query: {
          submissionId: String(entry.submission_id),
        },
      })
    }
  }
  else if (entry.entry_type === 'version' && entry.version_id) {
    // 查看版本
    router.push({
      path: `/articles/${props.pageId}/version`,
      query: {
        versionId: String(entry.version_id),
      },
    })
  }
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
          v-for="entry in historyItems"
          :key="`${entry.entry_type}-${entry.entry_id}`"
          class="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <div class="font-medium">
                {{ getTitle(entry) }}
              </div>

              <!-- 当前版本标识 -->
              <Badge v-if="isCurrent(entry)" class="bg-primary text-primary-foreground">
                当前版本
              </Badge>

              <!-- 状态标识 -->
              <Badge
                v-if="getBadgeConfig(entry)"
                :variant="getBadgeConfig(entry)?.variant"
              >
                {{ getBadgeConfig(entry)?.label }}
              </Badge>

              <!-- 冲突标识 -->
              <Badge v-if="entry.has_conflict" variant="destructive">
                有冲突
              </Badge>
            </div>
            <div class="text-sm text-muted-foreground mt-1">
              {{ getSubtitle(entry) }} 于 {{ formatDate(entry.created_at) }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <Button
            size="sm"
            :variant="getActionButton(entry).variant"
            @click="handleAction(entry)"
          >
            {{ getActionButton(entry).text }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
