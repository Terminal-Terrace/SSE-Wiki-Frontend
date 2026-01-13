<script setup lang="ts">
import { Badge } from '@sse-wiki/ui'
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-2">
      <div class="flex items-center gap-2">
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">
          知识空间
        </h1>
        <Badge variant="secondary" class="text-xs">
          开发中
        </Badge>
      </div>
      <p class="text-muted-foreground">
        集中管理项目文档、知识库与页面的空间，支持权限与协作。
      </p>
    </header>
    <div class="rounded-lg border border-border bg-card p-6 shadow-sm">
      <p class="text-sm text-muted-foreground">
        这里将展示知识空间的仪表盘、最近更新以及快速入口。当前为占位内容，后续可接入真实数据。
      </p>
    </div>
  </section>
</template>
