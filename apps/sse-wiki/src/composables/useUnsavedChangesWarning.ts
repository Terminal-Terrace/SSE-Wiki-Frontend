import { onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * 未保存内容警告 Hook
 *
 * 用于在用户有未保存的内容时，阻止离开并显示确认对话框
 *
 * @param hasUnsavedChanges - 计算属性或 ref，判断是否有未保存的内容
 * @returns 对话框状态和操作函数
 *
 * @example
 * ```ts
 * const hasUnsavedChanges = computed(() => content.value !== initialContent.value)
 * const { showConfirmDialog, confirmLeave, cancelLeave } = useUnsavedChangesWarning(hasUnsavedChanges)
 * ```
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: () => boolean) {
  const showConfirmDialog = ref(false)
  const pendingLeaveAction = ref<(() => void) | null>(null)
  const skipNextGuard = ref(false)

  // 浏览器关闭/刷新警告
  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (hasUnsavedChanges()) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  // 路由跳转警告
  onBeforeRouteLeave((to, from, next) => {
    // 如果设置了跳过标志，直接放行
    if (skipNextGuard.value) {
      skipNextGuard.value = false
      next()
      return
    }

    if (hasUnsavedChanges()) {
      pendingLeaveAction.value = () => next(true)
      showConfirmDialog.value = true
      next(false) // 先阻止跳转
    }
    else {
      next()
    }
  })

  // 确认离开
  function confirmLeave() {
    showConfirmDialog.value = false
    if (pendingLeaveAction.value) {
      pendingLeaveAction.value()
      pendingLeaveAction.value = null
    }
  }

  // 取消离开
  function cancelLeave() {
    showConfirmDialog.value = false
    pendingLeaveAction.value = null
  }

  /**
   * 触发确认对话框（用于自定义操作，如"返回"按钮）
   * @param onConfirm - 用户确认后执行的回调
   */
  function triggerConfirm(onConfirm: () => void) {
    if (hasUnsavedChanges()) {
      pendingLeaveAction.value = onConfirm
      showConfirmDialog.value = true
    }
    else {
      onConfirm()
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
   */
  function skipGuard() {
    skipNextGuard.value = true
  }

  return {
    showConfirmDialog,
    confirmLeave,
    cancelLeave,
    triggerConfirm,
    skipGuard,
  }
}
