<script setup lang="ts">
import { Button } from '@sse-wiki/ui'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          创建账号
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          加入 SSE-Wiki 知识空间
        </p>
      </div>

      <form class="mt-8 space-y-6">
        <div class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              用户名
            </label>
            <input
              id="username"
              type="text"
              required
              placeholder="请输入用户名"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            >
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="请输入邮箱地址"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            >
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="请输入密码"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            >
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              placeholder="请再次输入密码"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            >
          </div>
        </div>

        <Button
          type="submit"
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          创建账号
        </Button>
      </form>

      <div class="text-center">
        <span class="text-sm text-gray-600">已有账号？</span>
        <RouterLink to="/login" class="ml-1 text-sm font-medium text-indigo-600 hover:text-indigo-500">
          立即登录
        </RouterLink>
      </div>
    </div>
  </div>
</template>
