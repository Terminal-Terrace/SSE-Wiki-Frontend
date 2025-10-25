<script setup lang="ts">
import type { HistoryEntry } from '@/types/article'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@sse-wiki/ui'
import { History } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { TooltipWrapper } from '@/components/common/tooltip'
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
 * 获取状态的 Tooltip 说明
 * @param entry - 历史条目数据
 * @returns Tooltip 文本
 */
function getStatusTooltip(entry: HistoryEntry): string {
  if (entry.entry_type === 'submission' && entry.submission_status) {
    const tooltips: Record<string, string> = {
      pending: '等待管理员审核通过',
      conflict_detected: '与当前版本存在冲突，需要手动解决',
      merged: '已通过审核并发布',
      rejected: '审核未通过',
      auto_published: '自动发布（作者有直接发布权限）',
    }
    return tooltips[entry.submission_status] || '未知状态'
  }
  if (entry.entry_type === 'version' && entry.status) {
    const tooltips: Record<string, string> = {
      published: '已发布的正式版本',
      draft: '草稿状态',
    }
    return tooltips[entry.status] || '未知状态'
  }
  return ''
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
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <History class="h-5 w-5" />
        历史版本
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-3">
        <Card v-for="i in 3" :key="i">
          <CardContent class="p-4">
            <div class="flex items-center justify-between">
              <div class="flex-1 space-y-2">
                <Skeleton class="h-5 w-3/4" />
                <Skeleton class="h-4 w-1/2" />
              </div>
              <Skeleton class="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Empty v-else-if="historyItems.length === 0">
        <EmptyMedia variant="icon">
          <History class="h-6 w-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>暂无历史版本</EmptyTitle>
          <EmptyDescription>
            开始编辑文档后，版本历史将显示在这里
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div v-else class="space-y-3">
        <Card
          v-for="entry in historyItems"
          :key="`${entry.entry_type}-${entry.entry_id}`"
          class="hover:shadow-md transition-shadow cursor-pointer"
          @click="handleAction(entry)"
        >
          <CardContent class="p-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="font-medium">{{ getTitle(entry) }}</span>

                  <TooltipWrapper v-if="isCurrent(entry)" tooltip="这是文章的最新发布版本">
                    <Badge class="bg-primary text-primary-foreground cursor-help">
                      当前版本
                    </Badge>
                  </TooltipWrapper>

                  <TooltipWrapper v-if="getBadgeConfig(entry)" :tooltip="getStatusTooltip(entry)">
                    <Badge
                      :variant="getBadgeConfig(entry)?.variant"
                      class="cursor-help"
                    >
                      {{ getBadgeConfig(entry)?.label }}
                    </Badge>
                  </TooltipWrapper>

                  <TooltipWrapper v-if="entry.has_conflict" tooltip="此提交与当前版本存在内容冲突，需要审核时手动合并">
                    <Badge variant="destructive" class="cursor-help">
                      有冲突
                    </Badge>
                  </TooltipWrapper>
                </div>
                <CardDescription>
                  {{ getSubtitle(entry) }} 于 {{ formatDate(entry.created_at) }}
                </CardDescription>
              </div>

              <Button
                size="sm"
                :variant="getActionButton(entry).variant"
                @click.stop="handleAction(entry)"
              >
                {{ getActionButton(entry).text }}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  </Card>
</template>
