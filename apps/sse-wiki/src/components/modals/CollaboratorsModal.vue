<script setup lang="ts">
import type { ModuleModalState, ModuleModerator } from '@/types/module'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Plus, Trash2, Users } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useModuleStore } from '@/stores/module'

interface Props {
  modalState: ModuleModalState
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const moduleStore = useModuleStore()

// 响应式状态
const collaborators = ref<ModuleModerator[]>([])
const isLoadingCollaborators = ref(false)
const isAddingCollaborator = ref(false)

// 添加协作者表单
const newCollaboratorUserId = ref('')
const newCollaboratorRole = ref<'admin' | 'moderator'>('moderator')
const addError = ref('')

// 计算属性
const isOpen = computed(() =>
  props.modalState.isOpen && props.modalState.type === 'collaborators',
)

const targetModule = computed(() => props.modalState.targetModule)

// 监听模态框状态变化
watch(
  () => props.modalState,
  (newState) => {
    if (newState.isOpen && newState.type === 'collaborators' && newState.targetModule) {
      loadCollaborators(newState.targetModule.id)
    }
  },
  { immediate: true },
)

// TODO：暂时未测试协作者部分功能
// 加载协作者列表
async function loadCollaborators(moduleId: number) {
  try {
    isLoadingCollaborators.value = true

    // 调用真实API
    const data = await moduleStore.getModerators(moduleId)
    // 处理后端返回 null 的情况
    collaborators.value = data || []
  }
  catch (error) {
    console.error('❌ 加载协作者列表失败:', error)
    collaborators.value = []
  }
  finally {
    isLoadingCollaborators.value = false
  }
}

// TODO：暂时未测试协作者部分功能
// 移除协作者
async function removeCollaborator(userId: number) {
  if (!targetModule.value)
    return

  if (!confirm('确定要移除该协作者吗？'))
    return

  try {
    // 调用真实API
    await moduleStore.removeModerator(targetModule.value.id, userId)

    // 重新加载协作者列表
    await loadCollaborators(targetModule.value.id)
  }
  catch (error) {
    console.error('❌ 移除协作者失败:', error)
    toast({
      title: '移除协作者失败',
      description: '请重试',
      variant: 'destructive',
    })
  }
}

// TODO: 后续需要实现用户搜索功能，目前让用户直接输入 user_id
// 添加协作者
async function addCollaborator() {
  if (!targetModule.value)
    return

  // 清除之前的错误信息
  addError.value = ''

  // 验证输入
  const userId = Number.parseInt(newCollaboratorUserId.value.trim())
  if (!newCollaboratorUserId.value.trim() || Number.isNaN(userId)) {
    addError.value = '请输入有效的用户 ID（数字）'
    return
  }

  try {
    isAddingCollaborator.value = true

    // 调用 API 添加协作者
    await moduleStore.addModerator(targetModule.value.id, {
      user_id: userId,
      role: newCollaboratorRole.value,
    })

    // 重置表单
    resetForm()

    // 重新加载协作者列表
    await loadCollaborators(targetModule.value.id)

    toast({
      title: '添加协作者成功',
    })
  }
  catch (error: any) {
    console.error('❌ 添加协作者失败:', error)
    const errorMsg = error?.message || '添加协作者失败'
    addError.value = errorMsg
    toast({
      title: '添加协作者失败',
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
  newCollaboratorUserId.value = ''
  newCollaboratorRole.value = 'moderator'
  addError.value = ''
}

// 处理对话框打开状态变化
function handleOpenChange(open: boolean) {
  if (!open) {
    emit('close')
  }
}

// 格式化日期
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Users class="w-5 h-5" />
          管理协作者 - {{ targetModule?.name }}
        </DialogTitle>
        <DialogDescription>
          查看和管理模块协作者（用户搜索功能暂未开放）
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto space-y-6">
        <!-- 添加协作者表单 -->
        <div class="space-y-4 p-4 border rounded-lg bg-muted/30">
          <h4 class="text-sm font-medium flex items-center gap-2">
            <Plus class="w-4 h-4" />
            添加协作者
          </h4>

          <div class="space-y-3">
            <!-- TODO: 后续需要实现用户搜索功能 -->
            <div class="space-y-2">
              <Label for="user-id">用户 ID</Label>
              <Input
                id="user-id"
                v-model="newCollaboratorUserId"
                type="text"
                placeholder="请输入用户 ID（暂时直接输入数字 ID）"
                :disabled="isAddingCollaborator"
              />
              <p class="text-xs text-muted-foreground">
                提示：后续会实现用户搜索功能，目前请直接输入用户的数字 ID
              </p>
            </div>

            <div class="space-y-2">
              <Label for="role">角色</Label>
              <Select v-model="newCollaboratorRole" :disabled="isAddingCollaborator">
                <SelectTrigger id="role">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">
                    协作者
                  </SelectItem>
                  <SelectItem value="admin">
                    管理员
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
              :disabled="isAddingCollaborator || !newCollaboratorUserId.trim()"
              @click="addCollaborator"
            >
              <div v-if="isAddingCollaborator" class="flex items-center gap-2">
                <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>添加中...</span>
              </div>
              <div v-else class="flex items-center gap-2">
                <Plus class="w-4 h-4" />
                <span>添加协作者</span>
              </div>
            </Button>
          </div>
        </div>

        <!-- 现有协作者列表 -->
        <div class="space-y-4">
          <h4 class="text-sm font-medium">
            现有协作者
          </h4>

          <div v-if="isLoadingCollaborators" class="flex items-center justify-center py-8">
            <div class="flex items-center gap-2 text-muted-foreground">
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span class="text-sm">加载协作者列表...</span>
            </div>
          </div>

          <div v-else-if="collaborators.length === 0" class="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Users class="w-8 h-8 mb-2" />
            <p class="text-sm">
              暂无协作者
            </p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="collaborator in collaborators"
              :key="collaborator.user_id"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                  {{ collaborator.username.charAt(0) }}
                </div>
                <div>
                  <p class="font-medium">
                    {{ collaborator.username }}
                  </p>
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      :class="{
                        'bg-primary text-primary-foreground': collaborator.role === 'admin',
                        'bg-secondary text-secondary-foreground': collaborator.role === 'moderator',
                      }"
                    >
                      {{ collaborator.role === 'admin' ? '管理员' : '协作者' }}
                    </span>
                    <span class="text-xs text-muted-foreground">
                      {{ formatDate(collaborator.created_at) }} 加入
                    </span>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                class="text-muted-foreground hover:text-destructive"
                @click="removeCollaborator(collaborator.user_id)"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('close')">
          关闭
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
