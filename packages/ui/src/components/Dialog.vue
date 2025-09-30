<script setup lang="ts">
import { watchEffect } from 'vue'

interface Props {
  open?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

function handleOverlayClick(event: MouseEvent) {
  // Only close if clicking the overlay itself, not its children
  if (event.target === event.currentTarget) {
    emit('update:open', false)
  }
}

// Prevent body scroll when dialog is open
watchEffect(() => {
  if (props.open) {
    document.body.style.overflow = 'hidden'
  }
  else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="dialog-overlay" @click="handleOverlayClick">
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div v-if="open" class="dialog-content" @click.stop>
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  @apply fixed inset-0 z-50 bg-background/80 backdrop-blur-sm;
  @apply flex items-center justify-center p-4;
}

.dialog-content {
  @apply relative bg-background border rounded-lg shadow-lg;
  @apply w-full max-w-lg p-6;
}
</style>
