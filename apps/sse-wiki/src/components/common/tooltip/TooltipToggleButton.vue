<script setup lang="ts">
import type { Component } from 'vue'
import { ToggleGroupItem, Tooltip, TooltipContent, TooltipTrigger } from '@sse-wiki/ui'

interface Props {
  icon: Component
  tooltip: string
  value: string
  pressed?: boolean
}

withDefaults(defineProps<Props>(), {
  pressed: false,
})

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <ToggleGroupItem
        :value="value"
        :pressed="pressed"
        @click="emit('click', $event)"
      >
        <component :is="icon" class="h-4 w-4" />
      </ToggleGroupItem>
    </TooltipTrigger>
    <TooltipContent>
      {{ tooltip }}
    </TooltipContent>
  </Tooltip>
</template>
