<script setup lang="ts">
import type { ArticleCardData } from '@/components/common/ArticleCard.vue'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
  Separator,
  Skeleton,
  toast,
} from '@sse-wiki/ui'
import { Camera, Heart, Loader2, Mail, User } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import ArticleCard from '@/components/common/ArticleCard.vue'
import articleApi from '@/services/articleApi'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorite'
import { uploadFile } from '@/utils/fileUpload'
import { getAvatarFallback } from '@/utils/format'

const authStore = useAuthStore()
const favoriteStore = useFavoriteStore()

const user = computed(() => authStore.user)
const avatarError = ref(false)
const loading = ref(false)
const uploadingAvatar = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

watch(() => user.value?.avatar, () => {
  avatarError.value = false
})

// 收藏的文章列表
const articles = ref<ArticleCardData[]>([])

// 获取用户收藏的文章
async function loadFavourites() {
  loading.value = true
  try {
    if (!user.value?.id) {
      articles.value = []
      return
    }
    const data = await articleApi.getUserFavourites(user.value.id)

    const list = Array.isArray(data?.articles) ? data.articles : []
    if (list.length === 0) {
      articles.value = []
      return
    }

    const articleIds: number[] = []
    articles.value = list
      .filter((a: any) => !!a)
      .map((a: any) => {
        articleIds.push(a.id)
        return {
          id: a.id,
          title: a.title,
          summary: a.summary,
          module: String(a.module_id ?? ''),
          createdAt: a.created_at ?? '',
          updatedAt: a.updated_at ?? '',
          viewCount: a.view_count ?? 0,
          contentPreview: toTextPreview(a.content ?? ''),
        }
      })

    favoriteStore.favoriteIds = new Set(articleIds)
  }
  catch {
    articles.value = []
  }
  finally {
    loading.value = false
  }
}

function handleArticleRemoved(articleId: number) {
  articles.value = articles.value.filter(a => a.id !== articleId)
}

function toTextPreview(html: string, maxLen = 80): string {
  if (!html)
    return ''
  let text = ''
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    doc.querySelectorAll('script, style').forEach(el => el.remove())
    text = (doc.body?.textContent || '').replace(/\s+/g, ' ').trim()
  }
  catch {
    text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text
}

// 头像上传
function triggerAvatarUpload() {
  fileInputRef.value?.click()
}

async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return

  if (!file.type.startsWith('image/')) {
    toast({ title: '请选择图片文件', variant: 'destructive' })
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    toast({ title: '图片大小不能超过 5MB', variant: 'destructive' })
    return
  }

  uploadingAvatar.value = true
  try {
    const fileInfo = await uploadFile(file)
    await authStore.updateProfile({ avatar: fileInfo.fileUrl })
    toast({ title: '头像更新成功' })
  }
  catch (err: any) {
    toast({
      title: '上传失败',
      description: err.message || '请稍后重试',
      variant: 'destructive',
    })
  }
  finally {
    uploadingAvatar.value = false
    input.value = ''
  }
}

const userInitial = computed(() => getAvatarFallback(user.value?.username))

const roleDisplay = computed(() => {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    teacher: '教师',
    student: '学生',
  }
  return roleMap[user.value?.role || ''] || user.value?.role || '用户'
})

const roleBadgeVariant = computed(() => {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    admin: 'destructive',
    teacher: 'default',
    student: 'secondary',
  }
  return variantMap[user.value?.role || ''] || 'outline'
})

onMounted(() => {
  authStore.checkLoginStatus()
  loadFavourites()
})
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="space-y-6 p-6">
      <!-- 用户信息卡片 -->
      <Card>
        <CardHeader>
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <!-- 头像区域 -->
            <div class="relative group">
              <Avatar class="h-24 w-24">
                <AvatarImage
                  v-if="user?.avatar && !avatarError"
                  :src="user.avatar"
                  :alt="user?.username"
                  class="object-cover"
                  @error="avatarError = true"
                />
                <AvatarFallback class="text-2xl font-semibold">
                  {{ userInitial }}
                </AvatarFallback>
              </Avatar>

              <!-- 上传按钮 -->
              <Button
                variant="secondary"
                size="icon"
                class="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                :disabled="uploadingAvatar"
                @click="triggerAvatarUpload"
              >
                <Loader2 v-if="uploadingAvatar" class="h-4 w-4 animate-spin" />
                <Camera v-else class="h-4 w-4" />
              </Button>

              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleAvatarChange"
              >
            </div>

            <!-- 用户信息 -->
            <div class="flex-1 text-center sm:text-left space-y-2">
              <CardTitle class="text-2xl">
                {{ user?.username }}
              </CardTitle>
              <CardDescription class="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <span class="flex items-center gap-1">
                  <Mail class="h-4 w-4" />
                  {{ user?.email }}
                </span>
                <span class="flex items-center gap-1">
                  <User class="h-4 w-4" />
                  <Badge :variant="roleBadgeVariant">
                    {{ roleDisplay }}
                  </Badge>
                </span>
              </CardDescription>
            </div>

            <!-- 统计信息 -->
            <div class="text-center px-6 py-2 border rounded-lg">
              <div class="text-2xl font-bold">
                {{ articles.length }}
              </div>
              <div class="text-sm text-muted-foreground">
                收藏文章
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Separator />

      <!-- 收藏列表区域 -->
      <div class="space-y-4">
        <!-- 标题 -->
        <div class="flex items-center gap-2">
          <Heart class="h-5 w-5 text-red-500" />
          <h2 class="text-xl font-semibold">
            我的收藏
          </h2>
        </div>

        <!-- 加载骨架屏 -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card v-for="i in 6" :key="i">
            <CardHeader>
              <Skeleton class="h-6 w-3/4 mb-2" />
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

        <!-- 空状态 -->
        <Empty v-else-if="articles.length === 0" class="py-12">
          <EmptyMedia variant="icon">
            <Heart class="h-8 w-8 text-muted-foreground" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>还没有收藏任何文章</EmptyTitle>
            <EmptyDescription>
              浏览文章时点击 ❤️ 按钮，即可将文章添加到收藏
            </EmptyDescription>
          </EmptyHeader>
          <Button class="mt-4" as="a" href="/">
            去发现好文章
          </Button>
        </Empty>

        <!-- 文章列表 -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ArticleCard
            v-for="article in articles"
            :key="article.id"
            :article="article"
            :show-view-count="true"
            :show-tags="false"
            @removed="handleArticleRemoved"
          />
        </div>
      </div>
    </div>
  </div>
</template>
