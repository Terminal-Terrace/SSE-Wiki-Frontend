<script setup lang="ts">
import { Button } from '@sse-wiki/ui'
import { computed, ref, watch } from 'vue'
/**
 * 评论编辑器组件
 * 支持三种模式：新建评论、回复评论、编辑评论
 */
import ContentEditor from '@/components/common/editor/ContentEditor.vue'
import { CommentEditorMode } from '@/types/discussion'

interface Props {
  mode?: CommentEditorMode
  initialContent?: string
  placeholder?: string
  minHeight?: string
  loading?: boolean
  autoFocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: CommentEditorMode.CREATE,
  initialContent: '',
  placeholder: '写下你的评论...',
  minHeight: '120px',
  loading: false,
  autoFocus: false,
})

const emit = defineEmits<{
  submit: [content: string]
  cancel: []
}>()

// ========== 状态 ==========
const content = ref(props.initialContent)
const isSubmitting = ref(false)

// 监听初始内容变化（编辑模式）
watch(() => props.initialContent, (newValue) => {
  content.value = newValue
})

// ========== 计算属性 ==========
const isEmpty = computed(() => {
  const text = content.value.replace(/<[^>]*>/g, '').trim()
  return text.length === 0
})

const buttonText = computed(() => {
  switch (props.mode) {
    case 'create':
      return '发表评论'
    case 'reply':
      return '发表回复'
    case 'edit':
      return '保存修改'
    default:
      return '提交'
  }
})

const showCancel = computed(() => {
  return props.mode === 'reply' || props.mode === 'edit'
})

// ========== 方法 ==========
async function handleSubmit() {
  if (isEmpty.value || isSubmitting.value)
    return

  isSubmitting.value = true
  try {
    emit('submit', content.value)
    // 提交成功后清空内容（仅在创建和回复模式）
    if (props.mode !== 'edit') {
      content.value = ''
    }
  }
  finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  content.value = props.initialContent
  emit('cancel')
}
</script>

<template>
  <div class="comment-editor">
    <ContentEditor
      v-model="content"
      :placeholder="placeholder"
      :min-height="minHeight"
      max-height="400px"
      :auto-focus="autoFocus"
      :readonly="loading || isSubmitting"
    />

    <div class="mt-3 flex justify-end gap-2">
      <Button
        v-if="showCancel"
        variant="outline"
        :disabled="loading || isSubmitting"
        @click="handleCancel"
      >
        取消
      </Button>

      <Button
        :disabled="isEmpty || loading || isSubmitting"
        :loading="isSubmitting"
        @click="handleSubmit"
      >
        {{ buttonText }}
      </Button>
    </div>
  </div>
</template>

<style scoped>
.comment-editor {
  @apply w-full;
}
</style>
