<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@sse-wiki/ui'

import { RouterLink } from 'vue-router'

type NavItem
  = | {
    label: string
    to: { name: string }
  }
  | {
    label: string
    href: string
  }

// auth 模块端口为 8080
const authBaseUrl = (import.meta.env.VITE_AUTH_APP_URL ?? 'http://localhost:8080').replace(/\/$/, '')

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
  {
    label: '登录',
    href: `${authBaseUrl}/login`,
  },
]

function isRouteItem(item: NavItem): item is Extract<NavItem, { to: { name: string } }> {
  return 'to' in item
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
            <NavigationMenuLink v-if="isRouteItem(item)" as-child>
              <RouterLink
                :to="item.to"
                class="min-w-[120px] justify-center" :class="[navigationMenuTriggerStyle()]"
              >
                {{ item.label }}
              </RouterLink>
            </NavigationMenuLink>
            <NavigationMenuLink v-else as-child>
              <a
                :href="item.href"
                class="min-w-[120px] justify-center" :class="[navigationMenuTriggerStyle()]"
              >
                {{ item.label }}
              </a>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <RouterLink
        :to="{ name: 'search' }"
        class="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary lg:hidden"
      >
        快速导航
      </RouterLink>
    </div>
  </header>
</template>
