import type { RouteLocationRaw } from 'vue-router'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'

/**
 * 路由守卫状态机
 *
 * 状态转换：
 * idle → pending → idle (via confirm/cancel)
 */
type GuardState
  = | { status: 'idle' }
    | { status: 'pending', route: RouteLocationRaw }

/**
 * 未保存内容警告 Hook（状态机模式 + flag 方案）
 *
 * 使用显式状态机管理路由守卫逻辑，配合 skipNextGuard flag 简化实现
 *
 * @param hasUnsavedChanges - 计算属性或 ref，判断是否有未保存的内容
 * @returns 对话框状态和操作函数
 *
 * @example
 * ```ts
 * const hasUnsavedChanges = computed(() => content.value !== initialContent.value)
 * const { showConfirmDialog, confirmLeave, cancelLeave, skipGuard } = useUnsavedChangesWarning(hasUnsavedChanges)
 * ```
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: () => boolean) {
  const router = useRouter()

  // 状态机：单一状态源，状态转换明确
  const state = ref<GuardState>({ status: 'idle' })

  // Flag 方案：跳过下一次路由守卫检查（用于保存后跳转场景）
  const skipNextGuard = ref(false)

  // 计算属性：对话框是否显示（基于状态机）
  const showConfirmDialog = computed(() => state.value.status === 'pending')

  // 浏览器关闭/刷新警告
  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (hasUnsavedChanges()) {
      e.preventDefault()
      // returnValue 虽然 deprecated，但仍然是触发浏览器原生确认对话框的标准方式
      // @ts-expect-error - returnValue is deprecated but still the standard way to trigger browser confirmation
      e.returnValue = ''
    }
  }

  // 路由跳转警告（Vue Router 4.x API）
  onBeforeRouteLeave((to) => {
    // Flag 方案：如果设置了 skipNextGuard，跳过检查并重置 flag
    if (skipNextGuard.value) {
      skipNextGuard.value = false
      return true // 放行
    }

    // 状态：idle → pending（检测到未保存内容，阻止导航）
    if (hasUnsavedChanges()) {
      state.value = { status: 'pending', route: to }
      return false // 阻止跳转
    }

    // 状态：idle（没有未保存内容，允许导航）
    return true
  })

  // 确认离开：pending → idle → 触发路由跳转
  function confirmLeave() {
    if (state.value.status === 'pending') {
      const route = state.value.route
      // 重置状态
      state.value = { status: 'idle' }
      // 设置 skipNextGuard，因为用户已经确认离开，即使有未保存内容也应该允许跳转
      skipNextGuard.value = true
      router.push(route)
    }
  }

  // 取消离开：pending → idle
  function cancelLeave() {
    if (state.value.status === 'pending') {
      state.value = { status: 'idle' }
    }
  }

  // 生命周期钩子
  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  /**
   * 跳过下一次路由守卫检查
   * 用于成功保存后的跳转场景
   *
   * Flag 方案：设置 skipNextGuard = true，守卫会在下一次检查时放行
   *
   * @example
   * ```ts
   * skipGuard()
   * router.push({ name: 'ArticleDetail', params: { articleId: 123 } })
   * ```
   */
  function skipGuard() {
    skipNextGuard.value = true
  }

  return {
    showConfirmDialog,
    confirmLeave,
    cancelLeave,
    skipGuard,
  }
}
