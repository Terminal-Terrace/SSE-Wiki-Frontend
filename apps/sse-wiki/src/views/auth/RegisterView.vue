<script setup lang="ts">
import { reactive } from 'vue'
import { RouterLink } from 'vue-router'

const formState = reactive({
  teamName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

function handleSubmit() {
  if (formState.password !== formState.confirmPassword) {
    alert('两次输入的密码不一致，请重新检查。')
    return
  }
  console.info('register submit', { ...formState })
}
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-2 text-center">
      <h1 class="text-2xl font-semibold text-foreground">
        创建新团队
      </h1>
      <p class="text-sm text-muted-foreground">
        快速搭建团队空间，邀请成员共同维护知识资产。
      </p>
    </header>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <div class="space-y-2">
        <label for="teamName" class="text-sm font-medium text-foreground">团队名称</label>
        <input
          id="teamName"
          v-model="formState.teamName"
          type="text"
          class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="例如：产品研发部"
          required
        >
      </div>

      <div class="space-y-2">
        <label for="email" class="text-sm font-medium text-foreground">工作邮箱</label>
        <input
          id="email"
          v-model="formState.email"
          type="email"
          class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="name@example.com"
          required
        >
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <label for="password" class="text-sm font-medium text-foreground">密码</label>
          <input
            id="password"
            v-model="formState.password"
            type="password"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="至少 8 位字符"
            required
          >
        </div>
        <div class="space-y-2">
          <label for="confirmPassword" class="text-sm font-medium text-foreground">确认密码</label>
          <input
            id="confirmPassword"
            v-model="formState.confirmPassword"
            type="password"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="再次输入密码"
            required
          >
        </div>
      </div>

      <button
        type="submit"
        class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        创建账号
      </button>
    </form>

    <p class="text-center text-sm text-muted-foreground">
      已有账号？
      <RouterLink :to="{ name: 'login' }" class="font-medium text-primary hover:underline">
        立即登录
      </RouterLink>
    </p>
  </div>
</template>
