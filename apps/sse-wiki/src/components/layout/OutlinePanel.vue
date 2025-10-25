<script setup lang="ts">
import { List } from 'lucide-vue-next'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface Heading {
  id: string
  text: string
  level: number
}

interface Props {
  content: string
  isSidebar?: boolean
  scrollContainer?: HTMLElement | null
}

const props = withDefaults(defineProps<Props>(), {
  isSidebar: false,
  scrollContainer: null,
})
const headings = ref<Heading[]>([])
const activeHeading = ref('')
const scrollProgress = ref(0)
const autoDetectedContainer = ref<HTMLElement | null>(null)

// 自动检测可滚动的父容器
function findScrollableParent(element: HTMLElement | null): HTMLElement | null {
  if (!element)
    return null

  let parent = element.parentElement
  while (parent) {
    const overflow = window.getComputedStyle(parent).overflowY
    if (overflow === 'auto' || overflow === 'scroll') {
      return parent
    }
    parent = parent.parentElement
  }
  return null
}

// 获取实际使用的滚动容器
function getScrollContainer(): HTMLElement | Window {
  // 优先使用传入的容器
  if (props.scrollContainer) {
    return props.scrollContainer
  }
  // 其次使用自动检测的容器
  if (autoDetectedContainer.value) {
    return autoDetectedContainer.value
  }
  // 最后使用 window
  return window
}

function extractHeadings(html: string): Heading[] {
  const extracted: Heading[] = []
  if (!html)
    return extracted

  // 解析 HTML 字符串
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // 选择所有标题元素
  const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headingElements.forEach((el) => {
    const level = Number.parseInt(el.tagName[1] || '1')
    const text = el.textContent?.trim() || ''
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4E00-\u9FFF\s-]/g, '') // 保留中文、英文、数字、空格、横线
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    extracted.push({ id, text, level })
  })

  return extracted
}

function getHeadingClass(level: number): string {
  const classes = {
    1: 'pl-0 font-medium',
    2: 'pl-3',
    3: 'pl-6 text-xs',
    4: 'pl-9 text-xs',
    5: 'pl-12 text-xs',
    6: 'pl-15 text-xs',
  }
  return classes[level as keyof typeof classes] || 'pl-3'
}

function scrollToHeading(event: Event) {
  event.preventDefault()
  const target = event.target as HTMLAnchorElement
  const id = target.getAttribute('href')?.substring(1)
  if (id) {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

function updateActiveHeading() {
  const headingElements = headings.value.map(h => document.getElementById(h.id)).filter(Boolean)
  if (headingElements.length === 0)
    return

  const container = getScrollContainer()
  let scrollTop: number

  if (container instanceof Window) {
    // 使用 window 滚动
    scrollTop = window.scrollY + 100

    for (let i = headingElements.length - 1; i >= 0; i--) {
      const element = headingElements[i]
      if (element && element.offsetTop <= scrollTop) {
        activeHeading.value = element.id
        break
      }
    }
  }
  else {
    // 使用自定义滚动容器
    scrollTop = container.scrollTop + 100
    const containerOffsetTop = container.offsetTop

    for (let i = headingElements.length - 1; i >= 0; i--) {
      const element = headingElements[i]
      if (element) {
        // 计算元素相对于容器的位置
        const elementTop = element.offsetTop - containerOffsetTop
        if (elementTop <= scrollTop) {
          activeHeading.value = element.id
          break
        }
      }
    }
  }
}

function updateScrollProgress() {
  const container = getScrollContainer()

  if (container instanceof Window) {
    // 使用 window 滚动
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight - windowHeight
    const scrolled = window.scrollY
    scrollProgress.value = documentHeight > 0 ? (scrolled / documentHeight) * 100 : 0
  }
  else {
    // 使用自定义滚动容器
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    const scrollTop = container.scrollTop
    const scrollableHeight = scrollHeight - clientHeight
    scrollProgress.value = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0
  }
}

function handleScroll() {
  updateActiveHeading()
  updateScrollProgress()
}

watch(() => props.content, (newContent) => {
  headings.value = extractHeadings(newContent)
  // 下一帧添加ID到实际的DOM元素
  requestAnimationFrame(() => {
    addHeadingIds()
  })
}, { immediate: true })

function addHeadingIds() {
  const contentContainer = document.querySelector('.prose')
  if (!contentContainer)
    return

  const headingElements = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6')

  headingElements.forEach((element) => {
    const text = element.textContent?.trim() || ''
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4E00-\u9FFF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (id) {
      element.id = id
    }
  })
}

onMounted(() => {
  // 如果没有传入 scrollContainer，尝试自动检测
  if (!props.scrollContainer) {
    // 等待 DOM 渲染完成后再检测
    requestAnimationFrame(() => {
      const proseContainer = document.querySelector('.prose')
      if (proseContainer) {
        autoDetectedContainer.value = findScrollableParent(proseContainer as HTMLElement)
      }

      // 添加滚动监听
      const container = getScrollContainer()
      if (container instanceof Window) {
        window.addEventListener('scroll', handleScroll, { passive: true })
      }
      else {
        container.addEventListener('scroll', handleScroll, { passive: true })
      }
      handleScroll()
    })
  }
  else {
    // 使用传入的容器
    const container = getScrollContainer()
    if (container instanceof Window) {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }
    else {
      container.addEventListener('scroll', handleScroll, { passive: true })
    }
    handleScroll()
  }
})

onUnmounted(() => {
  const container = getScrollContainer()
  if (container instanceof Window) {
    window.removeEventListener('scroll', handleScroll)
  }
  else {
    container.removeEventListener('scroll', handleScroll)
  }
})
</script>

<template>
  <div
    v-if="headings.length > 0 && isSidebar"
    class="h-full bg-background border rounded-lg shadow-sm p-4 overflow-y-auto sticky top-4"
  >
    <h3 class="font-semibold text-sm text-foreground mb-3 flex items-center">
      <List class="h-4 w-4 mr-2" />
      目录大纲
    </h3>

    <nav class="space-y-1">
      <a
        v-for="heading in headings"
        :key="heading.id"
        :href="`#${heading.id}`"
        class="block text-sm transition-colors hover:text-primary py-1 border-l-2 border-transparent hover:border-primary/50" :class="[
          getHeadingClass(heading.level),
          activeHeading === heading.id ? 'text-primary border-primary font-medium' : 'text-muted-foreground',
        ]"
        @click="scrollToHeading"
      >
        {{ heading.text }}
      </a>
    </nav>

    <!-- 进度指示器 -->
    <div class="mt-4 pt-3 border-t">
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>阅读进度</span>
        <span>{{ Math.round(scrollProgress) }}%</span>
      </div>
      <div class="w-full bg-muted rounded-full h-1 mt-1">
        <div
          class="bg-primary h-1 rounded-full transition-all duration-300"
          :style="{ width: `${scrollProgress}%` }"
        />
      </div>
    </div>
  </div>
</template>
