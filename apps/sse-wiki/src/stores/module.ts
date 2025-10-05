import type { ModuleTreeNode } from '@/types/module'
// 模块管理状态存储
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import moduleApi from '@/services/moduleApi'

/**
 * 模块管理 Store
 * 负责管理模块树状态、编辑锁状态等
 */
export const useModuleStore = defineStore('module', () => {
  // 状态
  const moduleTree = ref<ModuleTreeNode[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchTime = ref<number>(0)

  // 编辑锁相关状态
  const isEditMode = ref(false)
  const lockInfo = ref<any>(null)

  // 缓存时间（5分钟）
  const CACHE_DURATION = 5 * 60 * 1000

  // 计算属性
  const shouldRefresh = computed(() => {
    return Date.now() - lastFetchTime.value > CACHE_DURATION
  })

  const totalModulesCount = computed(() => {
    const countModules = (nodes: ModuleTreeNode[]): number => {
      return nodes.reduce((count, node) => {
        return count + 1 + (node.children ? countModules(node.children) : 0)
      }, 0)
    }
    return countModules(moduleTree.value)
  })

  // Actions

  /**
   * 获取模块树
   * 如果缓存有效则使用缓存，否则从API获取
   */
  async function fetchModules(forceRefresh = false) {
    if (!forceRefresh && !shouldRefresh.value && moduleTree.value && moduleTree.value.length > 0) {
      return
    }

    try {
      isLoading.value = true
      error.value = null

      const data = await moduleApi.getModuleTree()
      // 处理后端返回 null 的情况
      moduleTree.value = data || []
      lastFetchTime.value = Date.now()
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '获取模块列表失败'
      // 设置为空数组以避免 null 错误
      moduleTree.value = []
      throw err
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * 创建模块
   */
  async function createModule(data: { name: string, parent_id?: number }) {
    try {
      const newModule = await moduleApi.createModule(data)

      // 刷新模块树
      await fetchModules(true)

      return newModule
    }
    catch (err) {
      throw err instanceof Error ? err : new Error('创建模块失败')
    }
  }

  /**
   * 更新模块
   */
  async function updateModule(id: number, data: { name?: string, parent_id?: number }) {
    try {
      const updatedModule = await moduleApi.updateModule(id, data)

      // 刷新模块树
      await fetchModules(true)

      return updatedModule
    }
    catch (err) {
      throw err instanceof Error ? err : new Error('更新模块失败')
    }
  }

  /**
   * 删除模块
   */
  async function deleteModule(id: number) {
    try {
      const result = await moduleApi.deleteModule(id)

      // 刷新模块树
      await fetchModules(true)

      return result
    }
    catch (err) {
      throw err instanceof Error ? err : new Error('删除模块失败')
    }
  }

  /**
   * 根据ID查找模块
   */
  function findModuleById(id: number): ModuleTreeNode | null {
    const findInTree = (nodes: ModuleTreeNode[]): ModuleTreeNode | null => {
      for (const node of nodes) {
        if (node.id === id)
          return node
        if (node.children) {
          const found = findInTree(node.children)
          if (found)
            return found
        }
      }
      return null
    }
    return findInTree(moduleTree.value)
  }

  /**
   * 获取模块路径（面包屑）
   */
  function getModulePath(id: number): ModuleTreeNode[] {
    const path: ModuleTreeNode[] = []

    const findPath = (nodes: ModuleTreeNode[], targetId: number): boolean => {
      for (const node of nodes) {
        path.push(node)

        if (node.id === targetId) {
          return true
        }

        if (node.children && findPath(node.children, targetId)) {
          return true
        }

        path.pop()
      }
      return false
    }

    findPath(moduleTree.value, id)
    return path
  }

  /**
   * 获取编辑锁状态
   */
  async function fetchLockStatus() {
    try {
      const status = await moduleApi.getLockStatus()
      lockInfo.value = status
    }
    catch (err) {
      console.error('获取锁状态失败:', err)
    }
  }

  /**
   * 获取编辑锁
   */
  async function acquireLock() {
    try {
      const result = await moduleApi.acquireLock()

      if (result.success) {
        isEditMode.value = true
        lockInfo.value = {
          locked_by: result.locked_by,
          locked_at: result.locked_at,
        }
      }

      return result
    }
    catch (err) {
      throw err instanceof Error ? err : new Error('获取编辑锁失败')
    }
  }

  /**
   * 释放编辑锁
   */
  async function releaseLock() {
    try {
      await moduleApi.releaseLock()

      isEditMode.value = false
      lockInfo.value = {
        locked_by: null,
        locked_at: null,
      }
    }
    catch (err) {
      throw err instanceof Error ? err : new Error('释放编辑锁失败')
    }
  }

  /**
   * 获取模块协作者列表
   */
  async function getModerators(moduleId: number) {
    try {
      const moderators = await moduleApi.getModerators(moduleId)
      return moderators
    }
    catch (err) {
      throw err instanceof Error ? err : new Error('获取协作者列表失败')
    }
  }

  /**
   * 添加模块协作者
   */
  async function addModerator(moduleId: number, data: { user_id: number, role: 'admin' | 'moderator' }) {
    try {
      const result = await moduleApi.addModerator(moduleId, data)
      return result
    }
    catch (err) {
      throw err instanceof Error ? err : new Error('添加协作者失败')
    }
  }

  /**
   * 移除模块协作者
   */
  async function removeModerator(moduleId: number, userId: number) {
    try {
      const result = await moduleApi.removeModerator(moduleId, userId)
      return result
    }
    catch (err) {
      throw err instanceof Error ? err : new Error('移除协作者失败')
    }
  }

  /**
   * 清空缓存
   */
  function clearCache() {
    moduleTree.value = []
    lastFetchTime.value = 0
    error.value = null
  }

  /**
   * 重置状态
   */
  function reset() {
    clearCache()
    isEditMode.value = false
    lockInfo.value = null
  }

  return {
    // 状态
    moduleTree,
    isLoading,
    error,
    isEditMode,
    lockInfo,

    // 计算属性
    shouldRefresh,
    totalModulesCount,

    // Actions
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    findModuleById,
    getModulePath,
    fetchLockStatus,
    acquireLock,
    releaseLock,
    getModerators,
    addModerator,
    removeModerator,
    clearCache,
    reset,
  }
})
