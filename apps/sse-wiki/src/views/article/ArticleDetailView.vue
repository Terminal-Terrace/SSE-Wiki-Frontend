<script setup lang="ts">
import type { Page } from '@/types'
import { Badge, Button, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@sse-wiki/ui'
import { Bot, Edit } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AiChatSidebar from '@/components/AiChatSidebar.vue'
import ArticleContentCard from '@/components/ArticleContentCard.vue'
import ArticleDiscussionList from '@/components/ArticleDiscussionList.vue'
import ArticleEditCard from '@/components/ArticleEditCard.vue'
import ArticleHistoryList from '@/components/ArticleHistoryList.vue'
import OutlineCard from '@/components/OutlineCard.vue'
import { mockApi } from '@/mock/data'
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

const loading = ref(true)
const page = ref<Page | null>(null)
const activeTab = ref('content')
const showAiChat = ref(false)

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

  await loadPage()
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

async function loadPage() {
  loading.value = true
  try {
    page.value = await mockApi.getPage(pageId.value)
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

function showLoginPrompt() {
  router.push('/login')
}

function toggleAiChat() {
  showAiChat.value = !showAiChat.value
}

async function handleSave(updatedPage: Partial<Page>) {
  if (!page.value)
    return

  try {
    const pageId = page.value.id ? String(page.value.id) : 'unknown'
    const content = updatedPage.content ?? page.value.content ?? ''
    const commitMessage = '内容更新'
    const editorId = page.value.editor?.id ? String(page.value.editor.id) : '1'

    const savedPage = await mockApi.savePageContent(pageId, content, commitMessage, editorId)
    if (savedPage) {
      page.value = savedPage
      activeTab.value = 'content'
    }
    else {
      alert('保存失败，请重试')
    }
  }
  catch (error) {
    console.error('Failed to save page:', error)
    alert('保存失败，请重试')
  }
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
              <TabsContent value="edit">
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
      <Button @click="$router.push('/')">
        返回首页
      </Button>
    </div>
  </div>
</template>
