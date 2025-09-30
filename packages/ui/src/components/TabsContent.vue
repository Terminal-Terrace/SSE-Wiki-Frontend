<script setup lang="ts">
import type { Ref } from 'vue'
import { computed, inject } from 'vue'
import { cn } from '../lib/utils'

interface Props {
  value: string
}

const props = defineProps<Props>()

const activeTab = inject<Ref<string>>('activeTab')

const isActive = computed(() => {
  return activeTab?.value === props.value
})

const contentClass = computed(() => {
  return cn(
    'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  )
})
</script>

<template>
  <div v-if="isActive" :class="contentClass">
    <slot />
  </div>
</template>
