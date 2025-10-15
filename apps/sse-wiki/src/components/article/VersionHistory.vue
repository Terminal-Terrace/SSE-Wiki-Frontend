<script setup lang="ts">
import type { ArticleVersion } from '@/types/article'
import { Badge, Button, Card, ScrollArea } from '@sse-wiki/ui'
import { Clock, Eye, GitCommit } from 'lucide-vue-next'
import { computed } from 'vue'
import { getVersionStatusConfig } from '@/types/article'
import { formatDate } from '@/utils/format'

interface Props {
  versions: ArticleVersion[]
  currentVersionId?: number | null
  loading?: boolean
}

interface Emits {
  (e: 'view', version: ArticleVersion): void
  (e: 'compare', version: ArticleVersion): void
  (e: 'restore', version: ArticleVersion): void
}

const props = withDefaults(defineProps<Props>(), {
  currentVersionId: null,
  loading: false,
})

const emit = defineEmits<Emits>()

// 按版本号降序排列
const sortedVersions = computed(() => {
  return [...props.versions].sort((a, b) => b.version_number - a.version_number)
})
</script>

<template>
  <Card>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <GitCommit class="h-5 w-5 text-muted-foreground" />
          <h3 class="text-lg font-semibold">
            版本历史
          </h3>
        </div>
        <Badge variant="outline">
          {{ versions.length }} 个版本
        </Badge>
      </div>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>

    <!-- 版本列表 -->
    <ScrollArea v-else class="h-[600px]">
      <div class="space-y-3 p-4">
        <div
          v-for="version in sortedVersions"
          :key="version.id"
          class="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
          :class="{
            'bg-accent': version.id === currentVersionId,
            'border-primary': version.id === currentVersionId,
          }"
        >
          <!-- 版本头部 -->
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <Badge
                :variant="getVersionStatusConfig(version.status).variant"
                class="font-mono"
              >
                v{{ version.version_number }}
              </Badge>
              <Badge
                v-if="version.id === currentVersionId"
                variant="default"
              >
                当前版本
              </Badge>
              <Badge
                v-else
                :variant="getVersionStatusConfig(version.status).variant"
              >
                {{ getVersionStatusConfig(version.status).label }}
              </Badge>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                title="查看此版本"
                @click="emit('view', version)"
              >
                <Eye class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <!-- 提交信息 -->
          <p class="text-sm font-medium text-foreground mb-2">
            {{ version.commit_message || '无提交说明' }}
          </p>

          <!-- 元信息 -->
          <div class="flex items-center gap-4 text-xs text-muted-foreground">
            <div class="flex items-center gap-1">
              <Clock class="h-3 w-3" />
              <span>{{ formatDate(version.created_at) }}</span>
            </div>
            <div v-if="version.author" class="flex items-center gap-1">
              <span>作者:</span>
              <span class="font-medium">{{ version.author.username }}</span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="sortedVersions.length === 0" class="text-center py-12 text-muted-foreground">
          <GitCommit class="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>暂无版本历史</p>
        </div>
      </div>
    </ScrollArea>
  </Card>
</template>
