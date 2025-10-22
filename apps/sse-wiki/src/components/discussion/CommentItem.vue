<script setup lang="ts">
import type { Comment } from '@/types/discussion'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@sse-wiki/ui'
import { MessageSquare, MoreVertical, Pencil, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useDiscussionStore } from '@/stores/discussion'
import { CommentEditorMode } from '@/types/discussion'
import { formatDate } from '@/utils/format'
/**
 * 评论项组件（支持递归渲染子评论）
 *
 * 行为修改：
 * - 顶级评论 (level === 0) 的回复默认收起，显示“展开回复”按钮。
 * - 次级评论 (level > 0) 的回复默认展开，且不会显示展开/收起按钮。
 * - 当顶级评论展开时，扁平化渲染该顶级评论下的所有子孙回复，变为单级缩进，并按 created_at 升序排序。
 */
import CommentEditor from './CommentEditor.vue'

interface Props {
  comment: Comment
  level?: number // 嵌套层级（用于控制缩进）
  currentUserId?: number // 当前登录用户ID
  replyToUsername?: string // 【新】回复的父级评论的用户名
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  currentUserId: undefined,
  replyToUsername: undefined,
})

const discussionStore = useDiscussionStore()

// ========== 状态 ==========
// 次级评论（level > 0）默认展开，顶级默认收起
const repliesExpanded = ref(props.level > 0)
const showReplyEditor = ref(false)
const showEditEditor = ref(false)
const isDeleting = ref(false)

// 暴露给 template 使用的简便变量（保持原先模板风格）
const comment = props.comment
const level = props.level
const currentUserId = props.currentUserId
const replyToUsername = props.replyToUsername

// ========== 计算属性 ==========
// 是否是当前用户（评论作者）
const isOwner = computed(() => {
  return true
  // return props.currentUserId && props.currentUserId === props.comment.created_by
})

const formattedTime = computed(() => {
  try {
    return formatDate(props.comment.created_at)
  }
  catch (error) {
    console.error('日期格式化失败:', error)
    return props.comment.created_at
  }
})

const hasReplies = computed(() => {
  return props.comment.replies && props.comment.replies.length > 0
})

const userInitial = computed(() => {
  return props.comment.creator?.username?.charAt(0).toUpperCase() || '?'
})

const isDeleted = computed(() => props.comment.is_deleted === true)

/**
 * 将 comment 的所有子孙回复扁平化为数组：
 * 每项包含 { comment: Comment, parentUsername: string }
 * parentUsername 表示这条回复直接回复的是谁（即 immediate parent 的 username）
 */
function collectAllDescendants(rootComment: Comment) {
  const out: Array<{ comment: Comment, parentUsername: string }> = []

  function dfs(parent: Comment) {
    if (!parent.replies || parent.replies.length === 0)
      return
    for (const child of parent.replies) {
      const parentName = parent.creator?.username || `${parent.created_by}`
      out.push({ comment: child, parentUsername: parentName })
      // 继续递归收集更深层次的子孙（保持 parentUsername 为直接父级）
      dfs(child)
    }
  }

  dfs(rootComment)
  return out
}

/**
 * 根据 level 决定渲染的子评论集合：
 * - level === 0（顶级）: 返回扁平化且按 created_at 升序排序的所有子孙
 * - level > 0: 返回直接子评论（保持不再展开更多层；但由于顶级会扁平化所有子孙，这里通常不会被触发）
 */
const flattenedReplies = computed(() => {
  if (!hasReplies.value)
    return []

  if (props.level === 0) {
    const arr = collectAllDescendants(props.comment)
    // 按 created_at 升序排序（从早到晚）
    arr.sort((a, b) => {
      const ta = a.comment.created_at ? new Date(a.comment.created_at).getTime() : 0
      const tb = b.comment.created_at ? new Date(b.comment.created_at).getTime() : 0
      return ta - tb
    })
    return arr
  }
  else {
    // 次级组件（level > 0）不做深度扁平化，直接返回一级 replies（并在模板上为这些子项传 level=1）
    return (props.comment.replies || []).map((c: Comment) => ({
      comment: c,
      parentUsername: props.comment.creator?.username || `${props.comment.created_by}`,
    }))
  }
})

// ========== 方法 ==========
function toggleReply() {
  showReplyEditor.value = !showReplyEditor.value
  if (showReplyEditor.value) {
    showEditEditor.value = false
  }
}

function toggleEdit() {
  showEditEditor.value = !showEditEditor.value
  if (showEditEditor.value) {
    showReplyEditor.value = false
  }
}

async function handleReply(content: string) {
  try {
    await discussionStore.replyComment(props.comment.id, { content })
    showReplyEditor.value = false
    // 回复成功后，如果是顶级评论，确保展开；如果是次级评论，默认已经展开
    repliesExpanded.value = true
  }
  catch (error) {
    console.error('回复失败:', error)
  }
}

async function handleEdit(content: string) {
  try {
    await discussionStore.updateComment(props.comment.id, { content })
    showEditEditor.value = false
  }
  catch (error) {
    console.error('编辑失败:', error)
  }
}

async function handleDelete() {
  if (!confirm('确定要删除这条评论吗？')) {
    return
  }

  isDeleting.value = true
  try {
    await discussionStore.deleteComment(props.comment.id)
  }
  catch (error) {
    console.error('删除失败:', error)
  }
  finally {
    isDeleting.value = false
  }
}

function cancelReply() {
  showReplyEditor.value = false
}

function cancelEdit() {
  showEditEditor.value = false
}
</script>

<template>
  <!-- 所有次级（level > 0）统一一个缩进 (ml-8)，顶级无缩进 -->
  <div class="comment-item" :class="{ 'ml-8': level > 0 }">
    <div class="flex gap-3">
      <!-- 用户头像 -->
      <Avatar class="h-10 w-10 flex-shrink-0">
        <AvatarImage
          v-if="comment.creator?.avatar"
          :src="comment.creator.avatar"
          :alt="comment.creator.username"
        />
        <AvatarFallback>{{ userInitial }}</AvatarFallback>
      </Avatar>

      <!-- 评论内容 -->
      <div class="flex-1 min-w-0">
        <!-- 用户名和时间 -->
        <div class="flex items-center gap-2 mb-1">
          <span class="font-medium text-sm">
            {{ comment.creator?.username || `${comment.created_by}` }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{ formattedTime }}
          </span>
          <span v-if="!isDeleted && comment.updated_at !== comment.created_at" class="text-xs text-muted-foreground">
            (已编辑)
          </span>
        </div>

        <!-- 显示回复对象（只有在次级显示） -->
        <div v-if="replyToUsername && level > 0" class="text-sm text-muted-foreground mb-1">
          回复
          <span class="font-medium text-primary">@{{ replyToUsername }}</span>
          :
        </div>

        <!-- 评论内容 或 删除占位 -->
        <div v-if="isDeleted" class="mb-2">
          <div class="text-sm text-muted-foreground italic">
            该评论已被删除
          </div>
        </div>

        <div
          v-else
          class="prose prose-sm max-w-none mb-2"
          v-html="comment.content"
        />

        <!-- 编辑模式 -->
        <div v-if="showEditEditor" class="mb-2">
          <CommentEditor
            :mode="CommentEditorMode.EDIT"
            :initial-content="comment.content"
            min-height="100px"
            :auto-focus="true"
            @submit="handleEdit"
            @cancel="cancelEdit"
          />
        </div>

        <!-- 操作按钮 -->
        <div v-if="!showEditEditor" class="flex items-center gap-2">
          <!-- 回复按钮 -->
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-xs"
            @click="toggleReply"
          >
            <MessageSquare class="h-3 w-3 mr-1" />
            {{ showReplyEditor ? '取消回复' : '回复' }}
          </Button>

          <!-- 展开/收起按钮：仅在顶级且有直接回复时显示 -->
          <Button
            v-if="hasReplies && level === 0"
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-xs"
            @click="repliesExpanded = !repliesExpanded"
          >
            {{ repliesExpanded ? '收起' : '展开' }}回复
            <span class="ml-1">
              ({{ comment.reply_count }})
            </span>
          </Button>

          <!-- 更多操作（仅评论作者可见） -->
          <DropdownMenu v-if="isOwner && !isDeleted">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="h-7 w-7 p-0">
                <MoreVertical class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="toggleEdit">
                <Pencil class="h-4 w-4 mr-2" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                class="text-destructive"
                :disabled="isDeleting"
                @click="handleDelete"
              >
                <Trash2 class="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <!-- 回复编辑器 -->
        <div v-if="showReplyEditor" class="mt-3">
          <CommentEditor
            :mode="CommentEditorMode.REPLY"
            placeholder="写下你的回复..."
            min-height="100px"
            :auto-focus="true"
            @submit="handleReply"
            @cancel="cancelReply"
          />
        </div>

        <!-- 子评论列表 -->
        <!-- 当顶级被展开时，我们使用 flattenedReplies（扁平化的所有子孙），并统一传 level=1（单层缩进） -->
        <div v-if="hasReplies && repliesExpanded" class="mt-4 space-y-4">
          <CommentItem
            v-for="entry in flattenedReplies"
            :key="entry.comment.id"
            :comment="entry.comment"
            :level="1"
            :current-user-id="currentUserId"
            :reply-to-username="entry.parentUsername"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  @apply py-4;
}

.comment-item:not(:last-child) {
  @apply border-b border-border/50;
}

/* 深度样式：评论内容 */
.prose :deep(p) {
  @apply my-1;
}

.prose :deep(p:first-child) {
  @apply mt-0;
}

.prose :deep(p:last-child) {
  @apply mb-0;
}
</style>
