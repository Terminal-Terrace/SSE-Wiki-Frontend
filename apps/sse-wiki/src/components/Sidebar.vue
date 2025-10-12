<script setup lang="ts">
import type { ModuleAction, ModuleModalState, ModuleTreeNode } from '@/types/module'
import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@sse-wiki/ui'
import { Edit2, Plus, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useModulePermission } from '@/composables/useModulePermission'
import { moduleApi } from '@/services/moduleApi'
import { useModuleStore } from '@/stores/module'
import CollaboratorsModal from './modals/CollaboratorsModal.vue'
import CreateEditModuleModal from './modals/CreateEditModuleModal.vue'
import DeleteModuleModal from './modals/DeleteModuleModal.vue'
import NavigationTree from './NavigationTree.vue'

// 状态管理
const moduleStore = useModuleStore()

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

// 获取锁状态
async function fetchLockStatus() {
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
      // 更新锁信息
      await fetchLockStatus()
      console.log('已进入编辑模式')
    }
    else {
      // 锁被其他用户占用
      const lockedBy = response.locked_by?.username || '其他用户'
      alert(`无法进入编辑模式\n\n当前导航栏正在被 ${lockedBy} 编辑中，请稍后再试。`)
      console.warn('无法进入编辑模式，锁被其他用户占用:', response)
    }
  }
  catch (err: any) {
    console.error('进入编辑模式失败:', err)
    const errorMsg = err?.message || '未知错误'
    alert(`进入编辑模式失败\n\n${errorMsg}\n\n请检查网络连接或稍后重试。`)
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
    // 更新锁信息
    await fetchLockStatus()
    console.log('已退出编辑模式')
  }
  catch (err: any) {
    console.error('退出编辑模式失败:', err)
    // 即使释放锁失败，也退出编辑模式（可能锁已过期）
    isEditMode.value = false
    const errorMsg = err?.message || '未知错误'
    alert(`释放锁失败\n\n${errorMsg}\n\n已退出编辑模式。`)
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
function handleModalSuccess() {
  closeModal()
  // 重新获取模块树
  fetchModules()
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
  fetchLockStatus()

  // 监听页面卸载事件
  window.addEventListener('beforeunload', handleBeforeUnload)

  // 定期检查锁状态
  const lockCheckInterval = setInterval(fetchLockStatus, 30000) // 每30秒检查一次

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    clearInterval(lockCheckInterval)
    handleBeforeUnload()
  })
})
</script>

<template>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>
          <h1 class="text-xl font-semibold tracking-tight text-foreground">
            知识分类
          </h1>
          <div class="ml-auto flex gap-x-2">
            <!-- 编辑模式切换 -->
            <Button
              v-if="!isEditMode"
              size="sm"
              variant="ghost"
              class="edit-btn"
              :disabled="isLockLoading"
              @click="enterEditMode"
            >
              <Edit2 class="w-3 h-3" />
            </Button>
            <Button
              v-else
              size="sm"
              variant="destructive"
              class="exit-edit-btn"
              @click="exitEditMode"
            >
              <X class="w-3 h-3" />
            </Button>

            <!-- 创建顶级模块 -->
            <Button
              v-if="canCreateTopLevel && isEditMode"
              size="sm"
              variant="ghost"
              class="add-module-btn"
              @click="createTopLevelModule"
            >
              <Plus class="w-3 h-3" />
            </Button>
          </div>
        </SidebarGroupLabel>

        <SidebarGroupContent>
          <!-- 加载状态 -->
          <div v-if="isLoading" class="flex flex-col items-center gap-2 py-6 px-4 text-center text-muted-foreground">
            <div class="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
            <span>加载模块树...</span>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="error" class="flex flex-col items-center gap-2 py-6 px-4 text-center text-muted-foreground">
            <span>{{ error }}</span>
            <Button size="sm" variant="outline" @click="fetchModules">
              重试
            </Button>
          </div>

          <!-- 模块树 -->
          <SidebarMenu v-else>
            <NavigationTree
              v-for="module in (moduleTree || [])"
              :key="module.id"
              :node="module"
              :is-edit-mode="isEditMode"
              @module-action="handleModuleAction"
            />
          </SidebarMenu>

          <!-- 空状态 -->
          <div v-if="!isLoading && !error && (!moduleTree || !moduleTree.length)" class="flex flex-col items-center gap-2 py-6 px-4 text-center text-muted-foreground">
            <span>暂无模块数据</span>
            <span class="text-sm">系统中还没有创建任何模块</span>
            <Button
              v-if="canCreateTopLevel"
              size="sm"
              variant="outline"
              @click="createTopLevelModule"
            >
              创建第一个模块
            </Button>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <!-- 模块管理对话框 -->
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

    <!-- 编辑锁提示 -->
    <div v-if="lockInfo && lockInfo.locked_by && !isEditMode" class="fixed bottom-4 left-4 right-4 bg-muted border border-border rounded-md p-2 px-3 z-[1000] md:left-auto md:right-4">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <Edit2 class="w-4 h-4" />
        <span>{{ lockInfo.locked_by.username }} 正在编辑导航栏</span>
        <span class="ml-auto text-xs opacity-70">{{ formatLockTime(lockInfo.locked_at) }}</span>
      </div>
    </div>
  </Sidebar>
</template>
