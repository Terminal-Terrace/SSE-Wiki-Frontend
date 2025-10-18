<script setup lang="ts">
import { Badge, Card, ScrollArea } from '@sse-wiki/ui'
import { computed } from 'vue'

interface Props {
  oldContent?: string | null
  newContent: string
  oldLabel?: string
  newLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  oldContent: null,
  oldLabel: '旧版本',
  newLabel: '新版本',
})

// 简单的行级 diff 算法
function computeDiff() {
  // 如果没有旧内容，直接显示新内容（第一个版本的情况）
  if (!props.oldContent) {
    const newLines = props.newContent.split('\n')
    return newLines.map((line, index) => ({
      type: 'add' as const,
      newLine: index + 1,
      content: line,
    }))
  }

  const oldLines = props.oldContent.split('\n')
  const newLines = props.newContent.split('\n')

  const diffs: Array<{
    type: 'add' | 'delete' | 'unchanged'
    oldLine?: number
    newLine?: number
    content: string
  }> = []

  let oldIndex = 0
  let newIndex = 0

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex]
    const newLine = newLines[newIndex]

    if (oldLine === newLine) {
      // 相同行
      diffs.push({
        type: 'unchanged',
        oldLine: oldIndex + 1,
        newLine: newIndex + 1,
        content: oldLine ?? '',
      })
      oldIndex++
      newIndex++
    }
    else if (oldIndex >= oldLines.length) {
      // 新增行
      diffs.push({
        type: 'add',
        newLine: newIndex + 1,
        content: newLine ?? '',
      })
      newIndex++
    }
    else if (newIndex >= newLines.length) {
      // 删除行
      diffs.push({
        type: 'delete',
        oldLine: oldIndex + 1,
        content: oldLine ?? '',
      })
      oldIndex++
    }
    else {
      // 修改行（简化处理：先删除后添加）
      diffs.push({
        type: 'delete',
        oldLine: oldIndex + 1,
        content: oldLine ?? '',
      })
      diffs.push({
        type: 'add',
        newLine: newIndex + 1,
        content: newLine ?? '',
      })
      oldIndex++
      newIndex++
    }
  }

  return diffs
}

const diffs = computed(() => computeDiff())

// 统计信息
const stats = computed(() => {
  const adds = diffs.value.filter(d => d.type === 'add').length
  const deletes = diffs.value.filter(d => d.type === 'delete').length
  const unchanged = diffs.value.filter(d => d.type === 'unchanged').length

  return { adds, deletes, unchanged }
})

// 是否为单版本显示模式（第一个版本）
const isSingleVersion = computed(() => !props.oldContent)
</script>

<template>
  <Card>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span v-if="!isSingleVersion" class="text-sm text-muted-foreground">{{ oldLabel }}</span>
          <span v-if="!isSingleVersion" class="text-muted-foreground">→</span>
          <span class="text-sm text-muted-foreground">{{ newLabel }}</span>
          <Badge v-if="isSingleVersion" variant="secondary" class="ml-2">
            初始版本
          </Badge>
        </div>

        <div class="flex items-center gap-3 text-sm">
          <Badge v-if="!isSingleVersion" variant="outline" class="bg-green-500/10 text-green-600 border-green-500/20">
            +{{ stats.adds }}
          </Badge>
          <Badge v-if="!isSingleVersion" variant="outline" class="bg-red-500/10 text-red-600 border-red-500/20">
            -{{ stats.deletes }}
          </Badge>
          <Badge v-if="!isSingleVersion" variant="outline">
            {{ stats.unchanged }} 未改变
          </Badge>
          <Badge v-if="isSingleVersion" variant="outline" class="bg-blue-500/10 text-blue-600 border-blue-500/20">
            {{ stats.adds }} 行内容
          </Badge>
        </div>
      </div>
    </template>

    <ScrollArea class="h-[600px]">
      <div class="font-mono text-sm">
        <div
          v-for="(diff, index) in diffs"
          :key="index"
          class="flex items-start hover:bg-accent/50 transition-colors"
          :class="{
            'bg-green-500/5': diff.type === 'add',
            'bg-red-500/5': diff.type === 'delete',
          }"
        >
          <!-- 行号 -->
          <div class="flex-shrink-0 w-20 py-1 px-2 text-right text-muted-foreground/60 border-r border-border select-none">
            <span v-if="!isSingleVersion && 'oldLine' in diff && diff.oldLine" class="inline-block w-8">{{ diff.oldLine }}</span>
            <span v-else-if="!isSingleVersion" class="inline-block w-8" />
            <span v-if="diff.newLine" class="inline-block w-8">{{ diff.newLine }}</span>
            <span v-else class="inline-block w-8" />
          </div>

          <!-- 变更标记 -->
          <div
            class="flex-shrink-0 w-8 py-1 px-2 text-center font-bold select-none"
            :class="{
              'text-green-600': diff.type === 'add',
              'text-red-600': diff.type === 'delete',
              'text-muted-foreground/40': diff.type === 'unchanged',
              'text-blue-600': isSingleVersion && diff.type === 'add',
            }"
          >
            <span v-if="diff.type === 'add'">+</span>
            <span v-else-if="diff.type === 'delete'">-</span>
            <span v-else />
          </div>

          <!-- 内容 -->
          <div
            class="flex-1 py-1 px-2 whitespace-pre-wrap break-words"
            :class="{
              'text-foreground': diff.type !== 'unchanged',
              'text-muted-foreground/80': diff.type === 'unchanged',
            }"
          >
            {{ diff.content }}
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="diffs.length === 0" class="text-center py-12 text-muted-foreground">
          <p>两个版本内容相同</p>
        </div>
      </div>
    </ScrollArea>
  </Card>
</template>
