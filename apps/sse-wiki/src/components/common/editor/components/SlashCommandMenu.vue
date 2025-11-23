<script setup lang="ts">
import type { SlashCommandItem } from '../types'
/**
 * 斜杠命令菜单组件
 * 显示在光标位置，提供格式选择选项
 */
import { ScrollArea } from '@sse-wiki/ui'
import { Type } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Props {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
  query: string
}

const props = defineProps<Props>()

const filteredItems = computed(() => {
  if (!props.query) {
    // 过滤掉"文本"选项
    return props.items.filter(item => item.title !== '文本')
  }

  const query = props.query.toLowerCase()
  return props.items.filter((item) => {
    // 过滤掉"文本"选项
    if (item.title === '文本') {
      return false
    }
    const titleMatch = item.title.toLowerCase().includes(query)
    const descMatch = item.description?.toLowerCase().includes(query)
    const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(query))
    return titleMatch || descMatch || keywordMatch
  })
})

const groupedItems = computed(() => {
  const groups: Record<string, SlashCommandItem[]> = {}
  filteredItems.value.forEach((item) => {
    const group = item.group || '其他'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
  })
  return groups
})

const selectedIndex = ref(0)
const menuRef = ref<HTMLElement | null>(null)
const scrollAreaRef = ref<HTMLElement | null>(null)

watch(filteredItems, () => {
  selectedIndex.value = 0
})

// 确保选中的项在可视区域内（仅键盘导航时）
let isKeyboardNavigation = false

watch(selectedIndex, () => {
  if (isKeyboardNavigation && menuRef.value && scrollAreaRef.value) {
    nextTick(() => {
      const selectedElement = menuRef.value!.querySelector(`[data-index="${selectedIndex.value}"]`) as HTMLElement
      if (selectedElement && scrollAreaRef.value) {
        // scrollAreaRef 是组件实例，通过 $el 或直接查找 DOM
        let scrollContainer: HTMLElement | null = null

        // 尝试多种方式获取 scroll container
        if (scrollAreaRef.value && typeof scrollAreaRef.value === 'object') {
          const el = (scrollAreaRef.value as any).$el || scrollAreaRef.value
          if (el && typeof el.querySelector === 'function') {
            scrollContainer = el.querySelector('[data-radix-scroll-area-viewport]')
          }
        }

        // 如果还没找到，直接从 menuRef 查找
        if (!scrollContainer) {
          scrollContainer = menuRef.value!.querySelector('[data-radix-scroll-area-viewport]')
        }

        if (scrollContainer && typeof scrollContainer.getBoundingClientRect === 'function') {
          const containerRect = scrollContainer.getBoundingClientRect()
          const elementRect = selectedElement.getBoundingClientRect()

          if (elementRect.top < containerRect.top) {
            scrollContainer.scrollTop -= containerRect.top - elementRect.top + 4
          }
          else if (elementRect.bottom > containerRect.bottom) {
            scrollContainer.scrollTop += elementRect.bottom - containerRect.bottom + 4
          }
        }
      }
      isKeyboardNavigation = false
    })
  }
})

function selectItem(item: SlashCommandItem) {
  props.command(item)
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    isKeyboardNavigation = true
    selectedIndex.value = (selectedIndex.value + 1) % filteredItems.value.length
  }
  else if (event.key === 'ArrowUp') {
    event.preventDefault()
    isKeyboardNavigation = true
    selectedIndex.value = selectedIndex.value === 0 ? filteredItems.value.length - 1 : selectedIndex.value - 1
  }
  else if (event.key === 'Enter') {
    event.preventDefault()
    const selectedItem = filteredItems.value[selectedIndex.value]
    if (selectedItem) {
      selectItem(selectedItem)
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  selectedIndex,
  selectItem,
})
</script>

<template>
  <div
    ref="menuRef"
    class="slash-command-menu z-50 w-[240px] rounded-md border bg-popover shadow-lg overflow-hidden"
    @keydown="handleKeyDown"
  >
    <!-- 菜单内容 -->
    <ScrollArea ref="scrollAreaRef" class="max-h-[280px]">
      <div class="py-1">
        <template v-for="(groupItems, groupName) in groupedItems" :key="groupName">
          <!-- 分组标题 -->
          <div
            v-if="Object.keys(groupedItems).length > 1"
            class="px-2 py-0.5 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider"
          >
            {{ groupName }}
          </div>

          <!-- 分组项 -->
          <div
            v-for="(item, itemIndex) in groupItems"
            :key="`${groupName}-${itemIndex}`"
            :data-index="filteredItems.findIndex(i => i === item)"
            class="flex items-center gap-2 rounded-sm px-2 py-1 mx-1 text-sm outline-none cursor-pointer transition-colors"
            :class="{
              'bg-accent': filteredItems.findIndex(i => i === item) === selectedIndex,
              'hover:bg-accent/50': filteredItems.findIndex(i => i === item) !== selectedIndex,
            }"
            @click="selectItem(item)"
            @mouseenter="selectedIndex = filteredItems.findIndex(i => i === item)"
          >
            <!-- 图标 -->
            <div
              class="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground"
              :class="{
                'text-primary': filteredItems.findIndex(i => i === item) === selectedIndex,
              }"
            >
              <component
                :is="item.icon || Type"
                class="h-3.5 w-3.5"
              />
            </div>

            <!-- 标题 -->
            <div
              class="font-medium text-sm leading-none flex-1"
              :class="{
                'text-primary': filteredItems.findIndex(i => i === item) === selectedIndex,
              }"
            >
              {{ item.title }}
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <div
          v-if="filteredItems.length === 0"
          class="px-4 py-6 text-sm text-muted-foreground text-center"
        >
          没有找到匹配项
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<style scoped>
.slash-command-menu {
  animation: slideUp 0.15s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
