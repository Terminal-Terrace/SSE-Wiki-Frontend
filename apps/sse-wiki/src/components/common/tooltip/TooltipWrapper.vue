<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@sse-wiki/ui'
import { useSlots } from 'vue'

interface Props {
  tooltip?: string
  asChild?: boolean
  side?: 'top' | 'right' | 'bottom' | 'left'
}

const props = withDefaults(defineProps<Props>(), {
  tooltip: '',
  asChild: true,
  side: 'bottom',
})

const slots = useSlots()
const hasTooltip = props.tooltip || slots.tooltip
</script>

<template>
  <TooltipProvider v-if="hasTooltip">
    <Tooltip>
      <TooltipTrigger :as-child="asChild">
        <slot />
      </TooltipTrigger>
      <TooltipContent :side="side">
        <!-- 支持自定义 tooltip 内容 -->
        <slot name="tooltip">
          <div v-html="tooltip" />
        </slot>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
  <slot v-else />
</template>
