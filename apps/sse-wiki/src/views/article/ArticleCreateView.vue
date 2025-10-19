<script setup lang="ts">
import type { CreateArticleRequest } from '@/types/article'
import type { Module } from '@/types/module'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, useToast } from '@sse-wiki/ui'
import { ArrowLeft, Loader2, Save } from 'lucide-vue-next'

import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ContentEditor from '@/components/common/editor/ContentEditor.vue'
import { useLoginRedirect } from '@/composables/useLoginRedirect'
import { articleApi } from '@/services/articleApi'
import { moduleApi } from '@/services/moduleApi'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const authStore = useAuthStore()
const { startLogin } = useLoginRedirect()

// 表单数据
const EMPTY_FORM: CreateArticleRequest = {
  title: '',
  module_id: 0,
  content: '',
  commit_message: '',
  is_review_required: false,
  tags: [],
}

const formData = ref<CreateArticleRequest>({ ...EMPTY_FORM })

// 模块信息
const moduleInfo = ref<Module | null>(null)

const pageTitle = computed(() => moduleInfo.value?.module_name || moduleInfo.value?.name || '未知模块')

// 标签输入
const tagInput = ref('')

// 加载状态
const isLoading = ref(false)
const isLoadingModule = ref(true)

// 验证
const trimmedTitle = computed(() => formData.value.title.trim())
const trimmedContent = computed(() => formData.value.content.trim())
const trimmedCommitMessage = computed(() => formData.value.commit_message.trim())

const canSubmit = computed(() => (
  trimmedTitle.value !== ''
  && trimmedContent.value !== ''
  && trimmedCommitMessage.value !== ''
  && formData.value.module_id > 0
))

// 初始化
onMounted(async () => {
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

  // 获取模块 ID
  const moduleIdParam = route.query.moduleId
  if (!moduleIdParam || (Array.isArray(moduleIdParam) && moduleIdParam.length === 0)) {
    toast({
      title: '缺少模块信息',
      description: '请从模块页面创建文章',
      variant: 'destructive',
    })
    router.back()
    return
  }

  const resolvedModuleId = Number.parseInt((Array.isArray(moduleIdParam) ? moduleIdParam[0] : moduleIdParam) ?? '')
  if (Number.isNaN(resolvedModuleId) || resolvedModuleId <= 0) {
    toast({
      title: '模块信息无效',
      description: '请重新从模块页面发起创建',
      variant: 'destructive',
    })
    router.back()
    return
  }

  formData.value.module_id = resolvedModuleId

  // 加载模块信息
  try {
    moduleInfo.value = await moduleApi.getModule(resolvedModuleId)
  }
  catch (error) {
    console.error('Failed to load module:', error)
    toast({
      title: '加载模块失败',
      description: '无法获取模块信息',
      variant: 'destructive',
    })
  }
  finally {
    isLoadingModule.value = false
  }
})

// 添加标签
function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !formData.value.tags?.includes(tag)) {
    formData.value.tags = [...(formData.value.tags || []), tag]
    tagInput.value = ''
  }
}

// 移除标签
function removeTag(index: number) {
  formData.value.tags = formData.value.tags?.filter((_, i) => i !== index) || []
}

// 提交创建
async function handleSubmit() {
  if (!canSubmit.value) {
    toast({
      title: '请填写完整信息',
      description: '标题、内容和提交说明不能为空',
      variant: 'destructive',
    })
    return
  }

  isLoading.value = true

  try {
    const article = await articleApi.createArticle(formData.value)

    toast({
      title: '创建成功',
      description: '文章已创建',
    })

    // 跳转到文章详情页
    router.push({
      name: 'ArticleDetail',
      params: { articleId: article.id },
    })
  }
  catch (error: any) {
    console.error('Failed to create article:', error)
    toast({
      title: '创建失败',
      description: error.response?.data?.message || error.message || '创建文章时发生错误',
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}

// 返回
function goBack() {
  formData.value = { ...EMPTY_FORM }
  router.back()
}
</script>

<template>
  <div>
    <!-- 头部 -->
    <div class="mb-8">
      <Button
        variant="ghost"
        size="sm"
        class="mb-4"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        返回
      </Button>

      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            创建新文章
          </h1>
          <p v-if="moduleInfo" class="text-gray-600 mt-2">
            所属模块：{{ pageTitle }}
          </p>
          <div v-else-if="isLoadingModule" class="flex items-center gap-2 text-gray-500 mt-2">
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>加载模块信息...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 表单 -->
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- 基本信息卡片 -->
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>填写文章的标题和基本设置</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- 文章标题 -->
          <div class="space-y-2">
            <Label for="title">
              文章标题 <span class="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              v-model="formData.title"
              placeholder="输入文章标题"
              required
              :disabled="isLoading"
            />
          </div>

          <!-- 提交说明 -->
          <div class="space-y-2">
            <Label for="commit-message">
              提交说明 <span class="text-red-500">*</span>
            </Label>
            <Input
              id="commit-message"
              v-model="formData.commit_message"
              placeholder="简要说明本次创建的内容"
              required
              :disabled="isLoading"
            />
          </div>

          <!-- 是否需要审核 -->
          <div class="flex items-center space-x-2">
            <input
              id="review-required"
              v-model="formData.is_review_required"
              type="checkbox"
              :disabled="isLoading"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            >
            <Label
              for="review-required"
              class="text-sm font-normal cursor-pointer"
            >
              启用审核流程（勾选后，其他用户的修改需要管理员审核；不勾选则所有修改自动发布）
            </Label>
          </div>
          <div v-if="!formData.is_review_required" class="text-xs text-amber-600 ml-6">
            ⚠️ 未启用审核，所有用户的修改将自动发布
          </div>
        </CardContent>
      </Card>

      <!-- 标签卡片 -->
      <Card>
        <CardHeader>
          <CardTitle>标签</CardTitle>
          <CardDescription>为文章添加标签，方便分类和搜索</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- 标签输入 -->
          <div class="flex gap-2">
            <Input
              v-model="tagInput"
              placeholder="输入标签名称"
              :disabled="isLoading"
              @keydown.enter.prevent="addTag"
            />
            <Button
              type="button"
              variant="outline"
              :disabled="isLoading || !tagInput.trim()"
              @click="addTag"
            >
              添加
            </Button>
          </div>

          <!-- 标签列表 -->
          <div v-if="formData.tags && formData.tags.length > 0" class="flex flex-wrap gap-2">
            <div
              v-for="(tag, index) in formData.tags"
              :key="index"
              class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <span>{{ tag }}</span>
              <button
                type="button"
                :disabled="isLoading"
                class="hover:text-blue-600"
                @click="removeTag(index)"
              >
                ×
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 内容编辑器 -->
      <Card>
        <CardHeader>
          <CardTitle>
            文章内容 <span class="text-red-500">*</span>
          </CardTitle>
          <CardDescription>使用富文本编辑器编写文章内容</CardDescription>
        </CardHeader>
        <CardContent>
          <ContentEditor
            v-model="formData.content"
            :readonly="isLoading"
            min-height="500px"
          />
        </CardContent>
      </Card>

      <!-- 操作按钮 -->
      <div class="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          :disabled="isLoading"
          @click="goBack"
        >
          取消
        </Button>
        <Button
          type="submit"
          :disabled="!canSubmit || isLoading"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
          <Save v-else class="w-4 h-4 mr-2" />
          {{ isLoading ? '创建中...' : '创建文章' }}
        </Button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* 可以添加自定义样式 */
</style>
