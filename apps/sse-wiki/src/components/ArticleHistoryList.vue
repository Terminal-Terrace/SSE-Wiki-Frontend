<script setup lang="ts">
import { ref } from 'vue'

interface Version {
  id: string | number
  commitMessage: string
  editor: string
  timestamp: string
}

interface Props {
  pageId: string | number
  versions?: Version[]
}

defineProps<Props>()

const loading = ref(false)

// TODO: 实现日期格式化
function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}
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

      <div v-else-if="versions?.length === 0" class="text-center py-8 text-muted-foreground">
        暂无历史版本
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="version in versions"
          :key="version.id"
          class="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div class="flex-1">
            <div class="font-medium">
              {{ version.commitMessage }}
            </div>
            <div class="text-sm text-muted-foreground mt-1">
              由 {{ version.editor }} 编辑于 {{ formatDate(version.timestamp) }}
            </div>
          </div>
          <button class="px-3 py-1 text-sm border border-input rounded hover:bg-muted transition-colors">
            查看
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
