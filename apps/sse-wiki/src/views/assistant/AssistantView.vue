<script setup lang="ts">
import { Badge } from '@sse-wiki/ui'
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-2">
      <div class="flex items-center gap-2">
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">
          AI 助手
        </h1>
        <Badge variant="secondary" class="text-xs">
          开发中
        </Badge>
      </div>
      <p class="text-muted-foreground">
        配置和体验智能助手，为知识空间提供自动化问答与写作能力。
      </p>
    </header>
    <div class="rounded-lg border border-border bg-card p-6 shadow-sm">
      <p class="text-sm text-muted-foreground">
        后续可以在这里接入会话历史、模型配置以及团队共用的提示词管理功能。本页面暂为初始化占位。
      </p>
    </div>
  </section>
</template>
