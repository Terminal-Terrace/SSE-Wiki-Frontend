<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@sse-wiki/ui'

import { LogOut, User } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

interface NavItem {
  label: string
  to: { name: string }
}

const { startLogin, logout, loading, isAuthenticated, user } = useAuth()

const navItems: NavItem[] = [
  {
    label: '知识空间',
    to: { name: 'knowledge-space' },
  },
  {
    label: 'AI助手',
    to: { name: 'assistant' },
  },
  {
    label: '搜索',
    to: { name: 'search' },
  },
]

async function handleLogin() {
  await startLogin()
}

function handleLogout() {
  logout()
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
    <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
      <RouterLink to="/" class="group flex items-center gap-3 text-left">
        <span class="flex flex-col">
          <span class="text-base font-semibold tracking-tight text-foreground">
            SSE Wiki
          </span>
          <span class="text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">
            团队知识 · AI 驱动协作
          </span>
        </span>
      </RouterLink>

      <NavigationMenu class="hidden lg:flex">
        <NavigationMenuList class="items-center gap-1">
          <NavigationMenuItem v-for="item in navItems" :key="item.label">
            <NavigationMenuLink as-child>
              <RouterLink
                :to="item.to"
                class="min-w-[120px] justify-center" :class="[navigationMenuTriggerStyle()]"
              >
                {{ item.label }}
              </RouterLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <!-- 登录/用户菜单 -->
      <div class="flex items-center gap-2">
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

        <!-- 已登录状态 -->
        <DropdownMenu v-else>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="sm" class="flex items-center gap-2">
              <User class="h-4 w-4" />
              <span>{{ user?.username || '用户' }}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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

        <!-- 移动端导航 -->
        <RouterLink
          :to="{ name: 'search' }"
          class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary lg:hidden"
        >
          快速导航
        </RouterLink>
      </div>
    </div>
  </header>
</template>
