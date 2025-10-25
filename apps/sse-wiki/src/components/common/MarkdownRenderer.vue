<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import cpp from 'highlight.js/lib/languages/cpp'

import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
// 导入常用语言支持
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import { marked } from 'marked'
import { computed } from 'vue'

const props = defineProps<Props>()
// 注册语言
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('java', java)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c++', cpp)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('css', css)

interface Props {
  content: string
}

// 配置 marked
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // 支持换行
  highlight: (code, lang) => {
    // 代码高亮
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      }
      catch (e) {
        console.error('Highlight error:', e)
      }
    }
    return code
  },
})

// 渲染 Markdown
const renderedHtml = computed(() => {
  try {
    return marked.parse(props.content)
  }
  catch (e) {
    console.error('Markdown parse error:', e)
    return props.content
  }
})
</script>

<template>
  <div
    class="markdown-body"
    v-html="renderedHtml"
  />
</template>

<style scoped>
/* Markdown 样式 */
.markdown-body {
  font-size: 0.875rem;
  line-height: 1.6;
  word-wrap: break-word;
}

/* 标题 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body :deep(h1) {
  font-size: 1.5em;
  border-bottom: 1px solid hsl(var(--border));
  padding-bottom: 0.3em;
}
.markdown-body :deep(h2) {
  font-size: 1.3em;
  border-bottom: 1px solid hsl(var(--border));
  padding-bottom: 0.3em;
}
.markdown-body :deep(h3) {
  font-size: 1.15em;
}
.markdown-body :deep(h4) {
  font-size: 1em;
}
.markdown-body :deep(h5) {
  font-size: 0.9em;
}
.markdown-body :deep(h6) {
  font-size: 0.85em;
  color: hsl(var(--muted-foreground));
}

/* 段落 */
.markdown-body :deep(p) {
  margin-top: 0;
  margin-bottom: 0.75em;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

/* 列表 */
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-top: 0;
  margin-bottom: 0.75em;
  padding-left: 1.5em;
}

.markdown-body :deep(li) {
  margin-bottom: 0.25em;
}

.markdown-body :deep(li > p) {
  margin-bottom: 0.5em;
}

/* 代码块 */
.markdown-body :deep(pre) {
  margin: 0.75em 0;
  padding: 0.75em;
  overflow: auto;
  background-color: hsl(var(--muted));
  border-radius: 0.375rem;
  border: 1px solid hsl(var(--border));
}

.markdown-body :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border: none;
  font-size: 0.85em;
  line-height: 1.45;
}

/* 行内代码 */
.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 0.85em;
  background-color: hsl(var(--muted));
  border-radius: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
}

/* 引用 */
.markdown-body :deep(blockquote) {
  margin: 0.75em 0;
  padding: 0 1em;
  color: hsl(var(--muted-foreground));
  border-left: 0.25em solid hsl(var(--border));
}

.markdown-body :deep(blockquote > :first-child) {
  margin-top: 0;
}

.markdown-body :deep(blockquote > :last-child) {
  margin-bottom: 0;
}

/* 表格 */
.markdown-body :deep(table) {
  margin: 0.75em 0;
  border-spacing: 0;
  border-collapse: collapse;
  display: block;
  width: max-content;
  max-width: 100%;
  overflow: auto;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  padding: 0.375em 0.75em;
  border: 1px solid hsl(var(--border));
}

.markdown-body :deep(table th) {
  font-weight: 600;
  background-color: hsl(var(--muted));
}

.markdown-body :deep(table tr:nth-child(2n)) {
  background-color: hsl(var(--muted) / 0.3);
}

/* 链接 */
.markdown-body :deep(a) {
  color: hsl(var(--primary));
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

/* 分隔线 */
.markdown-body :deep(hr) {
  height: 0.25em;
  padding: 0;
  margin: 1.5em 0;
  background-color: hsl(var(--border));
  border: 0;
}

/* 粗体和斜体 */
.markdown-body :deep(strong) {
  font-weight: 600;
}

.markdown-body :deep(em) {
  font-style: italic;
}

/* 图片 */
.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.375rem;
  margin: 0.5em 0;
}

/* 删除线 */
.markdown-body :deep(del) {
  text-decoration: line-through;
}

/* 任务列表 */
.markdown-body :deep(input[type='checkbox']) {
  margin-right: 0.5em;
}

/* 代码高亮主题 (基于 GitHub theme) */
.markdown-body :deep(.hljs) {
  color: hsl(var(--foreground));
  background: hsl(var(--muted));
}

.markdown-body :deep(.hljs-comment),
.markdown-body :deep(.hljs-quote) {
  color: hsl(var(--muted-foreground));
  font-style: italic;
}

.markdown-body :deep(.hljs-keyword),
.markdown-body :deep(.hljs-selector-tag),
.markdown-body :deep(.hljs-subst) {
  color: #d73a49;
  font-weight: 600;
}

.markdown-body :deep(.hljs-number),
.markdown-body :deep(.hljs-literal),
.markdown-body :deep(.hljs-variable),
.markdown-body :deep(.hljs-template-variable),
.markdown-body :deep(.hljs-tag .hljs-attr) {
  color: #005cc5;
}

.markdown-body :deep(.hljs-string),
.markdown-body :deep(.hljs-doctag) {
  color: #032f62;
}

.markdown-body :deep(.hljs-title),
.markdown-body :deep(.hljs-section),
.markdown-body :deep(.hljs-selector-id) {
  color: #6f42c1;
  font-weight: 600;
}

.markdown-body :deep(.hljs-type),
.markdown-body :deep(.hljs-class .hljs-title) {
  color: #6f42c1;
}

.markdown-body :deep(.hljs-tag),
.markdown-body :deep(.hljs-name),
.markdown-body :deep(.hljs-attribute) {
  color: #22863a;
  font-weight: 600;
}

.markdown-body :deep(.hljs-regexp),
.markdown-body :deep(.hljs-link) {
  color: #032f62;
}

.markdown-body :deep(.hljs-symbol),
.markdown-body :deep(.hljs-bullet) {
  color: #e36209;
}

.markdown-body :deep(.hljs-built_in),
.markdown-body :deep(.hljs-builtin-name) {
  color: #005cc5;
}

.markdown-body :deep(.hljs-meta) {
  color: #005cc5;
  font-weight: 600;
}

.markdown-body :deep(.hljs-deletion) {
  color: #b31d28;
  background-color: #ffeef0;
}

.markdown-body :deep(.hljs-addition) {
  color: #22863a;
  background-color: #f0fff4;
}

.markdown-body :deep(.hljs-emphasis) {
  font-style: italic;
}

.markdown-body :deep(.hljs-strong) {
  font-weight: 600;
}
</style>
