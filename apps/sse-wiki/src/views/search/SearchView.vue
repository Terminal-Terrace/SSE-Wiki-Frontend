<script setup lang="ts">
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  Skeleton,
} from '@sse-wiki/ui'
import { FileText, Search } from 'lucide-vue-next'
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const isLoading = ref(false)
const searchResults = ref<any[]>([])

// 从 URL 获取搜索关键词
onMounted(() => {
  const queryParam = route.query.q as string
  if (queryParam) {
    searchQuery.value = queryParam
    performSearch()
  }
})

// 监听路由查询参数变化
watch(() => route.query.q, (newQuery) => {
  if (newQuery && typeof newQuery === 'string') {
    searchQuery.value = newQuery
    performSearch()
  }
})

const hasSearched = ref(false)

// 执行搜索（目前是模拟，需要对接后端 API）
async function performSearch() {
  if (!searchQuery.value.trim())
    return

  isLoading.value = true
  hasSearched.value = true

  try {
    // TODO: 对接后端搜索 API
    // const results = await articleApi.search(searchQuery.value)
    // searchResults.value = results

    // 模拟搜索延迟
    await new Promise(resolve => setTimeout(resolve, 800))

    // 模拟搜索结果（实际应该从API获取）
    searchResults.value = []
  }
  catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  }
  finally {
    isLoading.value = false
  }
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({
      name: 'search',
      query: { q: searchQuery.value },
    })
  }
}

function goToArticle(articleId: number) {
  router.push({
    name: 'ArticleDetail',
    params: { articleId },
  })
}

// 热门搜索词（可以从后端获取）
const hotSearches = ['用户手册', 'API 文档', '快速开始', '常见问题']
</script>

<template>
  <section class="space-y-6">
    <!-- 搜索头部 -->
    <header class="space-y-4">
      <h1 class="text-3xl font-semibold tracking-tight text-foreground">
        全局搜索
      </h1>

      <!-- 搜索框 -->
      <div class="flex gap-2">
        <div class="relative flex-1 max-w-2xl">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="搜索文章、模块..."
            class="pl-10 pr-4 h-12 text-base"
            @keydown.enter="handleSearch"
          />
        </div>
        <Button size="lg" @click="handleSearch">
          搜索
        </Button>
      </div>

      <!-- 热门搜索 -->
      <div v-if="!hasSearched" class="flex items-center gap-2 flex-wrap">
        <span class="text-sm text-muted-foreground">热门搜索：</span>
        <Button
          v-for="keyword in hotSearches"
          :key="keyword"
          variant="outline"
          size="sm"
          @click="searchQuery = keyword; handleSearch()"
        >
          {{ keyword }}
        </Button>
      </div>
    </header>

    <!-- 搜索结果 -->
    <div v-if="hasSearched" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-muted-foreground">
          {{ isLoading ? '搜索中...' : `找到 ${searchResults.length} 个结果` }}
        </p>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="space-y-4">
        <Card v-for="i in 3" :key="i">
          <CardHeader>
            <Skeleton class="h-6 w-3/4 mb-2" />
            <Skeleton class="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton class="h-16 w-full" />
          </CardContent>
        </Card>
      </div>

      <!-- 空结果 -->
      <Empty v-else-if="searchResults.length === 0" class="py-12">
        <EmptyMedia variant="icon">
          <Search class="h-8 w-8" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>未找到相关结果</EmptyTitle>
          <EmptyDescription>
            尝试使用不同的关键词或检查拼写
          </EmptyDescription>
        </EmptyHeader>
        <div class="mt-4 text-sm text-muted-foreground">
          <p class="mb-2">
            💡 搜索建议：
          </p>
          <ul class="list-disc list-inside space-y-1 text-left">
            <li>使用更通用的关键词</li>
            <li>检查关键词拼写</li>
            <li>尝试搜索相关主题</li>
          </ul>
        </div>
      </Empty>

      <!-- 搜索结果列表 -->
      <div v-else class="space-y-4">
        <Card
          v-for="article in searchResults"
          :key="article.id"
          class="hover:shadow-md transition-shadow cursor-pointer"
          @click="goToArticle(article.id)"
        >
          <CardHeader>
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <CardTitle class="text-lg mb-2">
                  {{ article.title }}
                </CardTitle>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText class="w-4 h-4" />
                  <span>{{ article.module_name }}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <CardDescription class="line-clamp-2">
              {{ article.summary }}
            </CardDescription>

            <!-- 标签 -->
            <div v-if="article.tags && article.tags.length > 0" class="flex flex-wrap gap-2">
              <Badge
                v-for="tag in article.tags"
                :key="tag"
                variant="secondary"
                class="text-xs"
              >
                {{ tag }}
              </Badge>
            </div>

            <div class="flex items-center gap-2 pt-2 border-t">
              <Avatar size="sm" class="h-6 w-6">
                <AvatarFallback class="text-xs">
                  {{ (article.author?.username?.charAt(0) || 'U').toUpperCase() }}
                </AvatarFallback>
              </Avatar>
              <span class="text-xs text-muted-foreground">
                {{ article.author?.username || '未知作者' }}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- 初始状态提示 -->
    <Card v-else class="border-dashed">
      <CardContent class="pt-6">
        <div class="text-center space-y-3">
          <Search class="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 class="font-medium mb-1">
              开始搜索
            </h3>
            <p class="text-sm text-muted-foreground">
              输入关键词搜索文章、模块和内容
            </p>
          </div>
          <div class="text-xs text-muted-foreground pt-2">
            <p>提示：使用 <kbd class="px-2 py-1 bg-muted rounded">Ctrl</kbd> + <kbd class="px-2 py-1 bg-muted rounded">K</kbd> 快速打开搜索</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

kbd {
  font-family: monospace;
  font-size: 0.75rem;
}
</style>
