<script setup lang="ts">
import type { ThreeWayMergeData } from '@/types/article'
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, toast } from '@sse-wiki/ui'
import { AlertTriangle, CheckCircle2, GitMerge } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import DiffViewer from './DiffViewer.vue'

interface Props {
  conflictData: ThreeWayMergeData
  submissionId: number
}

interface Emits {
  (e: 'resolve', mergedContent: string): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 动态生成冲突标记
 * 如果后端没有提供 merged_content，前端根据三方内容生成冲突标记
 */
function generateConflictMarkers(data: ThreeWayMergeData): string {
  if (data.merged_content) {
    // 如果后端提供了，直接使用（向后兼容）
    return data.merged_content
  }

  // 前端动态生成冲突标记（标准 Git 格式）
  let result = ''

  result += '<<<<<<< THEIRS (提交者的修改)\n'
  result += data.their_content
  if (!data.their_content.endsWith('\n')) {
    result += '\n'
  }

  result += '=======\n'
  result += data.our_content
  if (!data.our_content.endsWith('\n')) {
    result += '\n'
  }

  result += '>>>>>>> OURS (当前线上版本)\n'

  return result
}

// 合并内容（可编辑）
const mergedContent = ref(generateConflictMarkers(props.conflictData))

// 监听外部数据变化，动态重新生成冲突标记
watch(() => props.conflictData, (newData) => {
  mergedContent.value = generateConflictMarkers(newData)
}, { deep: true })

// 检查是否已解决所有冲突标记
const conflictResolved = computed(() => {
  return !mergedContent.value.includes('<<<<<<<')
    && !mergedContent.value.includes('=======')
    && !mergedContent.value.includes('>>>>>>>')
})

// 统计冲突数量
const conflictCount = computed(() => {
  const matches = mergedContent.value.match(/<<<<<<</g)
  return matches ? matches.length : 0
})

// 自动合并（无冲突）
function handleAutoMerge() {
  emit('resolve', mergedContent.value)
}

// 手动解决冲突
function handleManualResolve() {
  if (!conflictResolved.value) {
    toast({
      title: '请先解决所有冲突标记',
      variant: 'destructive',
    })
    return
  }

  emit('resolve', mergedContent.value)
}

// 取消
function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="space-y-6">
    <!-- 顶部信息 -->
    <Alert :variant="conflictData.has_conflict ? 'destructive' : 'default'">
      <AlertTriangle v-if="conflictData.has_conflict" class="h-4 w-4" />
      <CheckCircle2 v-else class="h-4 w-4" />
      <AlertTitle>
        {{ conflictData.has_conflict ? '检测到冲突' : '无冲突，可自动合并' }}
      </AlertTitle>
      <AlertDescription>
        <span v-if="conflictData.has_conflict">
          检测到 {{ conflictCount }} 处冲突，需要手动解决。请编辑下方合并结果并删除冲突标记。
        </span>
        <span v-else>
          提交者的修改与当前版本无冲突，可以自动合并。
        </span>
      </AlertDescription>
    </Alert>

    <!-- 三栏对比视图 -->
    <div class="grid grid-cols-3 gap-4">
      <!-- Base 版本 -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">Base 版本</span>
            <Badge variant="outline">
              v{{ conflictData.base_version_number || '?' }}
            </Badge>
          </div>
        </template>
        <div class="p-4 max-h-96 overflow-y-auto">
          <pre class="text-xs whitespace-pre-wrap break-words font-mono">{{ conflictData.base_content }}</pre>
        </div>
      </Card>

      <!-- 提交者的修改 -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">提交者的修改</span>
            <Badge variant="default">
              {{ conflictData.submitter_name || '提交者' }}
            </Badge>
          </div>
        </template>
        <DiffViewer
          :old-content="conflictData.base_content"
          :new-content="conflictData.their_content"
          old-label="Base"
          new-label="提交版本"
        />
      </Card>

      <!-- 当前线上版本 -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">当前线上版本</span>
            <Badge variant="secondary">
              v{{ conflictData.our_version_number || '?' }}
            </Badge>
          </div>
        </template>
        <DiffViewer
          :old-content="conflictData.base_content"
          :new-content="conflictData.our_content"
          old-label="Base"
          new-label="当前版本"
        />
      </Card>
    </div>

    <!-- 合并结果编辑区 -->
    <Card>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <GitMerge class="h-5 w-5" />
            <span class="font-semibold">合并结果</span>
          </div>
          <Badge v-if="conflictData.has_conflict && !conflictResolved" variant="destructive">
            {{ conflictCount }} 处冲突待解决
          </Badge>
          <Badge v-else-if="conflictResolved" variant="default" class="bg-green-500">
            已解决所有冲突
          </Badge>
        </div>
      </template>

      <Tabs default-value="edit">
        <TabsList class="ml-4">
          <TabsTrigger value="edit">
            编辑
          </TabsTrigger>
          <TabsTrigger value="preview">
            预览
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" class="m-0">
          <Textarea
            v-model="mergedContent"
            :readonly="!conflictData.has_conflict"
            class="min-h-[400px] font-mono text-sm border-0 rounded-none resize-none focus-visible:ring-0"
            :placeholder="conflictData.has_conflict ? '编辑合并结果，删除冲突标记...' : '自动合并的内容'"
          />
        </TabsContent>

        <TabsContent value="preview" class="m-0">
          <div class="p-6 min-h-[400px] prose prose-sm max-w-none">
            <pre class="whitespace-pre-wrap break-words">{{ mergedContent }}</pre>
          </div>
        </TabsContent>
      </Tabs>

      <!-- 冲突标记说明 -->
      <div v-if="conflictData.has_conflict" class="border-t border-border bg-muted/30 p-4">
        <p class="text-sm font-medium mb-2">
          冲突标记格式：
        </p>
        <pre class="text-xs bg-background p-3 rounded-md border border-border overflow-x-auto">
&lt;&lt;&lt;&lt;&lt;&lt;&lt; THEIRS (提交者的修改)
提交者的内容
=======
当前线上的内容
&gt;&gt;&gt;&gt;&gt;&gt;&gt; OURS (当前线上版本)
        </pre>
        <p class="text-xs text-muted-foreground mt-2">
          请手动编辑上方内容，删除冲突标记并保留正确的内容
        </p>
      </div>
    </Card>

    <!-- 操作按钮 -->
    <div class="flex items-center justify-end gap-3">
      <Button variant="outline" @click="handleCancel">
        取消
      </Button>
      <Button
        v-if="!conflictData.has_conflict"
        variant="default"
        @click="handleAutoMerge"
      >
        <CheckCircle2 class="h-4 w-4 mr-2" />
        自动合并并发布
      </Button>
      <Button
        v-else
        variant="default"
        :disabled="!conflictResolved"
        @click="handleManualResolve"
      >
        <GitMerge class="h-4 w-4 mr-2" />
        确认合并并发布
      </Button>
    </div>
  </div>
</template>
