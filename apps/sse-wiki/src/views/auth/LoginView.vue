<script setup lang="ts">
import { reactive } from 'vue'
import { RouterLink } from 'vue-router'

const formState = reactive({
  email: '',
  password: '',
  remember: false,
})

function handleSubmit() {
  console.info('login submit', { ...formState })
}
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2 text-center">
      <h1 class="text-2xl font-semibold text-foreground">
        欢迎回来
      </h1>
      <p class="text-sm text-muted-foreground">
        使用账号登录，继续构建你的智能知识空间。
      </p>
    </header>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div class="space-y-2">
        <label for="email" class="text-sm font-medium text-foreground">邮箱</label>
        <input
          id="email"
          v-model="formState.email"
          type="email"
          class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="name@example.com"
          required
        >
      </div>

      <div class="space-y-2">
        <label for="password" class="text-sm font-medium text-foreground">密码</label>
        <input
          id="password"
          v-model="formState.password"
          type="password"
          class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="请输入密码"
          required
        >
      </div>

      <div class="flex items-center justify-between text-sm">
        <label class="inline-flex items-center gap-2 text-muted-foreground">
          <input
            v-model="formState.remember"
            type="checkbox"
            class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          >
          记住登录状态
        </label>
        <RouterLink to="{ name: 'reset' }" class="text-primary hover:underline">
          忘记密码？
        </RouterLink>
      </div>

      <button
        type="submit"
        class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        登录
      </button>
    </form>

    <p class="text-center text-sm text-muted-foreground">
      还没有账号？
      <RouterLink :to="{ name: 'register' }" class="font-medium text-primary hover:underline">
        立即注册
      </RouterLink>
    </p>
  </div>
</template>
