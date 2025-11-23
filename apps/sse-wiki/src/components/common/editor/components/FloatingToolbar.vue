<script setup lang="ts">
/**
 * 浮动工具栏组件
 * 当选中文字时显示格式化选项
 */
import type { Editor } from '@tiptap/core'
import type { FloatingToolbarPosition } from '../types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
  ToggleGroup,
  TooltipProvider,
} from '@sse-wiki/ui'
import {
  Bold,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  Sigma,
  Strikethrough,
  Type,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { TooltipButton, TooltipToggleButton } from '@/components/common/tooltip'
import LinkDialog from './LinkDialog.vue'
import MathDialog from './MathDialog.vue'

interface Props {
  editor: Editor
  position: FloatingToolbarPosition
}

const props = defineProps<Props>()

function isActive(name: string, attrs?: Record<string, any>) {
  return props.editor?.isActive(name, attrs) ?? false
}

function toggleBold() {
  props.editor?.chain().focus().toggleBold().run()
}

function toggleItalic() {
  props.editor?.chain().focus().toggleItalic().run()
}

function toggleStrike() {
  props.editor?.chain().focus().toggleStrike().run()
}

function toggleCode() {
  props.editor?.chain().focus().toggleCode().run()
}

function setHeading(level: 1 | 2 | 3) {
  props.editor?.chain().focus().toggleHeading({ level }).run()
}

function setParagraph() {
  props.editor?.chain().focus().setParagraph().run()
}

const linkDialogOpen = ref(false)

function setLink() {
  linkDialogOpen.value = true
}

function handleLinkConfirm(url: string) {
  props.editor?.chain().focus().setLink({ href: url }).run()
}

const mathDialogOpen = ref(false)

function insertMath() {
  mathDialogOpen.value = true
}

function handleMathConfirm(formula: string) {
  // 如果编辑器支持数学公式扩展
  // 支持$$$$语法（块级公式）和$$语法（行内公式）
  const trimmedFormula = formula.trim()
  if (trimmedFormula.startsWith('$$') && trimmedFormula.endsWith('$$')) {
    // 块级公式：$$...$$
    const blockFormula = trimmedFormula.slice(2, -2).trim()
    ;(props.editor?.chain().focus() as any).insertMathBlock(blockFormula).run()
  }
  else if (trimmedFormula.startsWith('$') && trimmedFormula.endsWith('$')) {
    // 行内公式：$...$
    const inlineFormula = trimmedFormula.slice(1, -1).trim()
    ;(props.editor?.chain().focus() as any).insertMathInline(inlineFormula).run()
  }
  else {
    // 默认作为行内公式
    ;(props.editor?.chain().focus() as any).insertMathInline(trimmedFormula).run()
  }
}

// 获取当前标题级别
const currentHeadingLevel = computed(() => {
  if (isActive('heading', { level: 1 }))
    return 1
  if (isActive('heading', { level: 2 }))
    return 2
  if (isActive('heading', { level: 3 }))
    return 3
  return null
})

const headingLabel = computed(() => {
  if (currentHeadingLevel.value === 1)
    return 'H1'
  if (currentHeadingLevel.value === 2)
    return 'H2'
  if (currentHeadingLevel.value === 3)
    return 'H3'
  return '文本'
})

const toolbarStyle = computed(() => ({
  top: `${props.position.top}px`,
  left: `${props.position.left}px`,
}))
</script>

<template>
  <TooltipProvider>
    <div
      class="floating-toolbar fixed z-50 flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-lg"
      :style="toolbarStyle"
    >
      <!-- 标题下拉菜单 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            class="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            :class="{ 'bg-accent': currentHeadingLevel !== null }"
          >
            <component
              :is="currentHeadingLevel === 1 ? Heading1 : currentHeadingLevel === 2 ? Heading2 : currentHeadingLevel === 3 ? Heading3 : Type"
              class="h-4 w-4 shrink-0"
            />
            <span class="whitespace-nowrap">{{ headingLabel }}</span>
            <ChevronDown class="h-3 w-3 opacity-50 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-48">
          <DropdownMenuItem @click="setParagraph">
            <Type class="mr-2 h-4 w-4" />
            <span>文本</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="setHeading(1)">
            <Heading1 class="mr-2 h-4 w-4" />
            <span>一级标题</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="setHeading(2)">
            <Heading2 class="mr-2 h-4 w-4" />
            <span>二级标题</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="setHeading(3)">
            <Heading3 class="mr-2 h-4 w-4" />
            <span>三级标题</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" class="h-6" />

      <!-- 文本样式按钮 -->
      <ToggleGroup type="multiple" class="flex gap-0.5">
        <TooltipToggleButton
          :icon="Bold"
          value="bold"
          tooltip="加粗 (Ctrl+B)"
          :pressed="isActive('bold')"
          @click="toggleBold"
        />
        <TooltipToggleButton
          :icon="Strikethrough"
          value="strike"
          tooltip="删除线"
          :pressed="isActive('strike')"
          @click="toggleStrike"
        />
        <TooltipToggleButton
          :icon="Italic"
          value="italic"
          tooltip="斜体 (Ctrl+I)"
          :pressed="isActive('italic')"
          @click="toggleItalic"
        />
      </ToggleGroup>

      <Separator orientation="vertical" class="h-6" />

      <!-- 链接 -->
      <TooltipButton
        :icon="LinkIcon"
        tooltip="插入链接"
        :active="isActive('link')"
        @click="setLink"
      />
      <!-- 代码 -->
      <ToggleGroup type="multiple" class="flex gap-0.5">
        <TooltipToggleButton
          :icon="Code"
          value="code"
          tooltip="行内代码"
          :pressed="isActive('code')"
          @click="toggleCode"
        />
      </ToggleGroup>

      <Separator orientation="vertical" class="h-6" />

      <!-- LaTeX 公式 -->
      <TooltipButton
        :icon="Sigma"
        tooltip="插入 LaTeX 公式"
        @click="insertMath"
      />
    </div>

    <!-- 链接输入对话框 -->
    <LinkDialog
      :open="linkDialogOpen"
      @update:open="linkDialogOpen = $event"
      @confirm="handleLinkConfirm"
    />

    <!-- LaTeX 公式输入对话框 -->
    <MathDialog
      :open="mathDialogOpen"
      @update:open="mathDialogOpen = $event"
      @confirm="handleMathConfirm"
    />
  </TooltipProvider>
</template>

<style scoped>
.floating-toolbar {
  animation: slideUp 0.15s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
