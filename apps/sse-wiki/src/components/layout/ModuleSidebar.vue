<script setup lang="ts">
import type { ModuleAction, ModuleModalState, ModuleTreeNode } from '@/types/module'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuSkeleton,
  toast,
  TooltipProvider,
} from '@sse-wiki/ui'
import { Edit2, Plus, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TooltipButton } from '@/components/common/tooltip'
import CollaboratorsModal from '@/components/layout/components/ModuleCollaboratorsModal.vue'
import DeleteModuleModal from '@/components/layout/components/ModuleDeleteModal.vue'
import CreateEditModuleModal from '@/components/layout/components/ModuleFormModal.vue'
import ModuleTree from '@/components/layout/components/ModuleTree.vue'
import { useModulePermission } from '@/composables/useModulePermission'
import { moduleApi } from '@/services/moduleApi'
import { useModuleStore } from '@/stores/module'

// 状态管理
const moduleStore = useModuleStore()
const route = useRoute()
const router = useRouter()

// 响应式状态
const isLoading = ref(false)
const error = ref<string | null>(null)
const isEditMode = ref(false)
const isLockLoading = ref(false)
const lockInfo = ref<any>(null)

const modalState = ref<ModuleModalState>({
  type: null,
  isOpen: false,
})

// 计算属性
const moduleTree = computed(() => moduleStore.moduleTree)
const { canCreateTopLevel } = useModulePermission()

// 获取模块树
async function fetchModules() {
  try {
    isLoading.value = true
    error.value = null
    await moduleStore.fetchModules()
  }
  catch (err) {
    error.value = '获取模块列表失败，请重试'
    console.error('Failed to fetch modules:', err)
  }
  finally {
    isLoading.value = false
  }
}

// TODO: 待检查
// 获取锁状态（目前未主动调用，命名为 _fetchLockStatus 以避免 eslint unused-vars 报错）
async function _fetchLockStatus() {
  try {
    const response = await moduleApi.getLockStatus()
    lockInfo.value = response
  }
  catch (err) {
    console.error('Failed to fetch lock status:', err)
    // 获取锁状态失败不影响主流程，只是无法显示锁提示
  }
}

// 进入编辑模式
async function enterEditMode() {
  try {
    isLockLoading.value = true

    const response = await moduleApi.acquireLock()

    if (response.success) {
      isEditMode.value = true
      lockInfo.value = response // 获取锁成功后直接使用返回的锁信息
      console.log('已进入编辑模式')
    }
    else {
      // 锁被其他用户占用
      const lockedBy = response.lockedBy?.username || '其他用户'
      toast({
        title: '无法进入编辑模式',
        description: `当前导航栏正在被 ${lockedBy} 编辑中，请稍后再试。`,
        variant: 'destructive',
      })
      console.warn('无法进入编辑模式，锁被其他用户占用:', response)
    }
  }
  catch (err: any) {
    console.error('进入编辑模式失败:', err)
    const errorMsg = err?.message || '未知错误'
    toast({
      title: '进入编辑模式失败',
      description: `${errorMsg}。请检查网络连接或稍后重试。`,
      variant: 'destructive',
    })
  }
  finally {
    isLockLoading.value = false
  }
}

// 退出编辑模式
async function exitEditMode() {
  try {
    await moduleApi.releaseLock()

    isEditMode.value = false
    lockInfo.value = null // 清空锁信息
    console.log('已退出编辑模式')
  }
  catch (err: any) {
    console.error('退出编辑模式失败:', err)
    // 即使释放锁失败，也退出编辑模式（可能锁已过期）
    isEditMode.value = false
    lockInfo.value = null
    const errorMsg = err?.message || '未知错误'
    toast({
      title: '释放锁失败',
      description: `${errorMsg}。已退出编辑模式。`,
      variant: 'destructive',
    })
  }
}

// 创建顶级模块
function createTopLevelModule() {
  modalState.value = {
    type: 'create',
    isOpen: true,
    parentModule: undefined,
  }
}

// 处理模块操作
function handleModuleAction(payload: { action: ModuleAction, module: ModuleTreeNode, parentModule?: ModuleTreeNode }) {
  const { action, module } = payload

  switch (action) {
    case 'create':
      modalState.value = {
        type: 'create',
        isOpen: true,
        parentModule: module,
      }
      break
    case 'edit':
      modalState.value = {
        type: 'edit',
        isOpen: true,
        targetModule: module,
      }
      break
    case 'delete':
      modalState.value = {
        type: 'delete',
        isOpen: true,
        targetModule: module,
      }
      break
    case 'manage_collaborators':
      modalState.value = {
        type: 'collaborators',
        isOpen: true,
        targetModule: module,
      }
      break
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
  const deletedModuleId = modalState.value.targetModule?.id

  closeModal()

  // 重新获取模块树
  await fetchModules()

  // 如果是删除操作，检查是否删除的是当前正在查看的模块
  if (currentType === 'delete' && deletedModuleId) {
    const currentModuleId = route.params.moduleId

    // 如果删除的是当前模块，需要跳转到安全页面
    if (currentModuleId && String(deletedModuleId) === String(currentModuleId)) {
      // 尝试跳转到第一个可用的模块，否则跳转到首页
      if (moduleStore.moduleTree.length > 0 && moduleStore.moduleTree[0]) {
        router.push({
          name: 'ModuleDetail',
          params: { moduleId: moduleStore.moduleTree[0].id },
        })
      }
      else {
        router.push({ name: 'Home' })
      }

      toast({
        title: '模块已删除',
        description: '已为您跳转到其他页面',
      })
    }
  }
}

// 格式化锁定时间
function formatLockTime(timestamp: string) {
  const now = Date.now()
  const lockTime = new Date(timestamp).getTime()
  const diff = now - lockTime
  const minutes = Math.floor(diff / 60000)
  return minutes < 1 ? '刚刚' : `${minutes}分钟前`
}

// 页面卸载时释放锁
function handleBeforeUnload() {
  if (isEditMode.value) {
    // 使用 navigator.sendBeacon 在页面卸载时发送请求
    // 注意：sendBeacon 是异步的，不保证一定发送成功
    // 依赖后端的15分钟自动过期作为兜底方案
    try {
      // 使用同步的方式尝试释放锁
      // 注意：在实际场景中，beforeunload 事件中的异步操作可能不会完成
      // 建议后端实现自动过期机制（已实现：15分钟）
      moduleApi.releaseLock().catch((err) => {
        console.error('页面卸载时释放锁失败:', err)
      })
    }
    catch (err) {
      console.error('页面卸载时释放锁失败:', err)
    }
  }
}

// 组件挂载
onMounted(() => {
  fetchModules()
  // 移除自动获取锁状态，改为只在用户点击编辑按钮时检查

  // 监听页面卸载事件
  window.addEventListener('beforeunload', handleBeforeUnload)

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    handleBeforeUnload()
  })
})
</script>

<template>
  <TooltipProvider>
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <h1 class="text-xl font-semibold tracking-tight text-foreground">
              知识分类
            </h1>
            <div class="ml-auto flex gap-x-2">
              <!-- 编辑模式切换 -->
              <TooltipButton
                v-if="!isEditMode"
                size="sm"
                variant="ghost"
                class="edit-btn"
                :disabled="isLockLoading"
                @click="enterEditMode"
              >
                <Edit2 class="w-3 h-3 mr-1" />
                <span class="text-xs">编辑</span>
                <template #tooltip>
                  <div class="text-xs">
                    <div class="font-medium">
                      进入编辑模式
                    </div>
                    <div class="text-muted-foreground">
                      管理模块层级结构
                    </div>
                  </div>
                </template>
              </TooltipButton>

              <TooltipButton
                v-else
                size="sm"
                variant="destructive"
                class="exit-edit-btn"
                tooltip="退出编辑模式"
                @click="exitEditMode"
              >
                <X class="w-3 h-3 mr-1" />
                <span class="text-xs">完成</span>
              </TooltipButton>

              <!-- 创建顶级模块 -->
              <TooltipButton
                v-if="canCreateTopLevel && isEditMode"
                size="sm"
                variant="ghost"
                class="add-module-btn"
                tooltip="创建顶级模块"
                @click="createTopLevelModule"
              >
                <Plus class="w-3 h-3" />
              </TooltipButton>
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <div v-if="isLoading" class="px-2">
              <SidebarMenuSkeleton v-for="i in 5" :key="i" />
            </div>

            <Alert v-else-if="error" variant="destructive" class="mx-2">
              <AlertTitle>加载失败</AlertTitle>
              <AlertDescription class="mt-2">
                <p class="mb-2">
                  {{ error }}
                </p>
                <Button size="sm" variant="outline" @click="fetchModules">
                  重试
                </Button>
              </AlertDescription>
            </Alert>

            <SidebarMenu v-else-if="moduleTree && moduleTree.length">
              <ModuleTree
                v-for="module in moduleTree"
                :key="module.id"
                :node="module"
                :is-edit-mode="isEditMode"
                @module-action="handleModuleAction"
              />
            </SidebarMenu>

            <Empty v-else class="py-6">
              <EmptyMedia variant="icon">
                <Plus class="h-5 w-5" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle class="text-sm">
                  暂无模块
                </EmptyTitle>
                <EmptyDescription class="text-xs">
                  系统中还没有创建任何模块
                </EmptyDescription>
              </EmptyHeader>
              <Button v-if="canCreateTopLevel" size="sm" variant="outline" class="mt-3" @click="createTopLevelModule">
                创建第一个模块
              </Button>
            </Empty>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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

      <div v-if="lockInfo && lockInfo.locked_by && !isEditMode" class="fixed bottom-4 left-4 right-4 bg-muted border border-border rounded-md p-2 px-3 z-[1000] md:left-auto md:right-4">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Edit2 class="w-4 h-4" />
          <span>{{ lockInfo.locked_by.username }} 正在编辑导航栏</span>
          <span class="ml-auto text-xs opacity-70">{{ formatLockTime(lockInfo.locked_at) }}</span>
        </div>
      </div>
    </Sidebar>
  </TooltipProvider>
</template>
