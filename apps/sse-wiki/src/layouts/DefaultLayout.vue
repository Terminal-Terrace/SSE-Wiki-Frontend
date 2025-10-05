<script setup lang="ts">
import { SidebarProvider, SidebarTrigger, Toaster } from '@sse-wiki/ui'
import { RouterView } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Sidebar from '@/components/Sidebar.vue'
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <Navbar />
    <div class="flex-1 overflow-hidden">
      <SidebarProvider>
        <Sidebar />
        <main class="flex flex-1 overflow-auto">
          <SidebarTrigger class="ml-2 mt-5" />
          <RouterView class="p-6" />
        </main>
      </SidebarProvider>
    </div>
    <!-- Toast 通知组件 -->
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
