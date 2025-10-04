<script setup lang="ts">
import { useAuth } from '../../composables/useAuth'

const { isAuthenticated, user } = useAuth()
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight text-foreground">
        主页
      </h1>
      <p class="text-muted-foreground">
        欢迎来到 SSE-Wiki 知识空间
      </p>
    </header>

    <!-- 认证状态显示 -->
    <div class="rounded-lg border bg-card p-6">
      <h2 class="text-xl font-semibold mb-4">
        认证状态
      </h2>
      <div v-if="isAuthenticated" class="space-y-2">
        <p class="text-green-600">
          ✅ 已登录
        </p>
        <p v-if="user" class="text-sm text-muted-foreground">
          用户: {{ user.username }}
        </p>
      </div>
      <div v-else>
        <p class="text-yellow-600">
          ⚠️ 未登录
        </p>
        <p class="text-sm text-muted-foreground">
          点击右上角的登录按钮开始使用
        </p>
      </div>
    </div>
  </section>
</template>
