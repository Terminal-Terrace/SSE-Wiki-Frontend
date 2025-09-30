<script setup lang="ts">
// 纯展示组件，无需逻辑
</script>

<template>
  <div class="animate-pulse space-y-4">
    <!-- 标题骨架 -->
    <div class="space-y-3">
      <div class="h-8 bg-muted rounded-lg w-3/4" />
      <div class="h-4 bg-muted rounded w-1/2" />
    </div>

    <!-- 分隔线 -->
    <div class="h-px bg-muted" />

    <!-- Tab 骨架 -->
    <div class="flex space-x-2">
      <div class="h-10 bg-muted rounded-lg w-20" />
      <div class="h-10 bg-muted rounded-lg w-20" />
      <div class="h-10 bg-muted rounded-lg w-20" />
      <div class="h-10 bg-muted rounded-lg w-20" />
    </div>

    <!-- 内容骨架 -->
    <div class="space-y-3 pt-4">
      <div class="h-4 bg-muted rounded w-full" />
      <div class="h-4 bg-muted rounded w-5/6" />
      <div class="h-4 bg-muted rounded w-4/6" />
      <div class="h-6 bg-muted rounded w-3/4 mt-6" />
      <div class="h-4 bg-muted rounded w-full" />
      <div class="h-4 bg-muted rounded w-2/3" />
      <div class="h-4 bg-muted rounded w-5/6" />
      <div class="h-4 bg-muted rounded w-1/2" />
    </div>
  </div>
</template>
