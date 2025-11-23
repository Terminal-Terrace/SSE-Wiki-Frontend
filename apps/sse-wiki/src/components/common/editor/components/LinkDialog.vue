<script setup lang="ts">
/**
 * 链接输入对话框组件
 */
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@sse-wiki/ui'
import { ref, watch } from 'vue'

interface Props {
  open: boolean
  initialUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialUrl: '',
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  'confirm': [url: string]
}>()

const url = ref(props.initialUrl || '')

watch(() => props.open, (newOpen) => {
  if (newOpen) {
    url.value = props.initialUrl || ''
  }
})

watch(() => props.initialUrl, (newUrl) => {
  if (props.open) {
    url.value = newUrl || ''
  }
})

function handleConfirm() {
  if (url.value.trim()) {
    emit('confirm', url.value.trim())
    emit('update:open', false)
    url.value = ''
  }
}

function handleCancel() {
  emit('update:open', false)
  url.value = ''
}

function handleOpenChange(open: boolean) {
  emit('update:open', open)
  if (!open) {
    url.value = ''
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>插入链接</DialogTitle>
        <DialogDescription>
          请输入链接地址
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="url">链接地址</Label>
          <Input
            id="url"
            v-model="url"
            placeholder="https://example.com"
            @keydown.enter="handleConfirm"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          取消
        </Button>
        <Button :disabled="!url.trim()" @click="handleConfirm">
          确认
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
