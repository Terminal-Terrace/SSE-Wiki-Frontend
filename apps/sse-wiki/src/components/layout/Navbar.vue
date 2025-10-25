<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from '@sse-wiki/ui'

import { LogOut, Search, User } from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { TooltipWrapper } from '@/components/common/tooltip'
import { useAuth } from '../../composables/useAuth'

interface NavItem {
  label: string
  to: { name: string }
}

const { startLogin, logout, loading, isAuthenticated, user } = useAuth()
const router = useRouter()
const searchQuery = ref('')

const navItems: NavItem[] = [
  {
    label: '知识空间',
    to: { name: 'knowledge-space' },
  },
  {
    label: 'AI助手',
    to: { name: 'assistant' },
  },
]

async function handleLogin() {
  await startLogin()
}

function handleLogout() {
  logout()
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    // 跳转到搜索页面并传递查询参数
    router.push({
      name: 'search',
      query: { q: searchQuery.value },
    })
  }
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="w-full px-6">
      <div class="flex h-14 items-center justify-between">
        <div class="flex items-center gap-6">
          <RouterLink
            to="/"
            class="flex items-center gap-2 text-foreground transition-colors hover:text-foreground/80"
          >
            <span class="text-lg font-semibold">SSE Wiki</span>
          </RouterLink>
          <nav class="hidden md:flex items-center gap-6">
            <RouterLink
              v-for="item in navItems"
              :key="item.label"
              :to="item.to"
              class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              active-class="text-foreground"
              exact-active-class="text-foreground"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>

        <div class="flex-1 max-w-sm mx-6">
          <TooltipWrapper>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                placeholder="搜索文档..."
                class="h-9 pl-9 pr-4 w-full"
                @keydown.enter="handleSearch"
              />
            </div>
            <template #tooltip>
              <div class="text-xs space-y-1">
                <div>按 <kbd class="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> 搜索</div>
                <div class="text-muted-foreground">
                  快捷键: <kbd class="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Ctrl+K</kbd>
                </div>
              </div>
            </template>
          </TooltipWrapper>
        </div>

        <!-- 右侧：用户菜单 -->
        <div class="flex items-center">
          <!-- 未登录状态 -->
          <Button
            v-if="!isAuthenticated"
            :disabled="loading"
            variant="outline"
            size="sm"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </Button>

          <DropdownMenu v-else>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="flex items-center space-x-2">
                <User class="h-4 w-4" />
                <span class="text-sm">{{ user?.username || '用户' }}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <DropdownMenuItem>
                <User class="mr-2 h-4 w-4" />
                <span>个人资料</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="handleLogout">
                <LogOut class="mr-2 h-4 w-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  </header>
</template>
