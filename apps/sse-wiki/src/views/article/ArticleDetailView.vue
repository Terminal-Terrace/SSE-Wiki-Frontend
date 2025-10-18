<script setup lang="ts">
import type { Page } from '@/types'
import type { ThreeWayMergeData } from '@/types/article'
import { Badge, Button, Dialog, DialogContent, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, toast } from '@sse-wiki/ui'

import { Bot, Edit } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AiChatSidebar from '@/components/AiChatSidebar.vue'
import ThreeWayMerge from '@/components/article/ThreeWayMerge.vue'
import ArticleContentCard from '@/components/ArticleContentCard.vue'
import ArticleDiscussionList from '@/components/ArticleDiscussionList.vue'
import ArticleEditCard from '@/components/ArticleEditCard.vue'
import ArticleHistoryList from '@/components/ArticleHistoryList.vue'
import OutlineCard from '@/components/OutlineCard.vue'

import { useLoginRedirect } from '@/composables/useLoginRedirect'
// 服务和工具
import { articleApi } from '@/services/articleApi'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/format'

interface Props {
  id?: string
  articleId?: string
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
const { startLogin } = useLoginRedirect()

const loading = ref(true)
const page = ref<Page | null>(null)
const activeTab = ref('content')
const showAiChat = ref(false)

// 冲突处理状态
const showConflictDialog = ref(false)
const currentConflictData = ref<ThreeWayMergeData | null>(null)
const pendingSubmissionData = ref<{
  content: string
  commitMessage: string
  baseVersionId: number
} | null>(null)

// 兼容路由 param 名称：优先使用 props.id, 然后 props.articleId, 最后退回到 route.params.articleId
const pageId = computed(() => String(props.id ?? props.articleId ?? route.params.articleId ?? ''))

const tabs = [
  { label: '详情', value: 'content' },
  { label: '编辑', value: 'edit' },
  { label: '历史', value: 'history' },
  { label: '讨论', value: 'discussion' },
]

const canEdit = computed(() => isAuthenticated.value)

// 从 URL 查询参数初始化 activeTab
onMounted(async () => {
  // 设置初始 tab
  const tabFromQuery = route.query.tab as string
  if (tabFromQuery && tabs.some(tab => tab.value === tabFromQuery)) {
    activeTab.value = tabFromQuery
  }

  // 调试信息：打印 props 和路由参数，便于排查 pageId 为空的原因
  console.debug('ArticleDetail mounted', {
    props,
    routeParams: route.params,
    routeQuery: route.query,
    fullPath: route.fullPath,
    pageId: pageId.value,
  })

  // 仅在 pageId 可用时加载页面数据，若为空则等待 watcher 触发
  if (pageId.value) {
    await loadPage()
  }
})

watch(() => pageId.value, async (newId, oldId) => {
  console.debug('ArticleDetail: pageId changed', { newId, oldId })
  if (newId && newId !== oldId) {
    await loadPage()
  }
})

// 监听路由查询参数变化
watch(() => route.query.tab, (newTab) => {
  if (newTab && typeof newTab === 'string' && tabs.some(tab => tab.value === newTab)) {
    activeTab.value = newTab
  }
})

function mapArticleToPage(article: any): Page {
  // 将后端 ArticleDetailResponse 映射为本地 Page 结构，兼容现有组件
  const content = article.content ?? article.current_version?.content ?? article.versions?.[0]?.content ?? ''
  const lastEditedAt = article.updated_at ?? article.current_version?.created_at ?? new Date().toISOString()
  const editor = article.current_version?.author ? { id: article.current_version.author.id, username: article.current_version.author.username } : (article.author ? { id: article.author.id, username: article.author.username } : { id: 0, username: 'unknown' })
  // 处理标签：如果是字符串数组，转换为对象数组
  const tags = (article.tags ?? []).map((t: any) => {
    if (typeof t === 'string') {
      return { id: t, name: t } // 字符串标签，用名称作为ID
    }
    return { id: t.id, name: t.name } // 对象标签
  })
  const versions = (article.versions ?? []).map((v: any) => ({
    id: v.id,
    commitMessage: v.commit_message ?? v.commitMessage ?? '',
    editor: v.author?.username ?? String(v.author_id ?? ''),
    timestamp: v.created_at ?? v.timestamp,
    content: v.content ?? '',
  }))

  return {
    id: article.id,
    title: article.title,
    content,
    lastEditedAt,
    editor,
    viewCount: article.view_count ?? article.viewCount ?? 0,
    tags,
    versions,
    currentVersionId: article.current_version_id, // 保存当前版本ID
  }
}

async function loadPage() {
  loading.value = true
  try {
    console.debug('ArticleDetail: loading page', pageId.value)
    const data = await articleApi.getArticle(pageId.value)
    page.value = mapArticleToPage(data)
  }
  catch (error) {
    console.error('Failed to load page:', error)
    page.value = null
  }
  finally {
    loading.value = false
  }
}

function handleTabChange(tab: string | number) {
  const tabValue = String(tab)
  activeTab.value = tabValue
  // 不修改 URL,仅在组件内部切换 tab
}

function navigateToEdit() {
  router.push(`/edit/${pageId.value}`)
}

async function showLoginPrompt() {
  await startLogin()
}

function toggleAiChat() {
  showAiChat.value = !showAiChat.value
}

/**
 * 保存文章修改
 * 创建提交，如果遇到冲突（409）则显示冲突处理对话框
 * @param updatedPage - 更新的页面数据，包含内容和提交信息
 */
async function handleSave(updatedPage: Partial<Page> & { commitMessage?: string }) {
  if (!page.value)
    return

  try {
    const pageId = page.value.id ? String(page.value.id) : 'unknown'
    const content = updatedPage.content ?? page.value.content ?? ''
    const commitMessage = updatedPage.commitMessage || '内容更新'

    // 获取正确的 base_version_id：优先使用 currentVersionId，回退到第一个版本
    const baseVersionId = (page.value as any).currentVersionId ?? page.value?.versions?.[0]?.id ?? 0

    if (!baseVersionId) {
      toast({
        title: '保存失败',
        description: '无法获取当前版本ID，请刷新页面后重试',
        variant: 'destructive',
      })
      return
    }

    // 保存提交数据，以便冲突解决后重新提交
    pendingSubmissionData.value = {
      content,
      commitMessage,
      baseVersionId,
    }

    // 使用创建提交的方式保存修改（后端会返回 ReviewSubmission）
    const submission = await articleApi.createSubmission(pageId, {
      content,
      commit_message: commitMessage,
      base_version_id: baseVersionId,
    })

    if (submission) {
      // 刷新页面数据并切换到历史页
      await loadPage()
      activeTab.value = 'history'
      toast({
        title: '保存成功',
        description: '您的修改已提交',
      })
      // 清空待提交数据
      pendingSubmissionData.value = null
    }
    else {
      toast({
        title: '保存失败',
        description: '请重试',
        variant: 'destructive',
      })
    }
  }
  catch (error: any) {
    // 检查是否为冲突错误（409）
    if (error.response?.status === 409) {
      const conflictDataFromError = error.response?.data?.data?.conflict_data
      if (conflictDataFromError) {
        // 显示冲突对话框
        currentConflictData.value = conflictDataFromError
        showConflictDialog.value = true
        toast({
          title: '检测到冲突',
          description: '请解决冲突后重新提交',
          variant: 'destructive',
        })
      }
      else {
        toast({
          title: '冲突错误',
          description: '无法获取冲突数据，请刷新页面重试',
          variant: 'destructive',
        })
      }
    }
    else {
      console.error('Failed to save page:', error)
      toast({
        title: '保存失败',
        description: error.response?.data?.message || '请重试',
        variant: 'destructive',
      })
    }
  }
}

/**
 * 处理冲突解决
 * 使用解决后的内容重新创建提交
 * @param mergedContent - 解决冲突后的合并内容
 */
async function handleConflictResolve(mergedContent: string) {
  if (!page.value || !pendingSubmissionData.value)
    return

  try {
    const pageId = page.value.id ? String(page.value.id) : 'unknown'

    // 使用解决后的内容重新提交
    await articleApi.createSubmission(pageId, {
      content: mergedContent,
      commit_message: pendingSubmissionData.value.commitMessage,
      base_version_id: pendingSubmissionData.value.baseVersionId,
    })

    toast({
      title: '冲突已解决',
      description: '您的修改已成功提交',
    })

    // 关闭对话框
    showConflictDialog.value = false
    currentConflictData.value = null
    pendingSubmissionData.value = null

    // 刷新页面并切换到历史页
    await loadPage()
    activeTab.value = 'history'
  }
  catch (error: any) {
    console.error('Failed to submit after conflict resolution:', error)
    toast({
      title: '提交失败',
      description: error.response?.data?.message || '请重试',
      variant: 'destructive',
    })
  }
}

/**
 * 取消冲突处理
 * 关闭对话框但保留待提交数据，用户可以重新尝试
 */
function handleConflictCancel() {
  showConflictDialog.value = false
  currentConflictData.value = null
  // 不清空 pendingSubmissionData，用户可能想再次尝试
}
</script>

<template>
  <div class="w-full px-6 sm:px-8 lg:px-12 py-6">
    <!-- 页面头部信息 - 始终显示，不受 loading 影响 -->
    <div v-if="page" class="relative">
      <!-- 主内容区域 -->
      <div class="flex gap-6">
        <!-- 左侧主内容 -->
        <div
          class="transition-all duration-300 ease-in-out" :class="[
            showAiChat ? 'w-[calc(100%-24rem)] pr-6' : 'w-full',
          ]"
        >
          <div class="space-y-6 w-full">
            <!-- Page header -->
            <header class="space-y-4">
              <div class="flex items-start justify-between">
                <h1 class="text-3xl font-bold tracking-tight">
                  {{ page.title }}
                </h1>
                <div class="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    class="flex items-center space-x-2 transition-colors" :class="[
                      showAiChat ? 'bg-primary text-primary-foreground' : '',
                    ]"
                    @click="toggleAiChat"
                  >
                    <Bot class="h-4 w-4" />
                    <span>AI助手</span>
                  </Button>
                  <Button
                    v-if="canEdit"
                    variant="outline"
                    size="sm"
                    @click="navigateToEdit"
                  >
                    <Edit class="h-4 w-4 mr-2" />
                    编辑
                  </Button>
                </div>
              </div>

              <div class="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>最近编辑于 {{ formatDate(page.lastEditedAt) }}</span>
                <span>由 {{ page.editor.username }}</span>
                <span>{{ page.viewCount }} 次阅读</span>
              </div>

              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="tag in page.tags"
                  :key="tag.id"
                  variant="secondary"
                >
                  {{ tag.name }}
                </Badge>
              </div>

              <div class="border-b" />
            </header>

            <!-- Tab navigation -->
            <Tabs :default-value="activeTab" :model-value="activeTab" @update:model-value="handleTabChange">
              <TabsList>
                <TabsTrigger value="content">
                  详情
                </TabsTrigger>
                <TabsTrigger value="edit">
                  编辑
                </TabsTrigger>
                <TabsTrigger value="history">
                  历史
                </TabsTrigger>
                <TabsTrigger value="discussion">
                  讨论
                </TabsTrigger>
              </TabsList>

              <!-- Content Tab -->
              <TabsContent value="content">
                <div v-if="loading" class="flex justify-center py-8">
                  <div class="text-muted-foreground">
                    加载中...
                  </div>
                </div>
                <div v-else class="flex gap-8">
                  <!-- 主要内容区域 -->
                  <div class="flex-1 min-w-0">
                    <div class="py-4">
                      <ArticleContentCard :content="page.content" />
                    </div>
                  </div>

                  <!-- 右侧目录大纲 - 只在AI对话关闭时显示 -->
                  <div v-if="!showAiChat" class="hidden lg:block w-72 flex-shrink-0">
                    <div class="sticky top-4">
                      <OutlineCard :content="page.content" :is-sidebar="true" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <!-- Edit Tab -->
              <TabsContent value="edit" class="h-[calc(100vh-20rem)] overflow-hidden">
                <div v-if="!canEdit" class="text-center py-8">
                  <p class="text-muted-foreground">
                    您需要登录才能编辑此页面
                  </p>
                  <Button class="mt-4" @click="showLoginPrompt">
                    登录
                  </Button>
                </div>
                <ArticleEditCard v-else :page="page" @save="handleSave" />
              </TabsContent>

              <!-- History Tab -->
              <TabsContent value="history">
                <ArticleHistoryList :page-id="page.id" :versions="page.versions" />
              </TabsContent>

              <!-- Discussion Tab -->
              <TabsContent value="discussion">
                <ArticleDiscussionList :page-id="page.id" />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <!-- 右侧AI对话栏 -->
        <div
          class="transition-all duration-300 ease-in-out" :class="[
            showAiChat ? 'w-96 opacity-100' : 'w-0 opacity-0 overflow-hidden',
          ]"
        >
          <div v-if="showAiChat" class="h-[calc(100vh-8rem)] sticky top-4">
            <AiChatSidebar
              :article-title="page.title"
              :article-content="page.content"
              @close="toggleAiChat"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 初始加载时的骨架屏 -->
    <div v-else-if="loading" class="space-y-4">
      <Skeleton class="h-12 w-3/4" />
      <Skeleton class="h-4 w-1/2" />
      <Skeleton class="h-64 w-full" />
    </div>

    <!-- 页面不存在 -->
    <div v-else class="text-center py-12">
      <h2 class="text-2xl font-semibold mb-2">
        页面未找到
      </h2>
      <p class="text-muted-foreground mb-4">
        抱歉，您请求的页面不存在。
      </p>
      <Button @click="router.push('/')">
        返回首页
      </Button>
    </div>

    <!-- 冲突处理对话框 -->
    <Dialog v-model:open="showConflictDialog">
      <DialogContent class="max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <ThreeWayMerge
          v-if="currentConflictData"
          :conflict-data="currentConflictData"
          :submission-id="0"
          @resolve="handleConflictResolve"
          @cancel="handleConflictCancel"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>
