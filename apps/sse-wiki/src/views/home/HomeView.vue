<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@sse-wiki/ui'
import { ArrowRight, BookOpen, Layers, Search } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const { isAuthenticated, user } = useAuth()
const router = useRouter()

// 快速操作
const quickActions = [
  {
    icon: Layers,
    title: '知识空间',
    description: '浏览模块和文章',
    action: () => router.push({ name: 'knowledge-space' }),
  },
  {
    icon: Search,
    title: '搜索',
    description: '查找内容',
    action: () => router.push({ name: 'search' }),
  },
  {
    icon: BookOpen,
    title: 'AI 助手',
    description: '智能问答',
    action: () => router.push({ name: 'assistant' }),
    badge: '开发中',
  },
]
</script>

<template>
  <section class="max-w-7xl mx-auto space-y-8 py-8">
    <!-- 头部 -->
    <header class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">
        SSE Wiki
      </h1>
      <p class="text-muted-foreground">
        软工智库 · 协作知识库
      </p>
      <p v-if="isAuthenticated" class="text-sm text-muted-foreground">
        欢迎，{{ user?.username }}
      </p>
    </header>

    <!-- 项目背景 -->
    <Card class="border-none bg-muted/30">
      <CardContent class="pt-6 space-y-3">
        <p class="text-sm text-muted-foreground leading-relaxed">
          SSE Wiki 是为软件工程专业打造的协作知识库系统。
          采用 gRPC 微服务架构，支持模块化知识组织、富文本协作编辑、
          全文搜索和 AI 辅助问答。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          作为软工教学与实践的知识管理平台，帮助团队高效沉淀和复用项目经验。
        </p>
      </CardContent>
    </Card>

    <!-- 快速操作 -->
    <div>
      <h2 class="text-lg font-semibold mb-4">
        快速开始
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          v-for="action in quickActions"
          :key="action.title"
          class="hover:border-primary/50 transition-colors cursor-pointer"
          @click="action.action"
        >
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <component :is="action.icon" class="h-5 w-5 text-muted-foreground" />
              <ArrowRight class="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle class="text-base mt-2">
              {{ action.title }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
            <CardDescription class="text-xs">
              {{ action.description }}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>
