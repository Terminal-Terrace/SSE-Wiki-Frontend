# @sse-wiki/ui

SSE Wiki 项目的 UI 组件库，基于 shadcn/ui 和 Tailwind CSS。

## 安装

在 pnpm workspace 中使用：

```json
{
  "dependencies": {
    "@sse-wiki/ui": "workspace:*"
  }
}
```

## 使用

### 导入全局样式

在你的主应用入口文件中导入全局样式：

```ts
import '@sse-wiki/ui/src/styles/globals.css'
```

### 使用组件

```vue
<script setup lang="ts">
import { Button, Card, Input } from '@sse-wiki/ui'
</script>

<template>
  <Card>
    <Input v-model="value" placeholder="输入内容" />
    <Button @click="handleClick">
      提交
    </Button>
  </Card>
</template>
```

## 可用组件

- **Button** - 按钮组件，支持多种变体（default, destructive, outline, secondary, ghost, link）
- **Input** - 输入框组件
- **Card** - 卡片容器
- **Badge** - 标签组件
- **Dialog** - 对话框组件
- **Textarea** - 文本域组件
- **Tabs / TabsContent** - 标签页组件
- **DropdownMenu / DropdownMenuItem** - 下拉菜单组件
- **PageSkeleton** - 页面骨架屏

## 工具函数

```ts
import { cn } from '@sse-wiki/ui'

// 用于合并 Tailwind CSS 类名
const className = cn('base-class', condition && 'conditional-class')
```

## 主题定制

组件使用 CSS 变量进行主题定制，在你的应用中可以覆盖这些变量：

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  /* ... 更多变量 */
}
```

## 开发

```bash
# 类型检查
pnpm type-check
```