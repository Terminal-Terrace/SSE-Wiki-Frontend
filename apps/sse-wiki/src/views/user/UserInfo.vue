<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import articleApi from '@/services/articleApi'
import { useAuthStore } from '@/stores/auth'

const { user, checkLoginStatus } = useAuthStore()
const router = useRouter()

const avatarError = ref(false)

watch(() => user?.avatar, () => {
  avatarError.value = false
})

interface Article {
  id: number
  title: string
  module: string
  createdAt: string
  updatedAt: string
  viewCount: number
  contentPreview: string
}

// 替换模拟数据为接口数据
const articles = ref<Article[]>([])

// 获取用户收藏的文章
async function loadFavourites() {
  try {
    if (!user?.id) {
      articles.value = []
      return
    }
    const data = await articleApi.getUserFavourites(user.id)
    console.log(data)

    // 为空的情况
    const list = Array.isArray(data?.articles) ? data.articles : []
    if (list.length === 0) {
      articles.value = []
      return
    }

    // 有信息的情况：解析 data.articles 中的 article
    articles.value = list
      .map((item: any) => item?.article)
      .filter((a: any) => !!a)
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        module: String(a.module_id ?? ''),
        createdAt: a.created_at ?? '',
        updatedAt: a.updated_at ?? '',
        viewCount: a.view_count ?? 0,
        contentPreview: toTextPreview(a.content ?? ''),
      }))
  }
  catch {
    articles.value = []
  }
}

// 从 HTML 内容生成文本预览
function toTextPreview(html: string, maxLen = 80): string {
  if (!html)
    return ''

  // Use DOMParser to safely extract text content without regex
  let text = ''
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    // Remove script and style elements
    doc.querySelectorAll('script, style').forEach(el => el.remove())
    text = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim()
  }
  catch {
    // Fallback: minimal strip of tags if DOMParser fails
    text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text
}

function handleArticleClick(article: Article) {
  router.push(`/articles/${article.id}`)
}

onMounted(() => {
  checkLoginStatus()
  loadFavourites()
})
</script>

<template>
  <div class="bg-white min-h-screen text-gray-800 p-4 sm:p-6 md:p-8">
    <div class="max-w-7xl mx-auto">
      <!-- 用户信息卡片 -->
      <div class="bg-gray-50 rounded-2xl shadow-lg p-6 md:p-8 mb-10 flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
        <div v-if="user?.avatar && !avatarError" class="w-24 h-24 rounded-full overflow-hidden shadow-md">
          <img
            :src="user.avatar"
            alt="avatar"
            class="w-full h-full object-cover"
            @error="avatarError = true"
            @load="avatarError = false"
          >
        </div>
        <div v-else class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl font-bold text-gray-700 shadow-md">
          {{ user?.username.charAt(0).toUpperCase() }}
        </div>

        <div class="text-center sm:text-left">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900">
            {{ user?.username }}
          </h1>
          <p class="text-gray-600 mt-2">
            {{ user?.email }}
          </p>
          <p class="text-gray-500 text-sm mt-1">
            身份： {{ user?.role }}
          </p>
        </div>
      </div>

      <!-- 收藏列表 -->
      <div>
        <h2 class="text-2xl md:text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-3">
          我的收藏
        </h2>

        <!-- 空状态 -->
        <div v-if="articles.length === 0" class="text-gray-500 text-sm">
          暂无收藏
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- 文章卡片 -->
          <div
            v-for="article in articles"
            :key="article.id"
            class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            @click="handleArticleClick(article)"
          >
            <div class="p-5">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                {{ article.title }}
              </h3>

              <!-- 内容预览 -->
              <p class="text-sm text-gray-600 mb-3">
                {{ article.contentPreview }}
              </p>

              <div class="flex items-center text-xs text-gray-500 mb-3 space-x-4">
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>{{ article.module }}</span>
                </div>
              </div>

              <div class="text-xs text-gray-500 space-y-2">
                <p>创建于: {{ article.createdAt }}</p>
                <p>更新于: {{ article.updatedAt }}</p>
              </div>
              <div class="mt-4 pt-4 border-t border-gray-200 flex justify-end items-center">
                <span class="text-sm text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {{ article.viewCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
