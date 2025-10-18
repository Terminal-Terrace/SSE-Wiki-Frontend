<script setup lang="ts">
/**
 * TODO: 独立的文章编辑器页面（未实现）
 *
 * 当前状态：占位符实现，显示示例数据
 * 优先级：P2
 *
 * 需求：
 * 1. 接收路由参数 articleId（可选，无 ID 表示创建新文章）
 * 2. 加载文章数据（如果是编辑模式）
 * 3. 提供全屏编辑体验（与 ArticleDetailView 的编辑标签页分离）
 * 4. 支持自动保存草稿（LocalStorage/IndexedDB）
 * 5. 支持实时预览
 * 6. 保存后跳转到文章详情页
 *
 * 实现建议：
 * - 复用 ArticleEditCard 组件
 * - 添加全屏布局和工具栏
 * - 集成快捷键支持（Ctrl+S 保存等）
 * - 添加离线编辑支持
 */
import type { Page } from '@/types'
import ArticleEditCard from '@/components/ArticleEditCard.vue'

const page: Page = {
  id: 1,
  title: '示例页面标题',
  content: '# 示例页面\n\n这是页面的示例内容。',
  lastEditedAt: new Date().toISOString(),
  editor: {
    id: 1,
    username: '示例用户',
  },
  viewCount: 100,
  tags: [
    { id: 1, name: '示例' },
    { id: 2, name: '测试' },
  ],
  currentVersionId: 1,
}
</script>

<template>
  <div class="max-h-[92vh] overflow-y-auto w-full">
    <ArticleEditCard :page="page" />
  </div>
</template>
