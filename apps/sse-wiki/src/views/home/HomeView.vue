<script setup lang="ts">
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@sse-wiki/ui'
import { AlertCircle, Check } from 'lucide-vue-next'
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

    <Card>
      <CardHeader>
        <CardTitle>认证状态</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert v-if="isAuthenticated" class="border-green-200 bg-green-50">
          <Check class="h-4 w-4 text-green-600" />
          <AlertTitle class="text-green-600">
            已登录
          </AlertTitle>
          <AlertDescription v-if="user" class="text-green-700">
            当前用户：{{ user.username }}
          </AlertDescription>
        </Alert>
        <Alert v-else variant="default" class="border-yellow-200 bg-yellow-50">
          <AlertCircle class="h-4 w-4 text-yellow-600" />
          <AlertTitle class="text-yellow-600">
            未登录
          </AlertTitle>
          <AlertDescription class="text-yellow-700">
            点击右上角的登录按钮开始使用
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  </section>
</template>
