<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/core'
import { NodeViewWrapper } from '@tiptap/vue-3'
import katex from 'katex'
import { nextTick, onMounted, ref, watch } from 'vue'
import 'katex/dist/katex.min.css'

const props = defineProps<NodeViewProps>()

const formula = ref(props.node.attrs.formula || '')
const mathElement = ref<HTMLElement | null>(null)

watch(() => props.node.attrs.formula, (newFormula) => {
  formula.value = newFormula || ''
  nextTick(() => {
    renderFormula()
  })
})

onMounted(() => {
  renderFormula()
})

function renderFormula() {
  if (!mathElement.value || !formula.value)
    return

  try {
    katex.render(formula.value, mathElement.value, {
      throwOnError: false,
      displayMode: true,
    })
  }
  catch (error) {
    console.error('KaTeX 渲染错误:', error)
    mathElement.value.textContent = `$$${formula.value}$$`
  }
}
</script>

<template>
  <NodeViewWrapper class="math-block-wrapper my-4 py-3 px-4 rounded-md bg-muted/30 border border-dashed border-muted-foreground/20">
    <div
      ref="mathElement"
      class="math-content text-center text-lg font-math"
    />
  </NodeViewWrapper>
</template>

<style scoped>
.math-block-wrapper {
  display: block;
}

.math-content {
  min-height: 1.5em;
  overflow-x: auto;
}
</style>
