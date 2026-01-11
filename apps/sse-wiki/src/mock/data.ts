// Mock API for Page data
import type { Page } from '@/types'

// 模拟数据：添加多个示例文章用于本地开发和测试
const mockPages: Record<string, Page> = {
  1: {
    id: 1,
    currentVersionId: 1,
    title: '示例文章 — 欢迎页',
    moduleId: 1,
    createdBy: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
    isReviewRequired: false,
    viewCount: 123,
    content: `# 欢迎使用 SSE Wiki

这是一个示例文章页面，用于展示文章详情页的渲染效果。

## 功能特性

- Markdown 编辑器
- 版本历史
- 讨论功能
- AI 助手

## 开始使用

1. 点击编辑按钮开始编辑
2. 使用 Markdown 语法撰写内容
3. 保存后即可查看效果

### 更多功能

待完善...`,
    editor: {
      id: '1',
      username: '管理员',
    },
    tags: ['示例', '文档'],
    versions: [
      {
        id: '1',
        commitMessage: '初始版本',
        editor: '管理员',
        timestamp: new Date().toISOString(),
        content: '初始内容',
      },
    ],
  },

  2: {
    id: 2,
    currentVersionId: 1,
    title: '部署指南 — 将 SSE 部署到 Cloudflare Workers',
    moduleId: 1,
    createdBy: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isReviewRequired: false,
    viewCount: 452,
    content: `# 部署指南

本文档介绍如何将 SSE Wiki 前端部署到 Cloudflare Workers（Pages/Workers）或其他静态托管服务。

## 前提条件

- 已安装 Node.js
- 已有 Cloudflare 帐户和对应权限

## 步骤

1. 安装依赖并构建：

   \`pnpm install && pnpm build\`

2. 使用 Wrangler 或 Pages 上传构建产物。


## 注意事项

- 请确保正确设置环境变量，例如 API 地址和 Auth 配置。`,
    editor: { id: '2', username: 'devops' },
    tags: ['部署', '运维'],
    versions: [
      { id: '1', commitMessage: '添加部署说明', editor: 'devops', timestamp: new Date().toISOString(), content: '初始部署文档' },
    ],
  },

  3: {
    id: 3,
    currentVersionId: null,
    title: 'Markdown 使用指南',
    moduleId: 1,
    createdBy: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    isReviewRequired: false,
    viewCount: 980,
    content: `# Markdown 使用指南

本文汇总常用的 Markdown 语法示例，便于在编辑器中撰写文档。

## 标题

使用 \`#、##、###\` 表示不同级别标题。

## 列表

- 无序列表项
- 有序列表项

## 代码块

\`\`\`js
console.log('hello')
\`\`\`

## 链接与图片

[SSE Wiki](https://example.com)

![示例图片](https://via.placeholder.com/300)`,
    editor: { id: '3', username: 'writer' },
    tags: ['写作', 'Markdown'],
    versions: [],
  },

  4: {
    id: 4,
    currentVersionId: null,
    title: '示例：算法笔记 — 二分查找',
    moduleId: 2,
    createdBy: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    isReviewRequired: true,
    viewCount: 204,
    content: `# 二分查找

二分查找是一种在有序数组中查找目标值的算法，时间复杂度为 $O(\log n)$。

## 伪代码

\`\`\`txt
function binarySearch(arr, target) {
  left = 0
  right = arr.length - 1
  while (left <= right) {
    mid = Math.floor((left + right) / 2)
    if (arr[mid] === target) return mid
    if (arr[mid] < target) left = mid + 1
    else right = mid - 1
  }
  return -1
}
\`\`\`
`,
    editor: { id: '4', username: 'algo' },
    tags: ['算法'],
    versions: [],
  },

  5: {
    id: 5,
    currentVersionId: null,
    title: '产品设计 — 用户体验要点',
    moduleId: 2,
    createdBy: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isReviewRequired: false,
    viewCount: 76,
    content: `# 用户体验要点

本文总结一些常见的 UX 原则，帮助编写文档和设计页面时的决策。

## 原则

- 简单优于复杂
- 一致性
- 反馈及时

## 示例

- 表单校验应在用户离开输入框或提交时给出清晰提示
`,
    editor: { id: '5', username: 'designer' },
    tags: ['设计', 'UX'],
    versions: [],
  },
}

export const mockApi = {
  async getPage(id: string): Promise<Page> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    const page = mockPages[id]
    if (!page) {
      throw new Error('Page not found')
    }
    return page
  },

  async savePageContent(
    pageId: string,
    content: string,
    commitMessage: string,
    _editorId: string,
  ): Promise<Page | null> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    const page = mockPages[pageId]
    if (!page) {
      return null
    }

    // 更新页面内容
    page.content = content
    page.updatedAt = new Date().toISOString()

    // 添加新版本
    if (!page.versions) {
      page.versions = []
    }
    page.versions.unshift({
      id: String(page.versions.length + 1),
      commitMessage,
      editor: page.editor?.username || 'unknown',
      timestamp: new Date().toISOString(),
      content,
    })

    return page
  },
}
