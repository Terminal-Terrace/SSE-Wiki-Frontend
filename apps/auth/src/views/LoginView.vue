<script setup lang="ts">
import { Button } from '@sse-wiki/ui'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import TextAnime from '@/components/TextAnime.vue'

import WheelAnime from '@/components/WheelAnime.vue'
import { useAuth } from '../composables/useAuth'

const props = defineProps<Props>()

const showAnime = ref(true)

function toggleAnime() {
  showAnime.value = !showAnime.value
}

function checkWindowSize() {
  if (window.innerWidth < 1024) {
    showAnime.value = false
  }
  else {
    showAnime.value = true
  }
}

interface Props {
  state?: string
  redirect?: string
}

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
  checkWindowSize()
  window.addEventListener('resize', checkWindowSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkWindowSize)
})
</script>

<template>
  <div class="relative flex justify-center bg-gray-50 min-h-screen">
    <button
      class="absolute top-4 right-4 z-10 rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      @click="toggleAnime"
    >
      <svg
        v-if="showAnime"
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.28-3.28m7.532 7.532l3.28 3.28M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
        />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    </button>
    <TextAnime v-if="showAnime" maxwidth="25%" />
    <div
      class="flex items-center justify-center bg-gray-50 py-12 px-4"
      :class="showAnime ? 'w-1/2' : 'w-full'"
    >
      <div class="space-y-8 w-full max-w-md">
        <div class="text-center">
          <h2 class="text-3xl font-bold">
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
                class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
                class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
            class="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ loading ? '登录中...' : '登录' }}
          </Button>
        </form>
        <div class="h-1 bg-gray-200" />
        <div class="text-center">
          <span class="text-sm text-gray-600">还没有账号？</span>
          <RouterLink to="/register" class="ml-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            立即注册
          </RouterLink>
          /
          <RouterLink to="/register" class="ml-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            使用软工集市账号登录
          </RouterLink>
        </div>
      </div>
    </div>
    <WheelAnime v-if="showAnime" maxwidth="25%" />
  </div>
</template>
