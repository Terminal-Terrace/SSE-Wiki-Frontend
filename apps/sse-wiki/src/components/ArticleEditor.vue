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
  <div class="border rounded-lg overflow-hidden">
    <EditorContent :editor="editor" class="editor-content prose max-w-none p-4 min-h-[500px] focus:outline-none" />
  </div>
</template>

<style scoped>
.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 500px;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
