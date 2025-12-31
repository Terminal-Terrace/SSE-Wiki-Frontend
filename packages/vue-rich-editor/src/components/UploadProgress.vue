<script setup lang="ts">
import type { UploadTask } from '../composables'
/**
 * 上传进度组件
 * 显示多文件上传进度列表，支持折叠/展开、重试和移除操作
 */
import { Button, Progress } from '@sse-wiki/ui'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Upload,
  X,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  tasks: UploadTask[]
  collapsed?: boolean
}>(), {
  collapsed: false,
})

const emit = defineEmits<{
  retry: [taskId: string]
  remove: [taskId: string]
  toggleCollapse: []
}>()

const isCollapsed = ref(props.collapsed)

// 统计信息
const stats = computed(() => {
  const total = props.tasks.length
  const uploading = props.tasks.filter(t => t.status === 'uploading').length
  const success = props.tasks.filter(t => t.status === 'success').length
  const error = props.tasks.filter(t => t.status === 'error').length
  const pending = props.tasks.filter(t => t.status === 'pending').length
  return { total, uploading, success, error, pending }
})

// 是否有活动任务
const hasActiveTasks = computed(() =>
  stats.value.uploading > 0 || stats.value.pending > 0,
)

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  emit('toggleCollapse')
}

function handleRetry(taskId: string) {
  emit('retry', taskId)
}

function handleRemove(taskId: string) {
  emit('remove', taskId)
}

function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}
</script>

<template>
  <div v-if="tasks.length > 0" class="upload-progress border-b bg-muted/50">
    <!-- 头部：统计信息和折叠按钮 -->
    <div
      class="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/70 transition-colors"
      @click="toggleCollapse"
    >
      <div class="flex items-center gap-2">
        <Upload v-if="hasActiveTasks" class="h-4 w-4 animate-pulse text-primary" />
        <CheckCircle2 v-else-if="stats.error === 0" class="h-4 w-4 text-green-500" />
        <AlertCircle v-else class="h-4 w-4 text-destructive" />

        <span class="text-sm font-medium">
          <template v-if="hasActiveTasks">
            上传中 {{ stats.uploading + stats.pending }}/{{ stats.total }}
          </template>
          <template v-else-if="stats.error > 0">
            {{ stats.error }} 个文件上传失败
          </template>
          <template v-else>
            {{ stats.success }} 个文件上传完成
          </template>
        </span>
      </div>

      <Button variant="ghost" size="sm" class="h-6 w-6 p-0">
        <ChevronUp v-if="!isCollapsed" class="h-4 w-4" />
        <ChevronDown v-else class="h-4 w-4" />
      </Button>
    </div>

    <!-- 任务列表 -->
    <div v-if="!isCollapsed" class="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="flex items-center gap-3 p-2 rounded-md bg-background/50"
      >
        <!-- 状态图标 -->
        <div class="flex-shrink-0">
          <Upload
            v-if="task.status === 'uploading' || task.status === 'pending'"
            class="h-4 w-4 text-primary"
            :class="{ 'animate-pulse': task.status === 'uploading' }"
          />
          <CheckCircle2 v-else-if="task.status === 'success'" class="h-4 w-4 text-green-500" />
          <AlertCircle v-else class="h-4 w-4 text-destructive" />
        </div>

        <!-- 文件信息和进度 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm truncate" :title="task.file.name">
              {{ task.file.name }}
            </span>
            <span class="text-xs text-muted-foreground ml-2 flex-shrink-0">
              {{ formatFileSize(task.file.size) }}
            </span>
          </div>

          <!-- 进度条 -->
          <template v-if="task.status === 'uploading'">
            <Progress :model-value="task.progress" class="h-1.5" />
            <span class="text-xs text-muted-foreground">{{ task.progress }}%</span>
          </template>

          <!-- 错误信息 -->
          <template v-else-if="task.status === 'error'">
            <span class="text-xs text-destructive">{{ task.error || '上传失败' }}</span>
          </template>

          <!-- 等待中 -->
          <template v-else-if="task.status === 'pending'">
            <span class="text-xs text-muted-foreground">等待上传...</span>
          </template>
        </div>

        <!-- 操作按钮 -->
        <div class="flex-shrink-0 flex items-center gap-1">
          <!-- 重试按钮 -->
          <Button
            v-if="task.status === 'error'"
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0"
            title="重试"
            @click.stop="handleRetry(task.id)"
          >
            <RefreshCw class="h-3 w-3" />
          </Button>

          <!-- 移除按钮 -->
          <Button
            v-if="task.status !== 'uploading'"
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0"
            title="移除"
            @click.stop="handleRemove(task.id)"
          >
            <X class="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-progress {
  transition: all 0.2s ease;
}
</style>
