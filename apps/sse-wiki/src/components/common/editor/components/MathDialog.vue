<script setup lang="ts">
/**
 * LaTeX 公式输入对话框组件
 */
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@sse-wiki/ui'
import { ref, watch } from 'vue'

interface Props {
  open: boolean
  initialFormula?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialFormula: '',
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  'confirm': [formula: string]
}>()

const formula = ref(props.initialFormula || '')

watch(() => props.open, (newOpen) => {
  if (newOpen) {
    formula.value = props.initialFormula || ''
  }
})

watch(() => props.initialFormula, (newFormula) => {
  if (props.open) {
    formula.value = newFormula || ''
  }
})

function handleConfirm() {
  if (formula.value.trim()) {
    emit('confirm', formula.value.trim())
    emit('update:open', false)
    formula.value = ''
  }
}

function handleCancel() {
  emit('update:open', false)
  formula.value = ''
}

function handleOpenChange(open: boolean) {
  emit('update:open', open)
  if (!open) {
    formula.value = ''
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>插入 LaTeX 公式</DialogTitle>
        <DialogDescription>
          输入 LaTeX 公式代码
          <br>
          <span class="text-xs">行内公式: $E = mc^2$</span>
          <br>
          <span class="text-xs">块级公式: $$\\frac{a}{b}$$</span>
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="formula">LaTeX 公式</Label>
          <Textarea
            id="formula"
            v-model="formula"
            placeholder="E = mc^2"
            class="font-mono text-sm"
            rows="4"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          取消
        </Button>
        <Button :disabled="!formula.trim()" @click="handleConfirm">
          确认
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
