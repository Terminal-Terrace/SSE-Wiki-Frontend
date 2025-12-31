<script setup lang="ts">
/**
 * 编辑器工具栏组件
 */
import type { Editor } from '@tiptap/vue-3'
import { Separator, ToggleGroup } from '@sse-wiki/ui'
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
  Upload,
} from 'lucide-vue-next'
import { computed } from 'vue'
import TooltipButton from './tooltip/TooltipButton.vue'
import TooltipToggleButton from './tooltip/TooltipToggleButton.vue'

const props = withDefaults(defineProps<{
  editor: Editor | undefined
  showUpload?: boolean
}>(), {
  showUpload: true,
})

const emit = defineEmits<{
  uploadClick: []
}>()

const canUndo = computed(() => props.editor?.can().undo() ?? false)
const canRedo = computed(() => props.editor?.can().redo() ?? false)

function isActive(name: string, attrs?: Record<string, any>) {
  return props.editor?.isActive(name, attrs) ?? false
}

function run(fn: () => void) {
  props.editor?.chain().focus()
  fn()
}

function insertLink() {
  const url = window.prompt('输入链接:')
  if (url) {
    props.editor?.chain().focus().setLink({ href: url }).run()
  }
}
</script>

<template>
  <div class="toolbar border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center">
    <div class="flex gap-1">
      <TooltipButton :icon="Undo" tooltip="撤销" :disabled="!canUndo" @click="run(() => editor?.chain().undo().run())" />
      <TooltipButton :icon="Redo" tooltip="重做" :disabled="!canRedo" @click="run(() => editor?.chain().redo().run())" />
    </div>

    <Separator orientation="vertical" class="h-6" />

    <ToggleGroup type="single" class="flex gap-1">
      <TooltipToggleButton :icon="Heading1" value="h1" tooltip="一级标题" :pressed="isActive('heading', { level: 1 })" @click="run(() => editor?.chain().toggleHeading({ level: 1 }).run())" />
      <TooltipToggleButton :icon="Heading2" value="h2" tooltip="二级标题" :pressed="isActive('heading', { level: 2 })" @click="run(() => editor?.chain().toggleHeading({ level: 2 }).run())" />
      <TooltipToggleButton :icon="Heading3" value="h3" tooltip="三级标题" :pressed="isActive('heading', { level: 3 })" @click="run(() => editor?.chain().toggleHeading({ level: 3 }).run())" />
    </ToggleGroup>

    <Separator orientation="vertical" class="h-6" />

    <ToggleGroup type="multiple" class="flex gap-1">
      <TooltipToggleButton :icon="Bold" value="bold" tooltip="加粗" :pressed="isActive('bold')" @click="run(() => editor?.chain().toggleBold().run())" />
      <TooltipToggleButton :icon="Italic" value="italic" tooltip="斜体" :pressed="isActive('italic')" @click="run(() => editor?.chain().toggleItalic().run())" />
      <TooltipToggleButton :icon="Strikethrough" value="strike" tooltip="删除线" :pressed="isActive('strike')" @click="run(() => editor?.chain().toggleStrike().run())" />
      <TooltipToggleButton :icon="Code" value="code" tooltip="行内代码" :pressed="isActive('code')" @click="run(() => editor?.chain().toggleCode().run())" />
    </ToggleGroup>

    <Separator orientation="vertical" class="h-6" />

    <ToggleGroup type="multiple" class="flex gap-1">
      <TooltipToggleButton :icon="List" value="bulletList" tooltip="无序列表" :pressed="isActive('bulletList')" @click="run(() => editor?.chain().toggleBulletList().run())" />
      <TooltipToggleButton :icon="ListOrdered" value="orderedList" tooltip="有序列表" :pressed="isActive('orderedList')" @click="run(() => editor?.chain().toggleOrderedList().run())" />
      <TooltipToggleButton :icon="Quote" value="blockquote" tooltip="引用块" :pressed="isActive('blockquote')" @click="run(() => editor?.chain().toggleBlockquote().run())" />
      <TooltipToggleButton :icon="Code2" value="codeBlock" tooltip="代码块" :pressed="isActive('codeBlock')" @click="run(() => editor?.chain().toggleCodeBlock().run())" />
    </ToggleGroup>

    <Separator orientation="vertical" class="h-6" />

    <TooltipButton :icon="LinkIcon" tooltip="插入链接" :active="isActive('link')" @click="insertLink" />

    <Separator v-if="showUpload" orientation="vertical" class="h-6" />

    <TooltipButton v-if="showUpload" :icon="Upload" tooltip="上传文件" @click="emit('uploadClick')" />
  </div>
</template>

<style scoped>
.toolbar {
  flex-shrink: 0;
}
</style>
