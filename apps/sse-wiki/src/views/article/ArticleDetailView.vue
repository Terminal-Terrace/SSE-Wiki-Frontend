<script setup lang="ts">
import type { Page, PageVersion } from '@/types'
import type { ThreeWayMergeData } from '@/types/article'
import { Badge, Button, Dialog, DialogContent, Input, Label, ResizableHandle, ResizablePanel, ResizablePanelGroup, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, toast } from '@sse-wiki/ui'

import { Bot, Check, Edit2, Save, Users, X } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'

import { useRoute, useRouter } from 'vue-router'
import ArticleCollaboratorsModal from '@/components/article/ArticleCollaboratorsModal.vue'
import FavoriteButton from '@/components/common/FavoriteButton.vue'
import { TooltipWrapper } from '@/components/common/tooltip'
import { DiscussionThread } from '@/components/discussion'
import OutlineCard from '@/components/layout/OutlinePanel.vue'
import { useLoginRedirect } from '@/composables/useLoginRedirect'
// 服务和工具
import { articleApi } from '@/services/articleApi'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/format'

import AiChatSidebar from '@/views/article/components/AiChatPanel.vue'
import ArticleContentCard from '@/views/article/components/ArticleContent.vue'
import ArticleHistoryList from '@/views/article/components/ArticleHistoryList.vue'

const props = defineProps<Props>()

const ArticleEditCard = defineAsyncComponent(() => import('@/views/article/components/ArticleEditor.vue'))

interface Props {
  id?: string
  articleId?: string
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
const { startLogin } = useLoginRedirect()

const loading = ref(true)
const page = ref<Page | null>(null)
const activeTab = ref('content')
const showAiChat = ref(false)
const showCollaboratorsModal = ref(false)

// 冲突处理状态
const showConflictDialog = ref(false)
const currentConflictData = ref<ThreeWayMergeData | null>(null)
const pendingSubmissionData = ref<{
  content: string
  commitMessage: string
  baseVersionId: number
} | null>(null)

// 基础信息编辑状态
const isEditingBasicInfo = ref(false)
const basicInfoForm = ref({
  title: '',
  tags: [] as string[],
  isReviewRequired: false,
})
const newTagInput = ref('')

// 兼容路由 param 名称：优先使用 props.id, 然后 props.articleId, 最后退回到 route.params.articleId
const pageId = computed(() => String(props.id ?? props.articleId ?? route.params.articleId ?? ''))
const currentUserId = computed(() => authStore.user?.id)

const tabs = [
  { label: '详情', value: 'content' },
  { label: '编辑', value: 'edit' },
  { label: '历史', value: 'history' },
  { label: '讨论', value: 'discussion' },
]

// 正文滚动容器，供大纲监听
const contentScrollRef = ref<HTMLElement | null>(null)

// 判断是否可以管理基础信息（需要 moderator 或更高权限）
const canManageBasicInfo = computed(() => {
  if (!page.value || !isAuthenticated.value) {
    return false
  }
  const role = page.value.currentUserRole
  return role === 'admin' || role === 'owner' || role === 'moderator'
})

// 从 URL 查询参数初始化 activeTab
onMounted(async () => {
  // 设置初始 tab
  const tabFromQuery = route.query.tab as string
  if (tabFromQuery && tabs.some(tab => tab.value === tabFromQuery)) {
    activeTab.value = tabFromQuery
  }

  // 仅在 pageId 可用时加载页面数据，若为空则等待 watcher 触发
  if (pageId.value) {
    await loadPage()
  }
})

watch(() => pageId.value, async (newId, oldId) => {
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

function mapArticleToPage(article: Page): Page {
  // 后端数据已经通过 toCamelCase 转换，统一使用 camelCase
  const content = article.content ?? article.currentVersion?.content ?? article.versions?.[0]?.content ?? ''
  const lastEditedAt = article.updatedAt ?? article.currentVersion?.createdAt ?? new Date().toISOString()
  let editor: { id: number | string, username: string }
  if (article.currentVersion?.author) {
    editor = { id: article.currentVersion.author.id, username: article.currentVersion.author.username }
  }
  else if (article.author) {
    editor = { id: article.author.id, username: article.author.username }
  }
  else {
    editor = { id: 0, username: 'unknown' }
  }

  const tags = article.tags ?? []
  const versions = (article.versions ?? []).map((v: PageVersion) => ({
    id: v.id,
    commitMessage: v.commitMessage ?? '',
    editor: v.author?.username ?? String(v.author?.id ?? ''),
    timestamp: v.createdAt ?? v.timestamp,
    content: v.content ?? '',
  }))

  return {
    ...article,
    content,
    lastEditedAt,
    editor,
    viewCount: article.viewCount ?? 0,
    tags,
    versions,
    currentVersionId: article.currentVersionId,
    // 保留权限和设置信息，用于管理基础信息（统一使用 camelCase）
    currentUserRole: article.currentUserRole,
    isReviewRequired: article.isReviewRequired,
  }
}

async function loadPage() {
  loading.value = true
  try {
    const data = await articleApi.getArticle(pageId.value)
    const mapped = mapArticleToPage(data)
    // 水合操作由 ArticleContent.vue 组件内部处理，避免重复水合
    page.value = mapped
  }
  catch (error) {
    console.error('Failed to load page:', error)
    page.value = null
  }
  finally {
    loading.value = false
  }
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

    // 获取正确的 baseVersionId：优先使用 currentVersionId，回退到第一个版本
    const baseVersionId = Number(page.value?.currentVersionId ?? page.value?.versions?.[0]?.id ?? 0)

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
      commitMessage,
      baseVersionId,
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
  catch (error: unknown) {
    // 检查是否为冲突错误（409）
    const httpError = error as { response?: { status?: number, data?: { data?: { conflictData?: ThreeWayMergeData, message?: string } } } }
    if (httpError.response?.status === 409) {
      const conflictDataFromError = httpError.response?.data?.data?.conflictData
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
        description: httpError.response?.data?.data?.message || '请重试',
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
      commitMessage: pendingSubmissionData.value.commitMessage,
      baseVersionId: pendingSubmissionData.value.baseVersionId,
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
  catch (error: unknown) {
    console.error('Failed to submit after conflict resolution:', error)
    const httpError = error as { response?: { data?: { data?: { message?: string } } } }
    toast({
      title: '提交失败',
      description: httpError.response?.data?.data?.message || '请重试',
      variant: 'destructive',
    })
  }
}

/**
 * 进入基础信息编辑模式
 * 仅管理员可以双击进入编辑
 */
function enterEditBasicInfo() {
  if (!canManageBasicInfo.value || !page.value) {
    return
  }

  // 初始化表单数据
  basicInfoForm.value = {
    title: page.value.title || '',
    tags: page.value.tags || [],
    isReviewRequired: page.value.isReviewRequired ?? false,
  }
  newTagInput.value = ''
  isEditingBasicInfo.value = true
}

/**
 * 取消编辑基础信息
 */
function cancelEditBasicInfo() {
  isEditingBasicInfo.value = false
  basicInfoForm.value = {
    title: '',
    tags: [],
    isReviewRequired: false,
  }
  newTagInput.value = ''
}

/**
 * 添加标签
 */
function addTag() {
  const tag = newTagInput.value.trim()
  if (tag && !basicInfoForm.value.tags.includes(tag)) {
    basicInfoForm.value.tags.push(tag)
    newTagInput.value = ''
  }
}

/**
 * 移除标签
 */
function removeTag(index: number) {
  basicInfoForm.value.tags.splice(index, 1)
}

/**
 * 保存基础信息
 */
async function saveBasicInfo() {
  if (!page.value) {
    return
  }

  try {
    const title = basicInfoForm.value.title.trim()
    if (!title) {
      toast({
        title: '标题不能为空',
        variant: 'destructive',
      })
      return
    }

    await articleApi.updateBasicInfo(pageId.value, {
      title,
      tags: basicInfoForm.value.tags,
      isReviewRequired: basicInfoForm.value.isReviewRequired,
    })

    toast({
      title: '保存成功',
      description: '文章基础信息已更新',
    })

    // 刷新页面数据
    await loadPage()
    isEditingBasicInfo.value = false
  }
  catch (error: unknown) {
    console.error('Failed to update basic info:', error)
    const httpError = error as { response?: { data?: { data?: { message?: string } } } }
    toast({
      title: '保存失败',
      description: httpError.response?.data?.data?.message || '请重试',
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col overflow-hidden">
    <div class="w-full px-6 sm:px-8 lg:px-12 py-6 flex-1 overflow-hidden">
      <!-- 页面头部信息 - 始终显示，不受 loading 影响 -->
      <div v-if="page" class="relative h-full flex flex-col overflow-hidden">
        <!-- 主内容区域 -->
        <ResizablePanelGroup
          direction="horizontal"
          class="gap-6 h-full"
        >
          <!-- 左侧主内容 -->
          <ResizablePanel
            :default-size="showAiChat ? 65 : 100"
            :min-size="30"
          >
            <div class="space-y-6 w-full pr-6 h-full flex flex-col overflow-hidden">
              <!-- Page header -->
              <header class="space-y-4 shrink-0">
                <!-- 编辑模式 -->
                <div v-if="isEditingBasicInfo" class="space-y-4 border-2 border-amber-500 rounded-lg p-4 bg-amber-50">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-amber-900">
                      编辑基础信息
                    </h3>
                    <div class="flex items-center space-x-2">
                      <Button variant="outline" size="sm" @click="cancelEditBasicInfo">
                        <X class="h-4 w-4 mr-2" />
                        取消
                      </Button>
                      <Button size="sm" @click="saveBasicInfo">
                        <Save class="h-4 w-4 mr-2" />
                        保存
                      </Button>
                    </div>
                  </div>

                  <!-- 标题编辑 -->
                  <div>
                    <Label for="edit-title" class="text-sm font-medium">文章标题</Label>
                    <Input
                      id="edit-title"
                      v-model="basicInfoForm.title"
                      class="mt-1 text-2xl font-bold"
                      placeholder="输入文章标题"
                    />
                  </div>

                  <!-- 标签编辑 -->
                  <div>
                    <Label for="edit-tags" class="text-sm font-medium">标签</Label>
                    <div class="flex items-center gap-2 mt-1">
                      <Input
                        id="edit-tags"
                        v-model="newTagInput"
                        placeholder="输入新标签"
                        class="flex-1"
                        @keydown.enter.prevent="addTag"
                      />
                      <Button variant="outline" size="sm" @click="addTag">
                        添加
                      </Button>
                    </div>
                    <div v-if="basicInfoForm.tags.length" class="flex flex-wrap gap-2 mt-2">
                      <Badge
                        v-for="(tag, index) in basicInfoForm.tags"
                        :key="index"
                        variant="secondary"
                        class="cursor-pointer hover:bg-red-100"
                        @click="removeTag(index)"
                      >
                        {{ tag }}
                        <X class="h-3 w-3 ml-1" />
                      </Badge>
                    </div>
                  </div>

                  <!-- 审核设置 -->
                  <div class="flex items-center space-x-2">
                    <input
                      id="edit-review-required"
                      v-model="basicInfoForm.isReviewRequired"
                      type="checkbox"
                      class="w-4 h-4 text-amber-600 rounded"
                    >
                    <Label for="edit-review-required" class="text-sm cursor-pointer">
                      需要审核（勾选后其他用户的修改需要管理员审核）
                    </Label>
                  </div>
                </div>

                <!-- 普通显示模式 -->
                <div
                  v-else
                  class="space-y-4 group"
                  :class="{ 'cursor-pointer hover:bg-gray-50 rounded-lg p-4 -m-4 transition-all duration-200 border-2 border-transparent hover:border-gray-200': canManageBasicInfo }"
                  @dblclick="enterEditBasicInfo"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1 flex items-start gap-3">
                      <h1 class="text-3xl font-bold tracking-tight">
                        {{ page.title }}
                      </h1>
                      <div
                        v-if="canManageBasicInfo"
                        class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1"
                      >
                        <Badge variant="outline" class="text-xs gap-1">
                          <Edit2 class="h-3 w-3" />
                          双击编辑
                        </Badge>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <!-- 协作者管理按钮 -->
                      <TooltipWrapper v-if="canManageBasicInfo">
                        <Button
                          variant="outline"
                          size="sm"
                          class="flex items-center space-x-2"
                          @click="showCollaboratorsModal = true"
                        >
                          <Users class="h-4 w-4" />
                          <span>协作者</span>
                        </Button>
                        <template #tooltip>
                          <div class="text-xs max-w-[200px]">
                            <div class="font-medium mb-1">
                              管理协作者
                            </div>
                            <div class="text-muted-foreground">
                              添加或移除文章协作者
                            </div>
                          </div>
                        </template>
                      </TooltipWrapper>

                      <TooltipWrapper>
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
                        <template #tooltip>
                          <div class="text-xs max-w-[200px]">
                            <div class="font-medium mb-1">
                              智能助手
                            </div>
                            <div class="text-muted-foreground">
                              帮你总结、问答、改写文章内容
                            </div>
                          </div>
                        </template>
                      </TooltipWrapper>
                    </div>
                  </div>

                  <div class="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>最近编辑于 {{ formatDate(page?.lastEditedAt || '') }}</span>
                    <span>由 {{ page?.editor?.username || '未知' }}</span>
                    <span>{{ page?.viewCount ?? 0 }} 次阅读</span>
                    <FavoriteButton :article-id="Number(pageId)" />
                  </div>

                  <!-- 标签行 -->
                  <div v-if="page?.tags?.length || page?.isReviewRequired" class="flex flex-wrap items-center gap-2">
                    <Badge
                      v-for="tag in (page?.tags ?? [])"
                      :key="tag"
                      variant="secondary"
                    >
                      {{ tag }}
                    </Badge>
                    <TooltipWrapper v-if="page?.isReviewRequired">
                      <Badge
                        variant="outline"
                        class="border-amber-500 text-amber-700 cursor-help"
                      >
                        <Check class="h-3 w-3 mr-1" />
                        需要审核
                      </Badge>
                      <template #tooltip>
                        <div class="text-xs max-w-[220px]">
                          此文章开启了审核模式，其他用户的修改需要管理员批准后才能生效
                        </div>
                      </template>
                    </TooltipWrapper>
                  </div>

                  <div class="border-b" />
                </div>
              </header>

              <!-- Tab navigation + 内容区域 -->
              <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
                <Tabs
                  v-model="activeTab"
                  default-value="content"
                >
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

                  <!-- Content Tab（绿色区域：固定高度，内部滚动） -->
                  <TabsContent
                    v-if="activeTab === 'content'"
                    value="content"
                    class="mt-2 flex flex-col h-[calc(100vh-16rem)] overflow-hidden p-5"
                  >
                    <div v-if="loading" class="flex justify-center py-8">
                      <div class="text-muted-foreground">
                        加载中...
                      </div>
                    </div>
                    <div v-else-if="page" class="flex gap-8 h-full overflow-hidden">
                      <!-- 主要内容区域（蓝色区域）：自身不超出父容器，高度内滚动 -->
                      <div
                        ref="contentScrollRef"
                        class="flex-1 min-w-0 h-full overflow-y-auto pr-2"
                      >
                        <div class="py-4">
                          <ArticleContentCard :content="page?.content || ''" />
                        </div>
                      </div>

                      <!-- 右侧目录大纲（红色区域）：自身不超出父容器，内部列表滚动 -->
                      <div v-if="!showAiChat" class="hidden lg:block w-72 flex-shrink-0 h-full overflow-hidden">
                        <OutlineCard
                          :content="page?.content || ''"
                          :is-sidebar="true"
                          :scroll-container="contentScrollRef"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <!-- Edit Tab -->
                  <TabsContent
                    v-if="activeTab === 'edit'"
                    value="edit"
                    class="mt-2 flex flex-col h-[calc(100vh-16rem)] overflow-hidden p-5"
                  >
                    <div v-if="!isAuthenticated" class="flex items-center justify-center h-full">
                      <div class="text-center">
                        <p class="text-muted-foreground">
                          您需要登录才能编辑此页面
                        </p>
                        <Button class="mt-4" @click="showLoginPrompt">
                          登录
                        </Button>
                      </div>
                    </div>
                    <div v-else-if="page" class="h-full overflow-y-auto">
                      <ArticleEditCard :page="page" @save="handleSave" />
                    </div>
                  </TabsContent>

                  <!-- History Tab -->
                  <TabsContent
                    v-if="activeTab === 'history'"
                    value="history"
                    class="mt-2 flex flex-col h-[calc(100vh-16rem)] overflow-hidden p-5"
                  >
                    <div v-if="page" class="h-full overflow-y-auto">
                      <ArticleHistoryList :page-id="page.id" :versions="page.versions" />
                    </div>
                  </TabsContent>

                  <!-- Discussion Tab -->
                  <TabsContent
                    v-if="activeTab === 'discussion'"
                    value="discussion"
                    class="mt-2 flex flex-col h-[calc(100vh-16rem)] overflow-hidden p-5"
                  >
                    <div v-if="!isAuthenticated" class="flex items-center justify-center h-full">
                      <div class="text-center">
                        <p class="text-muted-foreground mb-4">
                          您需要登录才能发表评论
                        </p>
                        <Button @click="showLoginPrompt">
                          登录
                        </Button>
                      </div>
                    </div>
                    <div v-else-if="page" class="h-full overflow-y-auto">
                      <DiscussionThread
                        :article-id="Number(pageId)"
                        :current-user-id="currentUserId"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ResizablePanel>

          <!-- 拖动手柄 -->
          <ResizableHandle
            v-if="showAiChat"
            with-handle
            class="w-1.5"
          />

          <!-- 右侧AI对话栏 -->
          <ResizablePanel
            v-if="showAiChat"
            :default-size="35"
            :min-size="20"
            :max-size="50"
          >
            <div class="h-[calc(100vh-8rem)] sticky top-4">
              <AiChatSidebar
                :article-title="page.title"
                :article-content="page?.content || ''"
                @close="toggleAiChat"
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
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
            :can-review="true"
            :is-read-only="false"
            @resolve="handleConflictResolve"
          />
        </DialogContent>
      </Dialog>

      <!-- 协作者管理模态框 -->
      <ArticleCollaboratorsModal
        v-if="page"
        v-model:open="showCollaboratorsModal"
        :article-id="Number(page.id)"
        :article-title="page.title"
        :current-user-role="(page.currentUserRole as 'admin' | 'moderator' | null) ?? null"
        @success="loadPage"
      />
    </div>
  </div>
</template>
