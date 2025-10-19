<script setup lang="ts">
import { Button, ToggleGroup, ToggleGroupItem } from '@sse-wiki/ui'
/**
 * 图片卡片组件
 * 用于在编辑器中显示图片文件
 */
import { NodeViewWrapper } from '@tiptap/vue-3'
import { AlignCenter, AlignLeft, AlignRight, Download, Eye, GripHorizontal, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = defineProps<{
  node: {
    attrs: {
      fileId: string
      fileName: string
      fileSize: number
      fileType: string
      fileUrl: string
      category: string
      width?: number
      height?: number
      align?: 'left' | 'center' | 'right'
    }
  }
  selected: boolean
  updateAttributes?: (attrs: any) => void
  editor?: any
  getPos?: () => number
}>()

const showPreview = ref(false)
const imageLoaded = ref(false)
const isResizing = ref(false)
const imageRef = ref<HTMLImageElement>()
const containerRef = ref<HTMLDivElement>()

// 图片尺寸
const imageWidth = ref(props.node.attrs.width || 0)
const imageHeight = ref(props.node.attrs.height || 0)

// 对齐方式
const currentAlign = ref(props.node.attrs.align || 'left')

// 计算实际显示尺寸
const displayStyle = computed(() => {
  if (imageWidth.value && imageHeight.value) {
    return {
      width: `${imageWidth.value}px`,
      height: `${imageHeight.value}px`,
    }
  }
  return {
    maxWidth: '100%',
    height: 'auto',
  }
})

// 计算外层容器对齐样式
const wrapperClass = computed(() => {
  const align = currentAlign.value
  if (align === 'center') {
    return 'flex justify-center'
  }
  else if (align === 'right') {
    return 'flex justify-end'
  }
  return 'flex justify-start' // left 是默认的
})

// 图片加载完成，记录原始尺寸
function handleImageLoad(event: Event) {
  imageLoaded.value = true
  const img = event.target as HTMLImageElement

  // 如果没有设置尺寸，使用图片原始尺寸（但不超过容器宽度）
  if (!imageWidth.value) {
    const maxWidth = containerRef.value?.clientWidth || 800
    const naturalWidth = img.naturalWidth
    const naturalHeight = img.naturalHeight

    if (naturalWidth > maxWidth) {
      imageWidth.value = maxWidth
      imageHeight.value = (maxWidth / naturalWidth) * naturalHeight
    }
    else {
      imageWidth.value = naturalWidth
      imageHeight.value = naturalHeight
    }
  }
}

// 更新节点属性的统一方法
function updateNodeAttributes(attrs: any) {
  if (props.updateAttributes) {
    props.updateAttributes(attrs)
  }
  else if (props.editor && typeof props.getPos === 'function') {
    // 使用 editor.commands 更新属性
    props.editor.commands.updateAttributes('fileCard', attrs)
  }
}

// 开始调整大小
function startResize(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()

  isResizing.value = true
  document.body.classList.add('resizing')

  const startX = event.clientX
  const startWidth = imageWidth.value
  const startHeight = imageHeight.value
  const aspectRatio = startWidth / startHeight

  function onMouseMove(e: MouseEvent) {
    e.preventDefault()
    const deltaX = e.clientX - startX
    const newWidth = Math.max(100, startWidth + deltaX)
    const newHeight = newWidth / aspectRatio

    imageWidth.value = Math.round(newWidth)
    imageHeight.value = Math.round(newHeight)
  }

  function onMouseUp() {
    isResizing.value = false
    document.body.classList.remove('resizing')
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)

    // 更新节点属性
    updateNodeAttributes({
      width: imageWidth.value,
      height: imageHeight.value,
    })
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 查看大图
function handlePreview(e: Event) {
  e.stopPropagation()
  showPreview.value = true
}

// 下载图片
// TODO: 后端接入 - 当前直接使用 fileUrl，实际应该调用下载 API
// 应改为: /api/v1/files/:id/download
function handleDownload(e: Event) {
  e.stopPropagation()
  const link = document.createElement('a')
  link.href = props.node.attrs.fileUrl // TODO: 后端接入 - 如果是 Base64，需要改为服务器 URL
  link.download = props.node.attrs.fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 关闭预览
function closePreview() {
  showPreview.value = false
}

// 更改对齐方式
function handleAlignChange(align: any) {
  if (typeof align === 'string' && (align === 'left' || align === 'center' || align === 'right')) {
    currentAlign.value = align as 'left' | 'center' | 'right'
    updateNodeAttributes({
      align: currentAlign.value,
    })
  }
}
</script>

<template>
  <NodeViewWrapper class="image-card-wrapper">
    <div class="my-4" :class="wrapperClass">
      <div
        ref="containerRef"
        class="image-card group relative inline-block"
        :class="{
          'ring-2 ring-primary rounded-lg': selected,
          'cursor-nwse-resize': isResizing,
        }"
      >
        <!-- 图片 -->
        <img
          ref="imageRef"
          :src="node.attrs.fileUrl"
          :alt="node.attrs.fileName"
          :style="displayStyle"
          class="rounded-lg border bg-muted object-contain"
          :class="{ 'pointer-events-none': isResizing }"
          @load="handleImageLoad"
        >

        <!-- 悬浮操作栏 -->
        <div
          v-if="imageLoaded && !isResizing"
          class="absolute top-2 left-2 right-2 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <!-- 对齐按钮 -->
          <ToggleGroup
            type="single"
            :model-value="currentAlign"
            class="bg-secondary/90 backdrop-blur-sm rounded-md shadow-lg"
            @update:model-value="handleAlignChange"
          >
            <ToggleGroupItem value="left" aria-label="左对齐" size="sm">
              <AlignLeft class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="居中" size="sm">
              <AlignCenter class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="右对齐" size="sm">
              <AlignRight class="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <!-- 功能按钮 -->
          <div class="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              class="shadow-lg"
              @click="handlePreview"
            >
              <Eye class="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              class="shadow-lg"
              @click="handleDownload"
            >
              <Download class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- 调整大小手柄 -->
        <div
          v-if="imageLoaded"
          class="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
          @mousedown="startResize"
        >
          <div class="absolute bottom-1 right-1 w-4 h-4 bg-primary rounded-sm shadow-lg flex items-center justify-center">
            <GripHorizontal class="h-3 w-3 text-primary-foreground rotate-45" />
          </div>
        </div>

        <!-- 文件名提示 -->
        <div class="text-sm text-muted-foreground mt-2 text-center">
          {{ node.attrs.fileName }}
        </div>
      </div>
    </div>

    <!-- 全屏预览弹窗 -->
    <Teleport to="body">
      <div
        v-if="showPreview"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        @click="closePreview"
      >
        <Button
          variant="ghost"
          size="icon"
          class="absolute top-4 right-4 text-white hover:bg-white/20"
          @click="closePreview"
        >
          <X class="h-6 w-6" />
        </Button>
        <img
          :src="node.attrs.fileUrl"
          :alt="node.attrs.fileName"
          class="max-w-[90vw] max-h-[90vh] object-contain"
          @click.stop
        >
      </div>
    </Teleport>
  </NodeViewWrapper>
</template>

<style scoped>
.image-card-wrapper {
  margin: 0;
}

.image-card {
  user-select: none;
}

.resize-handle {
  z-index: 10;
}

/* 调整大小时禁用文本选择 */
body.resizing,
body.resizing * {
  user-select: none !important;
  cursor: nwse-resize !important;
}
</style>
