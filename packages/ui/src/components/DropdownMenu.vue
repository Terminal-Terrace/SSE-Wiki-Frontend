<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const isOpen = ref(false)
const dropdown = ref<HTMLElement>()

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (dropdown.value && !dropdown.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="dropdown" class="relative inline-block text-left">
    <div @click="toggleDropdown">
      <slot name="trigger" />
    </div>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-show="isOpen"
        class="dropdown-content"
        @click.stop
      >
        <slot name="content" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-content {
  @apply absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-background border shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none;
}
</style>
