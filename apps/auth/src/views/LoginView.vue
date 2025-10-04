<script setup lang="ts">
import { Button } from '@sse-wiki/ui'
import { onMounted, reactive } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { useAuth } from '../composables/useAuth'

interface Props {
  state?: string
  redirect?: string
}

const props = defineProps<Props>()
const route = useRoute()
const { login, loading, error } = useAuth()

const form = reactive({
  username: '',
  password: '',
})

async function handleSubmit() {
  // 从 props 或 URL 查询参数获取 state
  const state = props.state || route.query.state as string

  if (!state) {
    console.error('Missing state parameter')
    return
  }

  // 将 state 存储到 sessionStorage 供 useAuth 使用
  sessionStorage.setItem('auth_state', state)

  // 存储重定向 URL
  const redirectUrl = props.redirect || route.query.redirect as string
  if (redirectUrl) {
    sessionStorage.setItem('redirect_url', decodeURIComponent(redirectUrl))
  }

  await login(form.username, form.password)
}

// 初始化时处理 GitHub 登录回调
onMounted(() => {
  const code = route.query.code as string
  if (code) {
    // 处理 GitHub 登录回调
    console.log('GitHub code:', code)
    // TODO: 实现 GitHub 登录逻辑
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          SSE-Wiki 登录
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          登录到您的知识空间
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              用户名
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              placeholder="请输入用户名"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              :disabled="loading"
            >
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              placeholder="请输入密码"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              :disabled="loading"
            >
          </div>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">
            {{ error }}
          </p>
        </div>

        <Button
          type="submit"
          :disabled="loading"
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? '登录中...' : '登录' }}
        </Button>
      </form>

      <div class="text-center">
        <span class="text-sm text-gray-600">还没有账号？</span>
        <RouterLink to="/register" class="ml-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
          立即注册
        </RouterLink>
      </div>
    </div>
  </div>
</template>
