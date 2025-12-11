<script setup lang="ts">
import type { Article, BreadcrumbItem, Module, ModuleModalState, ModuleTreeNode } from '@/types/module'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toast,
} from '@sse-wiki/ui'
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  FileText,
  Grid,
  List,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Users,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArticleCard from '@/components/common/ArticleCard.vue'
import OverflowText from '@/components/common/OverflowText.vue'
import { TooltipIconButton } from '@/components/common/tooltip'
import CollaboratorsModal from '@/components/layout/components/ModuleCollaboratorsModal.vue'
import DeleteModuleModal from '@/components/layout/components/ModuleDeleteModal.vue'
import CreateEditModuleModal from '@/components/layout/components/ModuleFormModal.vue'

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
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref<'created_at' | 'updated_at' | 'title'>('created_at')

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)
const totalArticles = ref(0)

// 模态框状态
const modalState = ref<ModuleModalState>({
  type: null,
  isOpen: false,
})

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
      console.error('获取模块信息失败:', apiError)
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
      console.error('获取面包屑导航失败:', apiError)
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
      // 如果API未实现，使用空数组作为默认值
      console.error('获取文章列表失败:', apiError)
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

function editModule() {
  if (!moduleInfo.value)
    return

  const moduleForModal = {
    ...moduleInfo.value,
    name: moduleInfo.value.module_name || moduleInfo.value.name,
  }

  modalState.value = {
    type: 'edit',
    isOpen: true,
    targetModule: moduleForModal,
  }
}

function manageCollaborators() {
  if (!moduleInfo.value)
    return

  // 确保模块对象有 name 字段（ModuleCollaboratorsModal 需要）
  const moduleForModal = {
    ...moduleInfo.value,
    name: moduleInfo.value.module_name || moduleInfo.value.name,
  }

  modalState.value = {
    type: 'collaborators',
    isOpen: true,
    targetModule: moduleForModal,
  }
}

function deleteModule() {
  if (!moduleInfo.value)
    return

  const moduleForModal = {
    ...moduleInfo.value,
    name: moduleInfo.value.module_name || moduleInfo.value.name,
  }

  modalState.value = {
    type: 'delete',
    isOpen: true,
    targetModule: moduleForModal,
  }
}

// 关闭模态框
function closeModal() {
  modalState.value = {
    type: null,
    isOpen: false,
  }
}

// 模态框操作成功后的处理
async function handleModalSuccess() {
  const currentType = modalState.value.type
  closeModal()

  // 对于删除操作，跳转到父模块
  if (currentType === 'delete') {
    // 如果有父模块，跳转到父模块，否则跳转到首页
    if (breadcrumbs.value.length > 1) {
      const parentModule = breadcrumbs.value[breadcrumbs.value.length - 2]
      if (parentModule) {
        router.push({
          name: 'ModuleDetail',
          params: { moduleId: parentModule.id },
        })
      }
    }
    else {
      router.push({ name: 'Home' })
    }
  }
  else {
    // 其他操作刷新当前页面
    await refreshData()
  }
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
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div v-if="isLoading" class="space-y-6 p-6">
      <div class="space-y-4">
        <Skeleton class="h-8 w-48" />
        <Skeleton class="h-6 w-3/4" />
        <div class="flex gap-4">
          <Skeleton class="h-10 w-32" />
          <Skeleton class="h-10 w-32" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card v-for="i in 6" :key="i">
          <CardHeader>
            <Skeleton class="h-6 w-full mb-2" />
            <Skeleton class="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton class="h-16 w-full mb-3" />
            <div class="flex gap-2">
              <Skeleton class="h-5 w-16" />
              <Skeleton class="h-5 w-16" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div v-else-if="error" class="flex items-center justify-center min-h-96 p-6">
      <Alert variant="destructive" class="max-w-lg">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>加载模块失败</AlertTitle>
        <AlertDescription class="mt-2 space-y-3">
          <p>{{ error }}</p>
          <Button variant="outline" size="sm" class="gap-2" @click="refreshData">
            <RefreshCw class="h-4 w-4" />
            重试
          </Button>
        </AlertDescription>
      </Alert>
    </div>

    <div v-else class="space-y-6">
      <div class="space-y-4">
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

        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="flex-1">
            <h1 class="text-3xl font-bold text-gray-900 mb-3">
              {{ moduleInfo?.module_name }}
            </h1>

            <p v-if="moduleInfo?.description" class="text-gray-700 mb-4">
              {{ moduleInfo.description }}
            </p>
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

          <div class="flex gap-3">
            <Button
              class="flex items-center gap-2"
              @click="createArticle"
            >
              <Plus class="w-4 h-4" />
              新建文章
            </Button>

            <DropdownMenu v-if="canManageModule">
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="flex items-center gap-2">
                  <Settings class="w-4 h-4" />
                  模块管理
                  <ChevronDown class="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-48">
                <DropdownMenuItem title="需要 Moderator 或更高权限" @click="editModule">
                  <Edit2 class="mr-2 w-4 h-4" />
                  <span>编辑模块</span>
                </DropdownMenuItem>
                <DropdownMenuItem title="管理可以访问此模块的用户" @click="manageCollaborators">
                  <Users class="mr-2 w-4 h-4" />
                  <span>管理协作者</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem title="删除此模块及其所有子模块和文章（不可恢复）" class="text-destructive focus:text-destructive" @click="deleteModule">
                  <Trash2 class="mr-2 w-4 h-4" />
                  <span>删除模块</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 class="text-xl font-semibold text-gray-900">
            文章列表
          </h2>
          <div class="flex items-center gap-3">
            <div class="flex bg-gray-100 rounded-lg p-1">
              <TooltipIconButton
                :icon="Grid"
                tooltip="网格视图"
                :variant="viewMode === 'grid' ? 'default' : 'ghost'"
                size="sm"
                @click="viewMode = 'grid'"
              />
              <TooltipIconButton
                :icon="List"
                tooltip="列表视图"
                :variant="viewMode === 'list' ? 'default' : 'ghost'"
                size="sm"
                @click="viewMode = 'list'"
              />
            </div>

            <Select v-model="sortBy">
              <SelectTrigger class="w-[140px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">
                  按创建时间
                </SelectItem>
                <SelectItem value="updated_at">
                  按更新时间
                </SelectItem>
                <SelectItem value="title">
                  按标题
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div v-if="articlesLoading" :class="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'">
          <Card v-for="i in 6" :key="i">
            <CardHeader>
              <Skeleton class="h-6 w-full mb-2" />
              <Skeleton class="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton class="h-16 w-full mb-3" />
              <div class="flex gap-2">
                <Skeleton class="h-5 w-16" />
                <Skeleton class="h-5 w-16" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Empty v-else-if="articles.length === 0" class="py-12">
          <EmptyMedia variant="icon">
            <FileText class="h-8 w-8" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>该模块下暂无文章</EmptyTitle>
            <EmptyDescription>
              开始创建第一篇文章来分享知识吧！
            </EmptyDescription>
          </EmptyHeader>
          <Button class="mt-4" @click="createArticle">
            <Plus class="w-4 h-4 mr-2" />
            创建文章
          </Button>
        </Empty>

        <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ArticleCard
            v-for="article in sortedArticles"
            :key="article.id"
            :article="{
              id: article.id,
              title: article.title,
              summary: article.summary,
              tags: article.tags,
              createdAt: article.created_at,
              updatedAt: article.updated_at,
              viewCount: article.view_count,
              author: article.author,
            }"
            :show-view-count="true"
            :show-tags="true"
            :show-author="true"
          />
        </div>

        <div v-else class="space-y-4">
          <ArticleCard
            v-for="article in sortedArticles"
            :key="article.id"
            :article="{
              id: article.id,
              title: article.title,
              summary: article.summary,
              tags: article.tags,
              createdAt: article.created_at,
              updatedAt: article.updated_at,
              viewCount: article.view_count,
              author: article.author,
            }"
            :show-view-count="true"
            :show-tags="true"
            :show-author="true"
          />
        </div>

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

    <!-- 模态框组件 -->
    <CreateEditModuleModal
      :modal-state="modalState"
      @close="closeModal"
      @success="handleModalSuccess"
    />

    <DeleteModuleModal
      :modal-state="modalState"
      @close="closeModal"
      @success="handleModalSuccess"
    />

    <CollaboratorsModal
      :modal-state="modalState"
      @close="closeModal"
      @success="handleModalSuccess"
    />
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
