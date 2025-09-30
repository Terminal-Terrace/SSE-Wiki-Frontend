<script setup lang="ts">
defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    class="dropdown-menu-item"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
.dropdown-menu-item {
  @apply flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none;
}
</style>
