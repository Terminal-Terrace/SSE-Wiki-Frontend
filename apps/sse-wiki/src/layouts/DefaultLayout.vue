<script setup lang="ts">
import { SidebarProvider, SidebarTrigger, Toaster } from '@sse-wiki/ui'
import { RouterView } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Sidebar from '@/components/Sidebar.vue'
</script>

<template>
  <div class="flex flex-col h-screen">
    <Navbar />

    <SidebarProvider class="flex flex-1 min-h-0">
      <Sidebar />

      <main class="flex flex-1 min-w-0">
        <SidebarTrigger class="ml-2 mt-5 flex-shrink-0" />
        <div class="flex-1 overflow-y-auto p-6">
          <RouterView />
        </div>
      </main>
    </SidebarProvider>

    <Toaster />
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
