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
import { RouterLink } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

interface NavItem {
  label: string
  to: { name: string }
}

const { startLogin, logout, loading, isAuthenticated, user } = useAuth()
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
    // TODO: 处理搜索逻辑
    console.log('搜索:', searchQuery.value)
  }
}
</script>

<template>
  <header class="z-30 border-b bg-white">
    <div class="w-full px-6">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center space-x-8">
          <RouterLink
            to="/"
            class="flex items-center space-x-2 text-gray-900 transition-colors duration-200"
          >
            <span class="text-xl font-semibold">SSE Wiki</span>
          </RouterLink>
          <nav class="hidden md:flex space-x-8 text-[18px]">
            <RouterLink
              v-for="item in navItems"
              :key="item.label"
              :to="item.to"
              class="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
              active-class="font-semibold"
              exact-active-class="font-semibold"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>

        <div class="flex-1 max-w-md mx-8">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              v-model="searchQuery"
              placeholder="搜索..."
              class="pl-10 pr-4 w-full"
              @keydown.enter="handleSearch"
            />
          </div>
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
