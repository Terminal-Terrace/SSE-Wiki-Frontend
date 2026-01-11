<script setup lang="ts">
/**
 * 通用协作者管理模态框
 * 支持模块协作者和文章协作者管理
 */
import type { PublicUserInfo } from '@/services/userApi'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@sse-wiki/ui'
import { Loader2, Plus, Search, Trash2, User, Users, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { articleApi } from '@/services/articleApi'
import { moduleApi } from '@/services/moduleApi'
import { userApi } from '@/services/userApi'
import { formatSimpleDate, getAvatarFallback, getRoleLabel, useDebounceFn } from '@/utils/format'

// 协作者信息接口
export interface Collaborator {
  userId: number
  username?: string
  avatar?: string
  role: string
  createdAt: string
}

// 角色选项接口
export interface RoleOption {
  value: string
  label: string
  description?: string
}

interface Props {
  open: boolean
  /** 资源类型：module 或 article */
  resourceType: 'module' | 'article'
  /** 资源ID */
  resourceId: number
  /** 资源名称（用于显示） */
  resourceName: string
  /** 当前用户角色（用于权限判断） */
  currentUserRole?: string | null
  /** 可选的角色列表 */
  roleOptions?: RoleOption[]
  /** 文章创建者ID（仅文章类型使用，用于标识作者） */
  createdBy?: number | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  currentUserRole: null,
  roleOptions: () => [],
  createdBy: null,
})
const emit = defineEmits<Emits>()

// 默认角色选项
const defaultModuleRoles: RoleOption[] = [
  { value: 'moderator', label: '协作者' },
  { value: 'admin', label: '管理员' },
]

const defaultArticleRoles: RoleOption[] = [
  { value: 'moderator', label: '协作者' },
  { value: 'admin', label: '管理员' },
]

// 计算实际使用的角色选项
const availableRoles = computed(() => {
  if (props.roleOptions && props.roleOptions.length > 0) {
    return props.roleOptions
  }

  const baseRoles = props.resourceType === 'module' ? defaultModuleRoles : defaultArticleRoles

  // 根据当前用户角色过滤可选角色
  // 文章协作者：只有作者（通过 isAuthor 属性判断）可以添加 admin
  // Admin 协作者只能添加 moderator
  if (props.resourceType === 'article') {
    // 如果当前用户不是 admin 角色，则不能添加 admin 协作者
    // 注意：作者身份需要通过 isAuthor 属性传入，这里暂时保留 admin 角色可以添加 admin
    // 实际权限控制由后端执行
    const canAddAdmin = props.currentUserRole === 'admin'
    if (!canAddAdmin) {
      return baseRoles.filter(r => r.value !== 'admin')
    }
  }

  return baseRoles
})

// 响应式状态
const collaborators = ref<Collaborator[]>([])
const isLoadingCollaborators = ref(false)
const isAddingCollaborator = ref(false)
const collaboratorToRemove = ref<Collaborator | null>(null)
const showRemoveDialog = ref(false)

// 用户搜索状态
const searchKeyword = ref('')
const searchResults = ref<PublicUserInfo[]>([])
const isSearching = ref(false)
const selectedUser = ref<PublicUserInfo | null>(null)
const showSearchResults = ref(false)

// 添加协作者表单
const newCollaboratorRole = ref('')
const addError = ref('')

// 计算属性
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

// 防抖搜索
const debouncedSearch = useDebounceFn(async (keyword: string) => {
  if (!keyword.trim()) {
    searchResults.value = []
    showSearchResults.value = false
    return
  }

  try {
    isSearching.value = true
    const response = await userApi.searchUsers({
      keyword: keyword.trim(),
      page: 1,
      pageSize: 10,
    })
    searchResults.value = response.users || []
    showSearchResults.value = true
  }
  catch {
    searchResults.value = []
  }
  finally {
    isSearching.value = false
  }
}, 300)

// 监听搜索关键词变化
watch(searchKeyword, (newKeyword) => {
  if (selectedUser.value) {
    selectedUser.value = null
  }
  debouncedSearch(newKeyword)
})

// 监听模态框状态变化
watch(
  () => props.open,
  (newOpen) => {
    if (newOpen && props.resourceId) {
      loadCollaborators()
      resetForm()
    }
  },
  { immediate: true },
)

// 初始化默认角色
watch(availableRoles, (roles) => {
  if (roles.length > 0 && !newCollaboratorRole.value) {
    newCollaboratorRole.value = roles[0]?.value || 'moderator'
  }
}, { immediate: true })

// 加载协作者列表
async function loadCollaborators() {
  if (!props.resourceId) {
    collaborators.value = []
    return
  }

  try {
    isLoadingCollaborators.value = true
    let data: Collaborator[] = []

    if (props.resourceType === 'article') {
      const collaborators = await articleApi.getCollaborators(props.resourceId)
      data = (collaborators || []).map(c => ({
        userId: c.userId,
        username: c.username,
        avatar: c.avatar,
        role: c.role,
        createdAt: c.createdAt,
      }))
    }
    else if (props.resourceType === 'module') {
      const moderators = await moduleApi.getModerators(props.resourceId)
      data = (moderators || []).map(m => ({
        userId: m.userId,
        username: m.username,
        avatar: m.avatar,
        role: m.role,
        createdAt: m.createdAt,
      }))
    }

    collaborators.value = data
  }
  catch (error) {
    console.error('加载协作者列表失败:', error)
    collaborators.value = []
  }
  finally {
    isLoadingCollaborators.value = false
  }
}

// 选择用户
function selectUser(user: PublicUserInfo) {
  selectedUser.value = user
  searchKeyword.value = user.username
  showSearchResults.value = false
}

// 清除选择
function clearSelection() {
  selectedUser.value = null
  searchKeyword.value = ''
  searchResults.value = []
  showSearchResults.value = false
}

// 打开移除确认对话框
function openRemoveDialog(collaborator: Collaborator) {
  collaboratorToRemove.value = collaborator
  showRemoveDialog.value = true
}

// 移除协作者
async function confirmRemoveCollaborator() {
  if (!collaboratorToRemove.value || !props.resourceId)
    return

  try {
    if (props.resourceType === 'article') {
      await articleApi.removeCollaborator(props.resourceId, collaboratorToRemove.value.userId)
    }
    else if (props.resourceType === 'module') {
      await moduleApi.removeModerator(props.resourceId, collaboratorToRemove.value.userId)
    }

    await loadCollaborators()

    toast({
      title: '已移除',
    })
  }
  catch (error) {
    console.error('移除协作者失败:', error)
    toast({
      title: '移除失败',
      variant: 'destructive',
    })
  }
  finally {
    showRemoveDialog.value = false
    collaboratorToRemove.value = null
  }
}

// 添加协作者
async function handleAddCollaborator() {
  addError.value = ''

  if (!selectedUser.value) {
    addError.value = '请先选择用户'
    return
  }

  // 检查是否已经是协作者
  const existingCollaborator = collaborators.value.find(
    c => c.userId === selectedUser.value!.id,
  )
  if (existingCollaborator) {
    addError.value = '该用户已是协作者'
    return
  }

  try {
    isAddingCollaborator.value = true

    if (props.resourceType === 'article') {
      await articleApi.addCollaborator(props.resourceId, {
        userId: selectedUser.value.id,
        role: newCollaboratorRole.value as 'admin' | 'moderator',
      })
    }
    else if (props.resourceType === 'module') {
      await moduleApi.addModerator(props.resourceId, {
        userId: selectedUser.value.id,
        role: newCollaboratorRole.value as 'admin' | 'moderator',
      })
    }

    resetForm()
    await loadCollaborators()

    toast({
      title: '添加成功',
    })

    emit('success')
  }
  catch (error: any) {
    console.error('添加协作者失败:', error)
    const errorMsg = error?.message || '添加失败'
    addError.value = errorMsg
    toast({
      title: '添加失败',
      description: errorMsg,
      variant: 'destructive',
    })
  }
  finally {
    isAddingCollaborator.value = false
  }
}

// 重置表单
function resetForm() {
  searchKeyword.value = ''
  searchResults.value = []
  selectedUser.value = null
  showSearchResults.value = false
  newCollaboratorRole.value = availableRoles.value[0]?.value || 'moderator'
  addError.value = ''
}

// 判断是否可以移除
// 注意：作者（created_by）不能被移除，但这个检查由后端执行
// 前端只需要显示移除按钮，后端会返回错误如果尝试移除作者
function canRemove(_collaborator: Collaborator) {
  // 所有协作者都显示移除按钮，权限由后端控制
  return true
}

// 判断协作者是否是作者
function isAuthor(collaborator: Collaborator): boolean {
  return props.resourceType === 'article' && props.createdBy != null && collaborator.userId === props.createdBy
}

// 获取协作者的显示角色标签
function getCollaboratorRoleLabel(collaborator: Collaborator): string {
  // 如果是文章作者，显示"作者"
  if (isAuthor(collaborator)) {
    return '作者'
  }
  return getRoleLabel(collaborator.role)
}
</script>

<template>
  <div>
    <Dialog v-model:open="isOpen">
      <DialogContent class="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Users class="w-5 h-5" />
            协作者
          </DialogTitle>
        </DialogHeader>

        <div class="flex-1 overflow-y-auto space-y-6">
          <!-- 添加协作者表单 -->
          <div class="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 class="text-sm font-medium flex items-center gap-2">
              <Plus class="w-4 h-4" />
              添加
            </h4>

            <div class="space-y-3">
              <!-- 用户搜索 -->
              <div class="space-y-2">
                <Label for="user-search">用户</Label>
                <div class="relative">
                  <div class="relative">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="user-search"
                      v-model="searchKeyword"
                      type="text"
                      placeholder="搜索用户名..."
                      class="pl-9 pr-9"
                      :disabled="isAddingCollaborator"
                      @focus="showSearchResults = searchResults.length > 0"
                    />
                    <div v-if="isSearching" class="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 class="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                    <button
                      v-else-if="selectedUser || searchKeyword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      @click="clearSelection"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>

                  <!-- 搜索结果下拉 -->
                  <div
                    v-if="showSearchResults && searchResults.length > 0"
                    class="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto"
                  >
                    <button
                      v-for="user in searchResults"
                      :key="user.id"
                      class="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left"
                      @click="selectUser(user)"
                    >
                      <Avatar class="w-8 h-8">
                        <AvatarImage v-if="user.avatar" :src="user.avatar" :alt="user.username" />
                        <AvatarFallback>{{ getAvatarFallback(user.username) }}</AvatarFallback>
                      </Avatar>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">
                          {{ user.username }}
                        </p>
                      </div>
                    </button>
                  </div>

                  <!-- 无搜索结果 -->
                  <div
                    v-else-if="showSearchResults && searchKeyword && !isSearching && searchResults.length === 0"
                    class="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-4 text-center text-muted-foreground"
                  >
                    <User class="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p class="text-sm">
                      未找到用户
                    </p>
                  </div>
                </div>
              </div>

              <!-- 已选择的用户 -->
              <div v-if="selectedUser" class="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <Avatar class="w-10 h-10">
                  <AvatarImage v-if="selectedUser.avatar" :src="selectedUser.avatar" :alt="selectedUser.username" />
                  <AvatarFallback>{{ getAvatarFallback(selectedUser.username) }}</AvatarFallback>
                </Avatar>
                <div class="flex-1">
                  <p class="font-medium">
                    {{ selectedUser.username }}
                  </p>
                </div>
                <Button variant="ghost" size="sm" @click="clearSelection">
                  <X class="w-4 h-4" />
                </Button>
              </div>

              <!-- 角色选择 -->
              <div class="space-y-2">
                <Label for="role">角色</Label>
                <Select v-model="newCollaboratorRole" :disabled="isAddingCollaborator">
                  <SelectTrigger id="role">
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="role in availableRoles" :key="role.value" :value="role.value">
                      {{ role.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- 错误提示 -->
              <div v-if="addError" class="text-sm text-destructive">
                {{ addError }}
              </div>

              <Button
                class="w-full"
                :disabled="isAddingCollaborator || !selectedUser"
                @click="handleAddCollaborator"
              >
                <Loader2 v-if="isAddingCollaborator" class="w-4 h-4 mr-2 animate-spin" />
                <Plus v-else class="w-4 h-4 mr-2" />
                <span>{{ isAddingCollaborator ? '添加中...' : '添加' }}</span>
              </Button>
            </div>
          </div>

          <!-- 现有协作者列表 -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium">
              协作者 ({{ collaborators.length }})
            </h4>

            <div v-if="isLoadingCollaborators" class="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 class="w-4 h-4 animate-spin" />
              <span class="text-sm">加载中...</span>
            </div>

            <div v-else-if="collaborators.length === 0" class="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users class="w-8 h-8 mb-2 opacity-50" />
              <p class="text-sm">
                暂无协作者
              </p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="collaborator in collaborators"
                :key="collaborator.userId"
                class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage v-if="collaborator.avatar" :src="collaborator.avatar" :alt="collaborator.username" />
                    <AvatarFallback>
                      {{ getAvatarFallback(collaborator.username) }}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p class="font-medium">
                      {{ collaborator.username || `用户 ${collaborator.userId}` }}
                    </p>
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        :class="{
                          'bg-amber-500 text-white': isAuthor(collaborator),
                          'bg-primary text-primary-foreground': !isAuthor(collaborator) && collaborator.role === 'admin',
                          'bg-secondary text-secondary-foreground': !isAuthor(collaborator) && collaborator.role === 'moderator',
                        }"
                      >
                        {{ getCollaboratorRoleLabel(collaborator) }}
                      </span>
                      <span class="text-xs text-muted-foreground">
                        {{ formatSimpleDate(collaborator.createdAt) }}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  v-if="canRemove(collaborator)"
                  size="sm"
                  variant="ghost"
                  class="text-muted-foreground hover:text-destructive"
                  @click="openRemoveDialog(collaborator)"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 移除协作者确认对话框 -->
    <AlertDialog :open="showRemoveDialog" @update:open="showRemoveDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认移除</AlertDialogTitle>
          <AlertDialogDescription>
            确定移除 <strong>{{ collaboratorToRemove?.username || '该用户' }}</strong> 吗？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction variant="destructive" @click="confirmRemoveCollaborator">
            移除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
