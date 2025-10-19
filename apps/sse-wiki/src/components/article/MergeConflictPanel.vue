<script setup lang="ts">
import type { ThreeWayMergeData } from '@/types/article'
import { Badge, Button, Card, Textarea, toast, ToggleGroup, ToggleGroupItem } from '@sse-wiki/ui'
import { Code, Eye, GitMerge, XCircle } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import ContentEditor from '@/components/common/editor/ContentEditor.vue'
import { simpleThreeWayMerge, threeWayMerge } from '@/utils/diff'
import ComparisonPanel from './ComparisonPanel.vue'

interface Props {
  conflictData: ThreeWayMergeData
  submissionId: number
  canReview?: boolean // 是否有审核权限
  isReadOnly?: boolean // 是否为只读模式
}

interface Emits {
  (e: 'resolve', mergedContent: string, notes?: string): void
  (e: 'reject', notes: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 生成合并内容（带文本冲突标记）
 */
function generateMergedContent(data: ThreeWayMergeData): string {
  if (data.merged_content) {
    return data.merged_content
  }

  try {
    // 尝试使用智能三方合并算法
    const mergeResult = threeWayMerge(
      data.base_content,
      data.their_content,
      data.our_content,
    )

    return mergeResult.merged
  }
  catch (error) {
    console.error('Three-way merge failed, falling back to simple merge:', error)

    // 如果智能合并失败，使用简单的整体冲突标记
    return simpleThreeWayMerge(
      data.base_content,
      data.their_content,
      data.our_content,
    )
  }
}

// 合并内容（可编辑）
const mergedContent = ref(generateMergedContent(props.conflictData))

// 控制预览显示
const showPreview = ref(false)

// 审核备注（用于驳回或合并时的说明）
const reviewNotes = ref('')

// 编辑模式：wysiwyg（富文本模式，默认）或 source（源码模式，用于高级调试）
type EditorMode = 'source' | 'wysiwyg'
const editorMode = ref<EditorMode>('wysiwyg')

// 监听外部数据变化，动态重新生成冲突标记
watch(() => props.conflictData, (newData) => {
  mergedContent.value = generateMergedContent(newData)
}, { deep: true })

// 切换编辑模式
function toggleEditorMode(mode: any) {
  if (mode === 'source' || mode === 'wysiwyg') {
    editorMode.value = mode
  }
}

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

// 手动解决冲突
function handleManualResolve() {
  if (!conflictResolved.value) {
    toast({
      title: '请先解决所有冲突标记',
      variant: 'destructive',
    })
    return
  }

  emit('resolve', mergedContent.value, reviewNotes.value || undefined)
}

// 驳回提交
function handleReject() {
  if (!reviewNotes.value.trim()) {
    toast({
      title: '请填写驳回原因',
      variant: 'destructive',
    })
    return
  }

  emit('reject', reviewNotes.value)
}

// 智能选择功能
function selectTheirs() {
  let result = mergedContent.value

  // 匹配并替换所有冲突块为提交者的版本
  const conflictRegex = /<<<<<<< THEIRS \(提交者的修改\)\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> OURS \(当前线上版本\)/g
  result = result.replace(conflictRegex, (_match, theirsContent) => {
    return theirsContent.trim()
  })

  mergedContent.value = result
  toast({
    title: '已选择提交者版本',
    description: '所有冲突已自动解决为提交者的内容',
  })
}

function selectOurs() {
  let result = mergedContent.value

  // 匹配并替换所有冲突块为当前版本
  const conflictRegex = /<<<<<<< THEIRS \(提交者的修改\)\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> OURS \(当前线上版本\)/g
  result = result.replace(conflictRegex, (_match, _theirsContent, oursContent) => {
    return oursContent.trim()
  })

  mergedContent.value = result
  toast({
    title: '已选择当前版本',
    description: '所有冲突已自动解决为当前版本的内容',
  })
}

// 切换预览显示
function togglePreview() {
  showPreview.value = !showPreview.value
}
</script>

<template>
  <div class="space-y-4">
    <!-- 简化的顶部状态 -->
    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-red-500" />
          <span class="font-medium text-sm">
            {{ conflictCount }} 处冲突待解决
          </span>
        </div>
        <div class="text-xs text-gray-600">
          {{ conflictData.submitter_name || '提交者' }} 的修改 vs 当前版本 v{{ conflictData.our_version_number || '?' }}
        </div>
      </div>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          @click="togglePreview"
        >
          {{ showPreview ? '隐藏对比' : '查看对比' }}
        </Button>
      </div>
    </div>

    <!-- 可折叠的对比视图 -->
    <div v-if="showPreview" class="space-y-3">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <!-- 提交者版本 -->
        <ComparisonPanel
          :old-content="conflictData.base_content"
          :new-content="conflictData.their_content"
          old-label="Base"
          new-label="提交版本"
          height="400px"
        />

        <!-- 当前版本 -->
        <ComparisonPanel
          :old-content="conflictData.base_content"
          :new-content="conflictData.our_content"
          old-label="Base"
          new-label="当前版本"
          height="400px"
        />
      </div>
    </div>

    <!-- 简化的合并结果编辑区 -->
    <Card>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <GitMerge class="h-4 w-4" />
            <span class="font-medium">合并结果</span>
            <Badge v-if="!conflictResolved" variant="destructive" class="text-xs">
              {{ conflictCount }} 处冲突
            </Badge>
            <Badge v-else variant="default" class="text-xs bg-green-500">
              已解决
            </Badge>
          </div>

          <div class="flex items-center gap-2">
            <!-- 快速选择按钮（任何模式都显示） -->
            <div v-if="canReview && !isReadOnly && !conflictResolved" class="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                @click="selectTheirs"
              >
                全选提交者版本
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                @click="selectOurs"
              >
                全选当前版本
              </Button>
            </div>

            <!-- 编辑模式切换 -->
            <ToggleGroup v-if="canReview && !isReadOnly" type="single" :model-value="editorMode" @update:model-value="toggleEditorMode">
              <ToggleGroupItem value="wysiwyg" class="text-xs">
                <Eye class="h-3 w-3 mr-1" />
                富文本
              </ToggleGroupItem>
              <ToggleGroupItem value="source" class="text-xs">
                <Code class="h-3 w-3 mr-1" />
                源码
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </template>

      <!-- 富文本模式（默认，用于可视化查看和编辑） -->
      <div v-if="editorMode === 'wysiwyg'" class="relative">
        <ContentEditor
          v-model="mergedContent"
          :readonly="!canReview || isReadOnly"
          :show-toolbar="canReview && !isReadOnly"
          min-height="400px"
          placeholder="在富文本编辑器中查看和编辑合并内容..."
        />
      </div>

      <!-- 源码模式（用于高级调试） -->
      <div v-else class="relative">
        <Textarea
          v-model="mergedContent"
          :readonly="!canReview || isReadOnly"
          class="min-h-[400px] font-mono text-xs border-0 rounded-none resize-none focus-visible:ring-0"
          placeholder="HTML 源码模式（高级用户）..."
        />
      </div>

      <!-- 简化的帮助提示 -->
      <div class="border-t border-border bg-gray-50 p-3">
        <p v-if="canReview && !isReadOnly && !conflictResolved" class="text-xs text-gray-600">
          💡 <strong>解决冲突：</strong>使用上方"全选"按钮快速选择一方版本，或在编辑器中手动编辑并删除冲突标记
        </p>
        <p v-else-if="canReview && !isReadOnly && conflictResolved" class="text-xs text-gray-600">
          ✅ 所有冲突已解决！可继续编辑内容，完成后点击下方"确认合并"
        </p>
        <p v-else class="text-xs text-gray-600">
          当前为只读模式
        </p>
      </div>
    </Card>

    <!-- 审核备注区域 -->
    <div v-if="canReview && !isReadOnly" class="space-y-4 pt-4 border-t">
      <Card>
        <template #header>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">审核备注</span>
            <Badge variant="outline" class="text-xs">
              驳回时必填，合并时可选
            </Badge>
          </div>
        </template>
        <Textarea
          v-model="reviewNotes"
          placeholder="请填写审核备注（驳回时必须填写原因）"
          class="min-h-[80px] text-sm"
        />
      </Card>

      <!-- 操作按钮 -->
      <div class="flex justify-between">
        <Button
          variant="destructive"
          @click="handleReject"
        >
          <XCircle class="h-4 w-4 mr-1" />
          驳回
        </Button>
        <Button
          variant="default"
          :disabled="!conflictResolved"
          @click="handleManualResolve"
        >
          <GitMerge class="h-4 w-4 mr-1" />
          确认合并
        </Button>
      </div>
    </div>
  </div>
</template>
