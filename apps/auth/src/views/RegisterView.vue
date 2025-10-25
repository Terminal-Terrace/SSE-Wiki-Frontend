<script setup lang="ts">
import { Button, Card, CardContent, Input, Label } from '@sse-wiki/ui'
import { RouterLink } from 'vue-router'
import Robot from '../components/Robot.vue'
</script>

<template>
  <div class="relative flex min-h-screen">
    <!-- 左侧：机器人动画 -->
    <div class="relative hidden lg:flex lg:w-2/5 bg-muted items-center justify-center">
      <Robot />
    </div>

    <!-- 右侧：表单区域 -->
    <div class="flex flex-1 items-center justify-center py-12 px-6 lg:px-12 bg-background">
      <div class="w-full max-w-md">
        <div class="flex flex-col gap-6">
          <!-- 标题 -->
          <div class="flex flex-col items-center text-center">
            <h1 class="text-3xl font-bold">
              创建账号
            </h1>
            <p class="text-balance text-muted-foreground mt-2">
              加入 SSE-Wiki 知识空间
            </p>
          </div>

          <!-- 表单 -->
          <Card class="shadow-lg border-border/50">
            <CardContent class="p-6">
              <form>
                <div class="flex flex-col gap-5">
                  <!-- 表单字段 -->
                  <div class="grid gap-4">
                    <div class="grid gap-2">
                      <Label for="username">用户名</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="请输入用户名"
                        required
                      />
                    </div>
                    <div class="grid gap-2">
                      <Label for="email">邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    <div class="grid gap-2">
                      <Label for="password">密码</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="请输入密码"
                        required
                      />
                    </div>
                    <div class="grid gap-2">
                      <Label for="confirmPassword">确认密码</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="请再次输入密码"
                        required
                      />
                    </div>
                  </div>

                  <!-- 注册按钮 -->
                  <Button
                    type="submit"
                    class="w-full"
                  >
                    创建账号
                  </Button>

                  <!-- 分隔线 -->
                  <div class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                    <span class="relative z-10 bg-background px-2 text-muted-foreground">
                      或使用以下方式注册
                    </span>
                  </div>

                  <!-- OAuth 注册 -->
                  <div class="grid gap-2">
                    <Button variant="outline" class="w-full" type="button">
                      <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub 注册
                    </Button>
                    <Button variant="outline" class="w-full" type="button">
                      软工集市账号注册
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <!-- 底部链接 -->
          <div class="text-center text-sm">
            已有账号？
            <RouterLink to="/login" class="underline underline-offset-4 hover:text-primary">
              立即登录
            </RouterLink>
          </div>

          <!-- 服务条款 -->
          <div class="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
            点击注册即表示您同意我们的 <a href="#">服务条款</a> 和 <a href="#">隐私政策</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
