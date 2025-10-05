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
} from '@sse-wiki/ui'
import { Trash2, Users } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useModuleStore } from '@/stores/module'

// TODO：当前modal有bug，打开了关不掉！

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
    collaborators.value = data
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
  }
}

// 格式化日期
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('zh-CN')
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && emit('close')">
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
