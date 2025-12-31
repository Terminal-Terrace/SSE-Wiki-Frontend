<script setup lang="ts">
import { Badge, Button, Card, ScrollArea } from '@sse-wiki/ui'
import { RichViewer } from '@sse-wiki/vue-rich-editor'
import { Code, Eye } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { computeDiff as computeDiffAlgo } from '@/utils/diff'
import { createFileHandlers } from '@/utils/editorFileHandlers'
import '@sse-wiki/vue-rich-editor/styles'

const props = withDefaults(defineProps<Props>(), {
  oldContent: null,
  oldLabel: '旧版本',
  newLabel: '新版本',
  height: '600px',
})

const fileHandlers = createFileHandlers()

interface Props {
  oldContent?: string | null
  newContent: string
  oldLabel?: string
  newLabel?: string
  height?: string // 自定义高度，默认 600px
}

// 视图模式：rendered（渲染模式，使用 Tiptap）或 text（文本对比模式）
type ViewMode = 'rendered' | 'text'
const viewMode = ref<ViewMode>('rendered')

// 控制展开/折叠状态
const showAllLines = ref(false)

// 使用新的 diff 算法
const diffs = computed(() => computeDiffAlgo(props.oldContent, props.newContent))

// 统计信息
const stats = computed(() => {
  const adds = diffs.value.filter(d => d.type === 'add').length
  const deletes = diffs.value.filter(d => d.type === 'delete').length
  const unchanged = diffs.value.filter(d => d.type === 'unchanged').length

  return { adds, deletes, unchanged }
})

// 是否为单版本显示模式（第一个版本）
const isSingleVersion = computed(() => !props.oldContent)

// 切换展开/折叠状态
function toggleExpand() {
  showAllLines.value = !showAllLines.value
}

// 获取显示的行（支持折叠）
const visibleDiffs = computed(() => {
  if (showAllLines.value || isSingleVersion.value) {
    return diffs.value
  }

  // 只显示前20行，其余折叠
  return diffs.value.slice(0, 20)
})

// 是否有更多行需要折叠
const hasMoreLines = computed(() => {
  return !showAllLines.value && diffs.value.length > 20
})
</script>

<template>
  <Card>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span v-if="!isSingleVersion" class="text-sm font-medium">{{ oldLabel }}</span>
          <span v-if="!isSingleVersion" class="text-muted-foreground">→</span>
          <span class="text-sm font-medium">{{ newLabel }}</span>
          <Badge v-if="isSingleVersion" variant="secondary" class="ml-2">
            初始版本
          </Badge>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-sm">
            <Badge v-if="!isSingleVersion" variant="outline" class="bg-green-50 text-green-700 border-green-200">
              +{{ stats.adds }}
            </Badge>
            <Badge v-if="!isSingleVersion" variant="outline" class="bg-red-50 text-red-700 border-red-200">
              -{{ stats.deletes }}
            </Badge>
            <Badge v-if="!isSingleVersion" variant="outline" class="bg-gray-50 text-gray-700 border-gray-200">
              {{ stats.unchanged }} 未改变
            </Badge>
            <Badge v-if="isSingleVersion" variant="outline" class="bg-blue-50 text-blue-700 border-blue-200">
              {{ stats.adds }} 行内容
            </Badge>
          </div>

          <!-- 视图模式切换按钮 -->
          <Button
            variant="outline"
            size="sm"
            class="text-xs"
            @click="viewMode = viewMode === 'rendered' ? 'text' : 'rendered'"
          >
            <component :is="viewMode === 'rendered' ? Code : Eye" class="h-3 w-3 mr-1" />
            {{ viewMode === 'rendered' ? '查看源码对比' : '查看渲染效果' }}
          </Button>

          <Button
            v-if="hasMoreLines && viewMode === 'text'"
            variant="ghost"
            size="sm"
            class="text-xs"
            @click="toggleExpand"
          >
            {{ showAllLines ? '折叠' : `展开全部 ${diffs.length} 行` }}
          </Button>
        </div>
      </div>
    </template>

    <ScrollArea :style="{ height }">
      <!-- 渲染模式：使用 Tiptap 编辑器 -->
      <div v-if="viewMode === 'rendered'" class="h-full">
        <!-- 单版本模式 -->
        <div v-if="isSingleVersion" class="p-4">
          <RichViewer
            :content="newContent"
            :file-handlers="{ getFileInfo: fileHandlers.getFileInfo }"
          />
        </div>

        <!-- 对比模式 -->
        <div v-else class="grid grid-cols-2 h-full">
          <!-- 左侧：旧版本 -->
          <div class="border-r border-border">
            <div class="bg-red-50 px-4 py-2 text-xs font-medium text-red-800 border-b border-border sticky top-0 z-10">
              {{ oldLabel }}
            </div>
            <div class="p-4">
              <RichViewer
                :content="oldContent || ''"
                :file-handlers="{ getFileInfo: fileHandlers.getFileInfo }"
              />
            </div>
          </div>

          <!-- 右侧：新版本 -->
          <div>
            <div class="bg-green-50 px-4 py-2 text-xs font-medium text-green-800 border-b border-border sticky top-0 z-10">
              {{ newLabel }}
            </div>
            <div class="p-4">
              <RichViewer
                :content="newContent"
                :file-handlers="{ getFileInfo: fileHandlers.getFileInfo }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 文本对比模式：原有的逐行对比 -->
      <div v-else class="font-mono text-sm">
        <!-- GitHub风格的左右对比布局 -->
        <div class="grid grid-cols-2 border-b border-border">
          <!-- 左侧：旧版本 -->
          <div class="border-r border-border">
            <div class="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 border-b border-border">
              {{ oldLabel }}
            </div>
            <div class="divide-y divide-border">
              <div
                v-for="(diff, index) in visibleDiffs"
                :key="`old-${index}`"
                class="group flex items-start hover:bg-gray-50/50 transition-colors"
                :class="{
                  'bg-red-50': diff.type === 'delete',
                  'bg-gray-50/30': diff.type === 'unchanged',
                }"
              >
                <!-- 行号 -->
                <div class="flex-shrink-0 w-12 py-1 px-2 text-right text-gray-500 select-none border-r border-gray-200">
                  <span v-if="diff.oldLine" class="text-xs">{{ diff.oldLine }}</span>
                  <span v-else class="text-xs text-gray-300">-</span>
                </div>

                <!-- 变更标记 -->
                <div class="flex-shrink-0 w-6 py-1 text-center">
                  <span
                    v-if="diff.type === 'delete'"
                    class="text-red-600 font-bold text-sm"
                  >
                    -
                  </span>
                  <span
                    v-else-if="diff.type === 'unchanged'"
                    class="text-gray-400 text-sm"
                  >
                    &nbsp;
                  </span>
                </div>

                <!-- 内容 -->
                <div
                  class="flex-1 py-1 px-2 whitespace-pre-wrap break-words"
                  :class="{
                    'text-red-800': diff.type === 'delete',
                    'text-gray-700': diff.type === 'unchanged',
                  }"
                >
                  {{ diff.oldContent }}
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：新版本 -->
          <div>
            <div class="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 border-b border-border">
              {{ newLabel }}
            </div>
            <div class="divide-y divide-border">
              <div
                v-for="(diff, index) in visibleDiffs"
                :key="`new-${index}`"
                class="group flex items-start hover:bg-gray-50/50 transition-colors"
                :class="{
                  'bg-green-50': diff.type === 'add',
                  'bg-gray-50/30': diff.type === 'unchanged',
                }"
              >
                <!-- 行号 -->
                <div class="flex-shrink-0 w-12 py-1 px-2 text-right text-gray-500 select-none border-r border-gray-200">
                  <span v-if="diff.newLine" class="text-xs">{{ diff.newLine }}</span>
                  <span v-else class="text-xs text-gray-300">-</span>
                </div>

                <!-- 变更标记 -->
                <div class="flex-shrink-0 w-6 py-1 text-center">
                  <span
                    v-if="diff.type === 'add'"
                    class="text-green-600 font-bold text-sm"
                  >
                    +
                  </span>
                  <span
                    v-else-if="diff.type === 'unchanged'"
                    class="text-gray-400 text-sm"
                  >
                    &nbsp;
                  </span>
                </div>

                <!-- 内容 -->
                <div
                  class="flex-1 py-1 px-2 whitespace-pre-wrap break-words"
                  :class="{
                    'text-green-800': diff.type === 'add',
                    'text-gray-700': diff.type === 'unchanged',
                  }"
                >
                  {{ diff.newContent }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 折叠提示 -->
        <div v-if="hasMoreLines && !showAllLines" class="text-center py-4 bg-gray-50 border-t border-border">
          <Button variant="ghost" size="sm" class="text-gray-600" @click="toggleExpand">
            显示更多 {{ diffs.length - 20 }} 行...
          </Button>
        </div>

        <!-- 空状态 -->
        <div v-if="diffs.length === 0" class="text-center py-12 text-muted-foreground">
          <p>两个版本内容相同</p>
        </div>
      </div>
    </ScrollArea>
  </Card>
</template>
