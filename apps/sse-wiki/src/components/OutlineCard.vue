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
}

const props = withDefaults(defineProps<Props>(), {
  isSidebar: false,
})
const headings = ref<Heading[]>([])
const activeHeading = ref('')
const scrollProgress = ref(0)

function extractHeadings(markdown: string): Heading[] {
  const headingRegex = /^(#{1,6}) +(\S.*)$/gm
  const extracted: Heading[] = []

  for (let match = headingRegex.exec(markdown); match !== null; match = headingRegex.exec(markdown)) {
    if (!match[1] || !match[2])
      continue
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4E00-\u9FFF\s-]/g, '') // 保留中文、英文、数字、空格、横线
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    extracted.push({ id, text, level })
  }

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

  const scrollTop = window.scrollY + 100 // 偏移量考虑header高度

  for (let i = headingElements.length - 1; i >= 0; i--) {
    const element = headingElements[i]
    if (element && element.offsetTop <= scrollTop) {
      activeHeading.value = element.id
      break
    }
  }
}

function updateScrollProgress() {
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight - windowHeight
  const scrolled = window.scrollY
  scrollProgress.value = documentHeight > 0 ? (scrolled / documentHeight) * 100 : 0
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
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
