<script setup lang="ts">
import { Button, Card, CardContent } from '@sse-wiki/ui'
/**
 * 文件卡片组件
 * 用于在编辑器中显示文件（非图片类型）
 */
import { NodeViewWrapper } from '@tiptap/vue-3'
import {
  Archive,
  Code,
  Download,
  File,
  FileText,
  Image,
  Music,
  Video,
} from 'lucide-vue-next'
import { computed } from 'vue'
import ImageCard from './ImageCard.vue'

const props = defineProps<{
  node: {
    attrs: {
      fileId: string
      fileName: string
      fileSize: number
      fileType: string
      fileUrl: string
      category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other'
      missing?: boolean
    }
  }
  selected: boolean
  editor?: any
  getPos?: () => number
}>()

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`
}

// 获取文件图标和颜色
const fileIcon = computed(() => {
  const category = props.node.attrs.category
  switch (category) {
    case 'image':
      return { component: Image, color: 'bg-blue-500' }
    case 'video':
      return { component: Video, color: 'bg-purple-500' }
    case 'audio':
      return { component: Music, color: 'bg-green-500' }
    case 'document':
      return { component: FileText, color: 'bg-orange-500' }
    case 'archive':
      return { component: Archive, color: 'bg-gray-500' }
    case 'code':
      return { component: Code, color: 'bg-pink-500' }
    default:
      return { component: File, color: 'bg-gray-400' }
  }
})

// 点击卡片打开文件（在线预览）
function handleOpen() {
  window.open(props.node.attrs.fileUrl, '_blank')
}

// 下载文件
function handleDownload(e: Event) {
  e.stopPropagation()
  const link = document.createElement('a')
  link.href = props.node.attrs.fileUrl
  link.download = props.node.attrs.fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <!-- 图片类型使用专门的组件 -->
  <ImageCard
    v-if="node.attrs.category === 'image'"
    :node="node"
    :selected="selected"
    :editor="editor"
    :get-pos="getPos"
  />

  <!-- 其他类型文件使用 Card 组件 -->
  <NodeViewWrapper v-else class="file-card-wrapper">
    <!-- 文件已失效的占位符 -->
    <Card
      v-if="node.attrs.missing"
      class="file-card my-4 border-dashed border-2 border-gray-300 bg-gray-50"
      :class="{ 'ring-2 ring-primary': selected }"
    >
      <CardContent class="flex items-center gap-4 p-4">
        <!-- 失效图标 -->
        <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-300 text-gray-500">
          <File class="h-6 w-6" />
        </div>

        <!-- 文件信息 -->
        <div class="flex-1 overflow-hidden">
          <div class="font-medium text-gray-500 truncate">
            {{ node.attrs.fileName }}
          </div>
          <div class="text-sm text-gray-400">
            文件已失效或已删除
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 正常文件卡片 -->
    <Card
      v-else
      class="file-card group my-4 cursor-pointer transition-all hover:shadow-md"
      :class="{ 'ring-2 ring-primary': selected }"
      @click="handleOpen"
    >
      <CardContent class="flex items-center gap-4 p-4">
        <!-- 文件图标 -->
        <div
          class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-white"
          :class="fileIcon.color"
        >
          <component :is="fileIcon.component" class="h-6 w-6" />
        </div>

        <!-- 文件信息 -->
        <div class="flex-1 overflow-hidden">
          <div class="font-medium text-foreground truncate">
            {{ node.attrs.fileName }}
          </div>
          <div class="text-sm text-muted-foreground">
            {{ formatFileSize(node.attrs.fileSize) }} • {{ node.attrs.fileType }}
          </div>
        </div>

        <!-- 下载按钮 -->
        <div class="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click="handleDownload"
          >
            <Download class="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  </NodeViewWrapper>
</template>

<style scoped>
.file-card-wrapper {
  margin: 0;
}

.file-card {
  user-select: none;
}
</style>
