<script setup lang="ts">
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { watch } from 'vue'

interface Props {
  modelValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue || '<p>开始编写内容...</p>',
  extensions: [StarterKit],
  onUpdate: () => {
    if (editor.value) {
      const html = editor.value.getHTML()
      emit('update:modelValue', html)
    }
  },
})

// 监听外部 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue || '<p>开始编写内容...</p>')
  }
})
</script>

<template>
  <div class="article-editor border rounded-lg">
    <EditorContent :editor="editor" class="editor-content prose max-w-none p-4 min-h-[40vh] focus:outline-none" />
  </div>
</template>

<style scoped lang="scss">
/* Keep existing ProseMirror focus/min-height rules */
.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 300px;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Editor-only typographic rules moved here so they don't apply globally.
   Scoped under `.article-editor` so Tailwind @apply utilities are used
   only inside the editor content. */
.article-editor :deep(h1) {
  @apply text-3xl font-bold leading-tight mb-3;
}
.article-editor :deep(h2) {
  @apply text-2xl font-semibold leading-snug mb-2.5;
}
.article-editor :deep(h3) {
  @apply text-xl font-semibold mb-2;
}
.article-editor :deep(h4) {
  @apply text-lg font-medium mb-1.5;
}
.article-editor :deep(h5) {
  @apply text-base font-medium mb-1;
}
.article-editor :deep(h6) {
  @apply text-sm font-medium mb-1;
}

.article-editor :deep(ul),
.article-editor :deep(ol) {
  @apply pl-6 mb-4;
}

.article-editor :deep(ul) {
  list-style-type: disc;
}

.article-editor :deep(ol) {
  list-style-type: decimal;
}

.article-editor :deep(li) {
  margin-bottom: 0.4rem;
}
</style>
