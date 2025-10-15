<script setup lang="ts">
import type { ArticleDetailResponse } from '@/types/article'
import { Badge, Button, Card, Input, Label, toast } from '@sse-wiki/ui'
import { ArrowLeft, Save } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import articleEdit from '@/components/edit/articleEdit.vue'
import { useArticleStore } from '@/stores/article'

interface Props {
  articleId?: string
}

const props = defineProps<Props>()
const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()

// 状态
const isLoading = ref(false)
const isSaving = ref(false)
const article = ref<ArticleDetailResponse | null>(null)
const moduleId = ref<number>(Number(route.query.moduleId) || 0)

// 表单数据
const form = ref({
  title: '',
  content: '',
  commitMessage: '',
  tags: '', // 改为字符串，用户自定义输入，逗号分隔
})

// 是否为编辑模式
const isEditMode = computed(() => !!props.articleId)

// TODO: 待检查
// 当前用户权限（暂未在模板中直接使用，命名为 _permissions 以避免 lint 报错）
const _permissions = computed(() => articleStore.getCurrentUserPermissions())

onMounted(async () => {
  if (isEditMode.value && props.articleId) {
    await loadArticle(props.articleId)
  }
})

// 加载文章
async function loadArticle(id: string) {
  try {
    isLoading.value = true
    article.value = await articleStore.fetchArticle(id)

    // 填充表单
    form.value.title = article.value.title
    form.value.content = articleStore.getCurrentVersionContent()

    // 处理标签：兼容 string[] 和 Tag[] 两种格式
    if (article.value.tags) {
      if (typeof article.value.tags[0] === 'string') {
        // 如果是字符串数组，直接 join
        form.value.tags = (article.value.tags as string[]).join(', ')
      }
      else {
        // 如果是 Tag 对象数组，提取 name 字段
        form.value.tags = (article.value.tags as any[]).map(t => t.name).join(', ')
      }
    }
    else {
      form.value.tags = ''
    }
  }
  catch (error) {
    console.error('Failed to load article:', error)
    toast({
      title: '加载文章失败',
      variant: 'destructive',
    })
    router.back()
  }
  finally {
    isLoading.value = false
  }
}

// 保存文章
async function handleSave() {
  if (!form.value.title.trim()) {
    toast({
      title: '请输入文章标题',
      variant: 'destructive',
    })
    return
  }

  if (!form.value.content.trim()) {
    toast({
      title: '请输入文章内容',
      variant: 'destructive',
    })
    return
  }

  if (!form.value.commitMessage.trim()) {
    toast({
      title: '请输入提交说明',
      variant: 'destructive',
    })
    return
  }

  try {
    isSaving.value = true

    // 处理标签：将逗号分隔的字符串转换为数组
    const tagsArray = form.value.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    if (isEditMode.value && props.articleId) {
      // 编辑模式：提交修改
      await articleStore.submitArticle(props.articleId, {
        content: form.value.content,
        commit_message: form.value.commitMessage,
        base_version_id: article.value?.current_version_id || 0,
        tags: tagsArray,
      })

      toast({
        title: '提交成功',
        description: '等待审核',
      })
      router.push(`/articles/${props.articleId}`)
    }
    else {
      // 创建模式：创建新文章
      const newArticle = await articleStore.createArticle({
        title: form.value.title,
        module_id: moduleId.value,
        content: form.value.content,
        commit_message: form.value.commitMessage,
        tags: tagsArray,
      })

      toast({
        title: '文章创建成功',
      })
      router.push(`/articles/${newArticle.id}`)
    }
  }
  catch (error: any) {
    console.error('Failed to save article:', error)
    if (error.response?.status === 409) {
      // 冲突错误
      toast({
        title: '检测到冲突',
        description: '请联系管理员处理',
        variant: 'destructive',
      })
    }
    else {
      toast({
        title: '保存失败',
        description: error.message || '未知错误',
        variant: 'destructive',
      })
    }
  }
  finally {
    isSaving.value = false
  }
}

// 返回
function handleBack() {
  if (isEditMode.value && props.articleId) {
    router.push(`/articles/${props.articleId}`)
  }
  else {
    router.back()
  }
}
</script>

<template>
  <div class="w-full min-h-screen overflow-y-auto px-6 sm:px-8 lg:px-12 py-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- 头部 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="sm" @click="handleBack">
            <ArrowLeft class="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 class="text-2xl font-bold">
              {{ isEditMode ? '编辑文章' : '创建文章' }}
            </h1>
            <p v-if="article" class="text-sm text-muted-foreground mt-1">
              {{ article.title }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Badge v-if="article && !article.is_review_required" variant="outline">
            免审核
          </Badge>
          <Button :disabled="isSaving || isLoading" @click="handleSave">
            <Save class="h-4 w-4 mr-2" />
            {{ isSaving ? '保存中...' : '提交' }}
          </Button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>

      <!-- 编辑表单 -->
      <div v-else class="space-y-6">
        <!-- 文章标题 -->
        <Card>
          <div class="p-6 space-y-4">
            <div class="space-y-2">
              <Label for="title">文章标题</Label>
              <Input
                id="title"
                v-model="form.title"
                placeholder="输入文章标题..."
                :readonly="isEditMode"
                class="text-lg"
              />
              <p v-if="isEditMode" class="text-xs text-muted-foreground">
                注意：编辑模式下标题不可修改
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <!-- 标签输入 -->
              <div class="space-y-2">
                <Label for="tags">标签</Label>
                <Input
                  id="tags"
                  v-model="form.tags"
                  placeholder="输入标签，用逗号分隔，如：前端, Vue3, TypeScript"
                />
                <p class="text-xs text-muted-foreground">
                  多个标签用逗号（,）分隔
                </p>
              </div>

              <!-- 提交说明 -->
              <div class="space-y-2">
                <Label for="commit-message">提交说明 *</Label>
                <Input
                  id="commit-message"
                  v-model="form.commitMessage"
                  placeholder="描述本次修改的内容..."
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        <!-- TipTap 编辑器 -->
        <articleEdit />

        <!-- 底部操作栏 -->
        <Card>
          <div class="p-4 flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
              <p v-if="isEditMode && article">
                基于版本 v{{ article.current_version?.version_number }} 进行修改
              </p>
              <p v-else>
                创建新文章将自动创建第一个版本
              </p>
            </div>

            <div class="flex items-center gap-2">
              <Button variant="outline" @click="handleBack">
                取消
              </Button>
              <Button :disabled="isSaving || isLoading" @click="handleSave">
                <Save class="h-4 w-4 mr-2" />
                {{ isSaving ? '提交中...' : (isEditMode ? '提交审核' : '创建文章') }}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
