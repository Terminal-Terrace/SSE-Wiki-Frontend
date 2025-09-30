<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../lib/utils'

const cardClass = computed(() => {
  return cn(
    'rounded-lg border bg-card text-card-foreground shadow-sm',
  )
})
</script>

<template>
  <div :class="cardClass">
    <slot />
  </div>
</template>
