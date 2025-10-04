<script setup lang="ts">
import { RouterView } from 'vue-router'

import MainNavigation from '@/components/navigation/MainNavigation.vue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <MainNavigation />

    <main class="mx-auto w-full max-w-6xl px-6 py-10">
      <RouterView />
    </main>
  </div>
</template>
