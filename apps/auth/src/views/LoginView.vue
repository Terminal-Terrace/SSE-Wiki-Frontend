<script setup lang="ts">
import { Button, Card, CardContent, Input, Label } from '@sse-wiki/ui'
import { reactive } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import TextAnime from '@/components/TextAnime.vue'
import WheelAnime from '@/components/WheelAnime.vue'
import { useAuth } from '../composables/useAuth'

const props = defineProps<Props>()

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
</script>

<template>
  <div class="relative flex min-h-screen">
    <!-- 左侧动画 -->
    <div class="hidden lg:flex lg:w-1/4 transition-all duration-500">
      <TextAnime maxwidth="100%" />
    </div>

    <!-- 中间表单区域 -->
    <div class="flex items-center justify-center py-12 px-6 transition-all duration-500 bg-gradient-to-b from-muted/50 to-muted lg:w-1/2 w-full">
      <div class="w-full max-w-md">
        <Card class="shadow-xl border-border/50">
          <CardContent class="p-6 md:p-8">
            <form @submit.prevent="handleSubmit">
              <div class="flex flex-col gap-6">
                <!-- 标题 -->
                <div class="flex flex-col items-center text-center">
                  <h1 class="text-2xl font-bold">
                    欢迎回来
                  </h1>
                  <p class="text-balance text-muted-foreground mt-2">
                    登录到您的 SSE-Wiki 账号
                  </p>
                </div>

                <!-- 表单字段 -->
                <div class="grid gap-4">
                  <div class="grid gap-2">
                    <Label for="username">用户名</Label>
                    <Input
                      id="username"
                      v-model="form.username"
                      type="text"
                      placeholder="请输入用户名"
                      required
                      :disabled="loading"
                    />
                  </div>
                  <div class="grid gap-2">
                    <Label for="password">密码</Label>
                    <Input
                      id="password"
                      v-model="form.password"
                      type="password"
                      placeholder="请输入密码"
                      required
                      :disabled="loading"
                    />
                  </div>
                </div>

                <!-- 错误提示 -->
                <div v-if="error" class="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {{ error }}
                </div>

                <!-- 登录按钮 -->
                <Button
                  type="submit"
                  :disabled="loading"
                  class="w-full"
                >
                  {{ loading ? '登录中...' : '登录' }}
                </Button>

                <!-- 分隔线 -->
                <div class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                  <span class="relative z-10 bg-background px-2 text-muted-foreground">
                    或继续使用
                  </span>
                </div>

                <!-- OAuth 登录 -->
                <div class="grid gap-2">
                  <Button variant="outline" class="w-full" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub 登录
                  </Button>
                  <Button variant="outline" class="w-full" type="button">
                    软工集市账号登录
                  </Button>
                </div>

                <!-- 底部链接 -->
                <div class="text-center text-sm">
                  还没有账号？
                  <RouterLink to="/register" class="underline underline-offset-4 hover:text-primary">
                    立即注册
                  </RouterLink>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <!-- 服务条款 -->
        <div class="mt-4 text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
          点击登录即表示您同意我们的 <a href="#">服务条款</a> 和 <a href="#">隐私政策</a>
        </div>
      </div>
    </div>

    <!-- 右侧动画 -->
    <div class="hidden lg:flex lg:w-1/4 transition-all duration-500">
      <WheelAnime maxwidth="100%" />
    </div>
  </div>
</template>
