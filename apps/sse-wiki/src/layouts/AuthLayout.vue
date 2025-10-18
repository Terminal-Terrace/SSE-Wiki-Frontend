<script setup lang="ts">
import { RouterView } from 'vue-router'

import Navbar from '@/components/layout/Navbar.vue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <Navbar />
    <main class="mx-auto flex w-full max-w-6xl justify-center px-6 py-16">
      <div class="w-full max-w-xl rounded-2xl border border-border bg-background/80 p-10 shadow-sm">
        <RouterView />
      </div>
    </main>
  </div>
</template>
