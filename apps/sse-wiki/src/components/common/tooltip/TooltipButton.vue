<script setup lang="ts">
import type { Component } from 'vue'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@sse-wiki/ui'
import { computed, useSlots } from 'vue'

interface Props {
  // Icon 相关
  icon?: Component

  // Tooltip 相关
  tooltip?: string
  side?: 'top' | 'right' | 'bottom' | 'left'

  // Button 相关
  disabled?: boolean
  variant?: 'default' | 'ghost' | 'outline' | 'destructive' | 'secondary' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tooltip: '',
  side: 'bottom',
  disabled: false,
  variant: 'ghost',
  size: 'sm',
  active: false,
})

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()
const slots = useSlots()
const hasContent = !!slots.default

const buttonClass = computed(() => ({
  'bg-muted': props.active,
}))
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <Button
        :variant="variant"
        :size="size"
        :disabled="disabled"
        :class="buttonClass"
        @click="emit('click', $event)"
      >
        <!-- 纯图标模式 -->
        <component :is="icon" v-if="icon && !hasContent" class="h-4 w-4" />

        <!-- 图标 + 文字模式 -->
        <template v-else-if="icon && hasContent">
          <component :is="icon" class="h-4 w-4" />
          <slot />
        </template>

        <!-- 纯文字模式 -->
        <slot v-else />
      </Button>
    </TooltipTrigger>
    <TooltipContent :side="side">
      <!-- 支持自定义内容插槽 -->
      <slot name="tooltip">
        {{ tooltip }}
      </slot>
    </TooltipContent>
  </Tooltip>
</template>
