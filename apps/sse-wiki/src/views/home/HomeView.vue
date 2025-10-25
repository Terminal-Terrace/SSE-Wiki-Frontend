<script setup lang="ts">
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@sse-wiki/ui'
import { AlertCircle, ArrowRight, BookOpen, Check, FileText, Layers, Search } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const { isAuthenticated, user } = useAuth()
const router = useRouter()

// 快速操作
const quickActions = [
  {
    icon: Layers,
    title: '浏览知识空间',
    description: '查看所有模块和文章',
    action: () => router.push({ name: 'knowledge-space' }),
  },
  {
    icon: Search,
    title: '全局搜索',
    description: '快速找到需要的内容',
    action: () => router.push({ name: 'search' }),
  },
  {
    icon: BookOpen,
    title: 'AI 助手',
    description: '智能问答与知识检索',
    action: () => router.push({ name: 'assistant' }),
  },
]

// 功能亮点
const features = [
  {
    title: '📝 协作编辑',
    description: '支持多人协作，版本控制，冲突解决',
  },
  {
    title: '🔍 全文搜索',
    description: '快速检索文章内容和标签',
  },
  {
    title: '🤖 AI 辅助',
    description: '智能问答，内容生成与分析',
  },
  {
    title: '📊 权限管理',
    description: '细粒度的模块与文章权限控制',
  },
]
</script>

<template>
  <section class="space-y-8">
    <!-- 欢迎头部 -->
    <header class="space-y-3">
      <h1 class="text-4xl font-bold tracking-tight text-foreground">
        欢迎来到 SSE-Wiki
      </h1>
      <p class="text-lg text-muted-foreground">
        企业级知识管理与协作平台
      </p>
    </header>

    <!-- 用户状态 -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <span>当前状态</span>
          <Badge v-if="isAuthenticated" variant="default" class="gap-1">
            <Check class="h-3 w-3" />
            已登录
          </Badge>
          <Badge v-else variant="secondary">
            未登录
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert v-if="isAuthenticated" class="border-green-200 bg-green-50">
          <Check class="h-4 w-4 text-green-600" />
          <AlertTitle class="text-green-600">
            欢迎回来，{{ user?.username }}！
          </AlertTitle>
          <AlertDescription class="text-green-700">
            您可以浏览、编辑和管理知识内容
          </AlertDescription>
        </Alert>
        <Alert v-else variant="default" class="border-blue-200 bg-blue-50">
          <AlertCircle class="h-4 w-4 text-blue-600" />
          <AlertTitle class="text-blue-600">
            开始使用
          </AlertTitle>
          <AlertDescription class="text-blue-700">
            点击右上角的登录按钮，登录后即可完整使用所有功能
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>

    <!-- 快速操作 -->
    <div>
      <h2 class="text-2xl font-semibold mb-4">
        快速开始
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          v-for="action in quickActions"
          :key="action.title"
          class="hover:shadow-lg transition-shadow cursor-pointer group"
          @click="action.action"
        >
          <CardHeader>
            <div class="flex items-start justify-between">
              <component
                :is="action.icon"
                class="h-10 w-10 text-primary group-hover:scale-110 transition-transform"
              />
              <ArrowRight class="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <CardTitle class="mt-4">
              {{ action.title }}
            </CardTitle>
            <CardDescription>
              {{ action.description }}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>

    <!-- 功能介绍 -->
    <div>
      <h2 class="text-2xl font-semibold mb-4">
        核心功能
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          v-for="feature in features"
          :key="feature.title"
        >
          <CardHeader>
            <CardTitle class="text-lg">
              {{ feature.title }}
            </CardTitle>
            <CardDescription>
              {{ feature.description }}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>

    <!-- 使用提示 -->
    <Card class="border-dashed">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <FileText class="h-5 w-5" />
          使用提示
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-2 text-sm text-muted-foreground">
        <p>💡 <strong>快捷键</strong>：按 <kbd class="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+K</kbd> 快速打开搜索</p>
        <p>📁 <strong>模块管理</strong>：在左侧边栏点击"编辑"按钮进入编辑模式，管理模块层级</p>
        <p>✏️ <strong>文章编辑</strong>：支持 Markdown 快捷键，拖拽上传文件，实时预览</p>
        <p>🔄 <strong>版本控制</strong>：每次修改都会保存版本记录，可随时回滚</p>
      </CardContent>
    </Card>
  </section>
</template>

<style scoped>
kbd {
  font-family: monospace;
}
</style>
