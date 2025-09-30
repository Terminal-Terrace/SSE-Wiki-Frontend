<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { cn } from '../lib/utils'

interface Tab {
  label: string
  value: string
}

interface Props {
  tabs: Tab[]
  defaultValue?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  tabChange: [value: string]
}>()

const activeTab = ref(props.defaultValue || props.tabs[0]?.value)

// 监听 defaultValue 的变化
watch(() => props.defaultValue, (newValue) => {
  if (newValue) {
    activeTab.value = newValue
  }
}, { immediate: true })

function selectTab(value: string) {
  activeTab.value = value
  emit('tabChange', value)
}

provide('activeTab', activeTab)

const tabsListClass = computed(() => {
  return cn(
    'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
  )
})

function getTabTriggerClass(value: string) {
  const isActive = activeTab.value === value
  return cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    isActive
      ? 'bg-background text-foreground shadow-sm'
      : 'hover:bg-background/50',
  )
}
</script>

<template>
  <div class="tabs">
    <div :class="tabsListClass">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="getTabTriggerClass(tab.value)"
        @click="selectTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tabs-content">
      <slot />
    </div>
  </div>
</template>
