<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

/**
 * Props
 * - text: 显示的文字
 * - maxWidth: 主文字区域的最大宽度
 * - tooltipMaxWidth: 悬浮框的最大宽度
 * - placement: 悬浮框位置（top | bottom）
 * - customClass: 自定义文字类名
 */
const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: '200px', // 控制主文字区域宽度
  },
  tooltipMaxWidth: {
    type: String,
    default: '500px', // 控制悬浮框宽度
  },
  customClass: {
    type: String,
    default: '',
  },
  placement: {
    type: String,
    default: 'top', // 'top' | 'bottom'
    validator: value => ['top', 'bottom'].includes(value),
  },
})

const textRef = ref(null)
const isOverflowing = ref(false)
const showTooltip = ref(false)
let hideTimeout = null
let showTimeout = null
const SHOW_DELAY = 500 // 显示延迟时间

/** 悬浮框位置样式 */
const tooltipStyle = computed(() => {
  if (props.placement === 'bottom') {
    return {
      top: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
    }
  }
  // 默认 top
  return {
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
  }
})

/** 箭头位置样式 */
const arrowStyle = computed(() => {
  if (props.placement === 'bottom') {
    return {
      top: '-4px',
      left: '50%',
      transform: 'translateX(-50%) rotate(45deg)',
    }
  }
  // 默认 top
  return {
    bottom: '-4px',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
  }
})

/** 检查文本是否溢出 */
function checkOverflow() {
  nextTick(() => {
    if (textRef.value) {
      isOverflowing.value = textRef.value.scrollWidth > textRef.value.clientWidth
    }
  })
}

/** 悬浮显示逻辑 */
function handleMouseEnter() {
  // 1. 如果有隐藏定时器（正在准备隐藏），先清除它
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }

  // 2. 如果文本溢出且尚未设置显示定时器，则设置延迟
  if (isOverflowing.value && !showTimeout) {
    // 确保任何旧的显示定时器被清除 (保险起见)
    if (showTimeout)
      clearTimeout(showTimeout)

    // 设置 1 秒的延迟
    showTimeout = setTimeout(() => {
      showTooltip.value = true
      showTimeout = null // 成功显示后，清除定时器引用
    }, SHOW_DELAY)
  }
}

function handleMouseLeave() {
  // 1. 如果有显示定时器（正在等待显示），先清除它，阻止 Tooltip 弹出
  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }

  // 2. 设置 100 毫秒的隐藏延迟
  hideTimeout = setTimeout(() => {
    showTooltip.value = false
    hideTimeout = null // 成功隐藏后，清除定时器引用
  }, 100)
}

/** 生命周期与监听 */
onMounted(() => {
  checkOverflow()
  window.addEventListener('resize', checkOverflow)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkOverflow)
  // 确保在组件卸载时清除所有定时器
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }
  if (showTimeout) { // <--- 新增：清除显示定时器
    clearTimeout(showTimeout)
  }
})

watch(() => props.text, checkOverflow, { immediate: true })
</script>

<template>
  <div class="relative inline-block overflow-visible">
    <!-- 主显示文字 -->
    <span
      ref="textRef"
      class="inline-block truncate" :class="[customClass]"
      :style="{ maxWidth }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      {{ text }}
    </span>

    <!-- 悬浮显示框 Tooltip -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="showTooltip && isOverflowing"
        class="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none break-words"
        :style="{
          ...tooltipStyle,
          width: 'max-content',
          maxWidth: tooltipMaxWidth,
          whiteSpace: 'normal',
        }"
      >
        {{ text }}
        <!-- 小箭头 -->
        <div class="absolute w-2 h-2 bg-gray-900 transform rotate-45" :style="arrowStyle" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 可选优化：为 tooltip 添加阴影和层次感 */
</style>
