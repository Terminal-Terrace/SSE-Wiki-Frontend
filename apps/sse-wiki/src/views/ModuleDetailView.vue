<script setup lang="ts">
import type { Article, BreadcrumbItem, Module, ModuleTreeNode } from '@/types/module'
import { Button, toast } from '@sse-wiki/ui'
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  FileText,
  Grid,
  List,
  Plus,
  Settings,
  Trash2,
  Users,
} from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OverflowText from '@/components/common/OverflowText.vue'
import { useLoginRedirect } from '@/composables/useLoginRedirect'
import { moduleApi } from '@/services/moduleApi'
import { useAuthStore } from '@/stores/auth'

import { useModuleStore } from '@/stores/module'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const moduleStore = useModuleStore()
const { startLogin } = useLoginRedirect()

// 响应式状态
const isLoading = ref(false)
const articlesLoading = ref(false)
const error = ref<string | null>(null)
const moduleInfo = ref<Module | null>(null)
const articles = ref<Article[]>([])
const breadcrumbs = ref<BreadcrumbItem[]>([])
const showManageMenu = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref<'created_at' | 'updated_at' | 'title'>('created_at')

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)
const totalArticles = ref(0)

// 计算属性
const totalPages = computed(() => Math.ceil(totalArticles.value / pageSize.value))

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: number[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  }
  else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push(-1, total) // -1 表示省略号
    }
    else if (current >= total - 3) {
      pages.push(1, -1)
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    }
    else {
      pages.push(1, -1)
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push(-1, total)
    }
  }

  return pages
})

const sortedArticles = computed(() => {
  const sorted = [...articles.value]
  sorted.sort((a, b) => {
    switch (sortBy.value) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'updated_at':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })
  return sorted
})

const canManageModule = computed(() => {
  // 基于用户登录状态控制模块管理权限
  return authStore.isAuthenticated
})

// 辅助函数：在模块树中查找指定ID的模块
function findModuleInTree(tree: ModuleTreeNode[], targetId: number): ModuleTreeNode | null {
  for (const node of tree) {
    if (node.id === targetId) {
      return node
    }
    if (node.children) {
      const found = findModuleInTree(node.children, targetId)
      if (found)
        return found
    }
  }
  return null
}

// 辅助函数：构建面包屑路径
function buildBreadcrumbs(tree: ModuleTreeNode[], targetId: number, path: BreadcrumbItem[] = []): BreadcrumbItem[] | null {
  for (const node of tree) {
    const currentPath = [...path, { id: node.id, name: node.name }]

    if (node.id === targetId) {
      return currentPath
    }

    if (node.children) {
      const found = buildBreadcrumbs(node.children, targetId, currentPath)
      if (found)
        return found
    }
  }
  return null
}

// 获取模块信息
async function fetchModuleInfo(moduleId: string) {
  try {
    // 首先尝试从API获取模块信息
    try {
      const module = await moduleApi.getModule(moduleId)
      moduleInfo.value = module
      return
    }
    catch (apiError) {
      console.warn('API获取模块信息失败，使用模块树备用方案:', apiError)
    }

    // API失败时的备用方案：从模块树中查找
    // 确保模块树已加载
    if (moduleStore.moduleTree.length === 0) {
      await moduleStore.fetchModules()
    }

    // 从模块树中查找目标模块
    const targetModuleId = Number.parseInt(moduleId)
    const foundModule = findModuleInTree(moduleStore.moduleTree, targetModuleId)

    if (foundModule) {
      // 使用找到的模块数据
      moduleInfo.value = {
        id: foundModule.id,
        module_name: foundModule.name,
        description: foundModule.description ?? '',
        parent_id: 1, // TODO: 从模块树结构中获取正确的parent_id
        owner_id: foundModule.owner_id,
        created_at: '2024-01-15T08:00:00Z', // TODO: 从API获取实际时间
        updated_at: '2024-01-15T08:00:00Z', // TODO: 从API获取实际时间
      }
    }
    else {
      // 如果在模块树中找不到，抛出错误
      throw new Error(`未找到ID为 ${moduleId} 的模块`)
    }
  }
  catch (err) {
    throw new Error(`获取模块信息失败, ${String(err)}`)
  }
}

// 获取面包屑导航
async function fetchBreadcrumbs(moduleId: string) {
  try {
    // 首先尝试从API获取面包屑
    try {
      const breadcrumbsData = await moduleApi.getBreadcrumbs(moduleId)
      breadcrumbs.value = breadcrumbsData
      return
    }
    catch (apiError) {
      console.warn('API获取面包屑失败，使用模块树备用方案:', apiError)
    }

    // API失败时的备用方案：从模块树中构建面包屑
    // 确保模块树已加载
    if (moduleStore.moduleTree.length === 0) {
      await moduleStore.fetchModules()
    }

    // 从模块树中构建面包屑
    const targetModuleId = Number.parseInt(moduleId)
    const breadcrumbPath = buildBreadcrumbs(moduleStore.moduleTree, targetModuleId)

    if (breadcrumbPath) {
      breadcrumbs.value = breadcrumbPath
    }
    else {
      // 如果找不到路径，使用默认面包屑
      breadcrumbs.value = [
        { id: Number.parseInt(moduleId), name: `模块 ${moduleId}` },
      ]
    }
  }
  catch (err) {
    console.error('获取面包屑导航失败:', err)
  }
}

// 获取文章列表
async function fetchArticles(moduleId: string, page = 1) {
  try {
    articlesLoading.value = true

    // 尝试从API获取文章列表
    try {
      const response = await moduleApi.getArticles(moduleId, { page, pageSize: pageSize.value })
      articles.value = response.articles
      totalArticles.value = response.total
    }
    catch (apiError) {
      console.warn('API获取文章列表失败，可能后端未实现此接口:', apiError)
      // 如果API未实现，使用空数组作为默认值
      articles.value = []
      totalArticles.value = 0
    }
  }
  catch (err) {
    throw new Error(`获取文章列表失败, ${String(err)}`)
  }
  finally {
    articlesLoading.value = false
  }
}

// 刷新数据
async function refreshData() {
  const moduleId = route.params.moduleId as string
  if (!moduleId)
    return

  try {
    isLoading.value = true
    error.value = null

    await Promise.all([
      fetchModuleInfo(moduleId),
      fetchBreadcrumbs(moduleId),
      fetchArticles(moduleId, currentPage.value),
    ])
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
  }
  finally {
    isLoading.value = false
  }
}

// 页面切换
function changePage(page: number) {
  if (page < 1 || page > totalPages.value)
    return
  currentPage.value = page
  fetchArticles(route.params.moduleId as string, page)
}

// 操作方法
async function createArticle() {
  // 检查登录状态
  if (!authStore.isAuthenticated) {
    toast({
      title: '请先登录',
      description: '登录后才能创建文章',
      variant: 'destructive',
    })
    // 延迟一下让用户看到提示，然后跳转登录
    setTimeout(() => {
      startLogin()
    }, 1000)
    return
  }

  router.push({
    name: 'ArticleCreate',
    query: { moduleId: route.params.moduleId },
  })
}

function goToArticle(articleId: number) {
  router.push({
    name: 'ArticleDetail',
    params: { articleId },
  })
}

function editArticle(articleId: number) {
  router.push({
    name: 'ArticleEditor',
    params: { articleId },
  })
}

function editModule() {
  // TODO: 触发编辑模块模态框
  showManageMenu.value = false
}

function manageCollaborators() {
  // TODO: 触发协作者管理模态框
  showManageMenu.value = false
}

function deleteModule() {
  // TODO: 触发删除确认模态框
  showManageMenu.value = false
}

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 点击外部关闭管理菜单
function handleClickOutside(event: MouseEvent) {
  if (showManageMenu.value && !(event.target as Element)?.closest('.module-actions')) {
    showManageMenu.value = false
  }
}

// 监听路由变化
watch(
  () => route.params.moduleId,
  (newModuleId) => {
    if (newModuleId) {
      currentPage.value = 1 // 重置页码
      refreshData()
    }
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-96 space-y-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span class="text-gray-600">加载模块信息...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex flex-col items-center justify-center min-h-96 space-y-4">
      <div class="text-center">
        <h3 class="text-lg font-semibold text-red-600 mb-2">
          加载失败
        </h3>
        <p class="text-gray-600 mb-4">
          {{ error }}
        </p>
        <Button variant="outline" @click="refreshData">
          重试
        </Button>
      </div>
    </div>

    <!-- 模块详情内容 -->
    <div v-else class="space-y-6">
      <!-- 页面头部 -->
      <div class="space-y-4">
        <!-- 面包屑导航  -->
        <nav class="h-6 flex items-center space-x-2 text-base text-gray-600">
          <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
            <router-link
              :to="{ name: 'ModuleDetail', params: { moduleId: crumb.id } }"
              :class="{ 'text-gray-900 font-medium': index === breadcrumbs.length - 1 }"
              class="flex items-center hover:text-gray-900 transition-colors"
            >
              <OverflowText
                :text="crumb.name"
                max-width="250px"
                tooltip-max-width="250px"
                placement="bottom"
              />
            </router-link>
            <ChevronRight
              v-if="index < breadcrumbs.length - 1"
              class="w-4 h-4 flex-shrink-0"
            />
          </template>
        </nav>

        <!-- 模块标题和操作按钮 -->
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="flex-1">
            <!-- 模块标题 -->
            <h1 class="text-3xl font-bold text-gray-900 mb-3">
              {{ moduleInfo?.module_name }}
            </h1>

            <!-- 模块描述 -->
            <p v-if="moduleInfo?.description" class="text-gray-700 mb-4">
              {{ moduleInfo.description }}
            </p>

            <!-- 模块统计信息 -->
            <div v-if="moduleInfo" class="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div class="flex items-center gap-2">
                <FileText class="w-4 h-4" />
                <span>{{ articles.length }} 篇文章</span>
              </div>
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4" />
                <span>创建于 {{ formatDate(moduleInfo.created_at) }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-3">
            <Button
              class="flex items-center gap-2"
              @click="createArticle"
            >
              <Plus class="w-4 h-4" />
              新建文章
            </Button>

            <!-- 模块管理按钮 (仅有权限用户可见) -->
            <div v-if="canManageModule" class="relative module-actions">
              <Button variant="outline" class="flex items-center gap-2" @click="showManageMenu = !showManageMenu">
                <Settings class="w-4 h-4" />
                模块管理
                <ChevronDown class="w-4 h-4" />
              </Button>

              <!-- 管理菜单 -->
              <div v-if="showManageMenu" class="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div class="p-1">
                  <button class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors" @click="editModule">
                    <Edit2 class="w-4 h-4" />
                    <span>编辑模块</span>
                  </button>
                  <button class="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors" @click="manageCollaborators">
                    <Users class="w-4 h-4" />
                    <span>管理协作者</span>
                  </button>
                  <div class="border-t border-gray-100 my-1" />
                  <button class="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors" @click="deleteModule">
                    <Trash2 class="w-4 h-4" />
                    <span>删除模块</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文章列表 -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 class="text-xl font-semibold text-gray-900">
            文章列表
          </h2>
          <div class="flex items-center gap-3">
            <!-- 视图切换 -->
            <div class="flex bg-gray-100 rounded-lg p-1">
              <Button
                :variant="viewMode === 'grid' ? 'default' : 'ghost'"
                size="sm"
                class="px-3 py-1"
                @click="viewMode = 'grid'"
              >
                <Grid class="w-4 h-4" />
              </Button>
              <Button
                :variant="viewMode === 'list' ? 'default' : 'ghost'"
                size="sm"
                class="px-3 py-1"
                @click="viewMode = 'list'"
              >
                <List class="w-4 h-4" />
              </Button>
            </div>

            <!-- 排序选择 -->
            <select v-model="sortBy" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="created_at">
                按创建时间
              </option>
              <option value="updated_at">
                按更新时间
              </option>
              <option value="title">
                按标题
              </option>
            </select>
          </div>
        </div>

        <!-- 文章列表内容 -->
        <div v-if="articlesLoading" class="flex flex-col items-center justify-center py-12 space-y-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span class="text-gray-600">加载文章...</span>
        </div>

        <div v-else-if="articles.length === 0" class="text-center py-12">
          <div class="space-y-4">
            <FileText class="w-12 h-12 text-gray-400 mx-auto" />
            <h3 class="text-lg font-medium text-gray-900">
              该模块下暂无文章
            </h3>
            <p class="text-gray-600">
              开始创建第一篇文章来分享知识吧！
            </p>
            <Button class="flex items-center gap-2" @click="createArticle">
              <Plus class="w-4 h-4" />
              创建文章
            </Button>
          </div>
        </div>

        <!-- 网格视图 -->
        <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article
            v-for="article in sortedArticles"
            :key="article.id"
            class="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            @click="goToArticle(article.id)"
          >
            <div class="p-6">
              <div class="flex items-start justify-between mb-3">
                <h3 class="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                  {{ article.title }}
                </h3>
                <time class="text-sm text-gray-500 ml-3">{{ formatDate(article.created_at) }}</time>
              </div>
              <p class="text-gray-600 text-sm line-clamp-3 mb-4">
                {{ article.summary }}
              </p>
              <!-- 标签 -->
              <div v-if="article.tags && article.tags.length > 0" class="flex flex-wrap gap-2 mb-4">
                <span
                  v-for="tag in article.tags"
                  :key="tag"
                  class="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md"
                >
                  {{ tag }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {{ article.author?.username?.charAt(0) || 'U' }}
                  </div>
                  <span class="text-sm text-gray-700">{{ article.author?.username || '未知作者' }}</span>
                </div>
                <Button size="sm" variant="ghost" class="p-1" @click.stop="editArticle(article.id)">
                  <Edit2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </article>
        </div>

        <!-- 列表视图 -->
        <div v-else class="space-y-4">
          <div
            v-for="article in sortedArticles"
            :key="article.id"
            class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            @click="goToArticle(article.id)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                  {{ article.title }}
                </h3>
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                  {{ article.summary }}
                </p>
                <!-- 标签 -->
                <div v-if="article.tags && article.tags.length > 0" class="flex flex-wrap gap-2 mb-3">
                  <span
                    v-for="tag in article.tags"
                    :key="tag"
                    class="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md"
                  >
                    {{ tag }}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span>{{ article.author?.username || '未知作者' }}</span>
                  <span>·</span>
                  <time>{{ formatDate(article.created_at) }}</time>
                  <span>·</span>
                  <span>最后更新 {{ formatDate(article.updated_at) }}</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" class="p-1" @click.stop="editArticle(article.id)">
                <Edit2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
          <Button
            :disabled="currentPage <= 1"
            variant="outline"
            size="sm"
            class="flex items-center gap-1"
            @click="changePage(currentPage - 1)"
          >
            <ChevronLeft class="w-4 h-4" />
            上一页
          </Button>

          <div class="flex items-center gap-1">
            <Button
              v-for="page in visiblePages"
              :key="page"
              :variant="page === currentPage ? 'default' : 'ghost'"
              size="sm"
              :disabled="page === -1"
              class="min-w-[2rem]"
              @click="changePage(page)"
            >
              {{ page === -1 ? '...' : page }}
            </Button>
          </div>

          <Button
            :disabled="currentPage >= totalPages"
            variant="outline"
            size="sm"
            class="flex items-center gap-1"
            @click="changePage(currentPage + 1)"
          >
            下一页
            <ChevronRight class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义 line-clamp 支持 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}
</style>
