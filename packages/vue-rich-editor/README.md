# @sse-wiki/vue-rich-editor

Vue 3 富文本编辑器组件，基于 TipTap。

## 特性

- ✅ 基于 TipTap，功能丰富
- ✅ 支持文件上传（通过 Props 注入）
- ✅ 支持内容水合（通过 Props 注入）
- ✅ 双组件设计：RichEditor（可编辑）和 RichViewer（只读）
- ✅ 文件功能可选，不传 `fileHandlers` 则禁用
- ✅ 样式可定制（CSS 变量）

## 安装

```bash
pnpm add @sse-wiki/vue-rich-editor
```

## 使用

### RichEditor（可编辑）

```vue
<script setup lang="ts">
import { RichEditor } from '@sse-wiki/vue-rich-editor'
import '@sse-wiki/vue-rich-editor/styles'

const content = ref('')

const fileHandlers = {
  upload: async (file: File, onProgress?: (percent: number) => void) => {
    // 实现文件上传逻辑
    return {
      fileId: 'xxx',
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      url: 'https://example.com/file.jpg',
    }
  },
  getFileInfo: async (fileIds: string[]) => {
    // 实现批量获取文件信息逻辑
    return []
  },
}
</script>

<template>
  <RichEditor
    v-model="content"
    :file-handlers="fileHandlers"
    placeholder="开始编写内容..."
  />
</template>
```

### RichViewer（只读）

```vue
<script setup lang="ts">
import { RichViewer } from '@sse-wiki/vue-rich-editor'
import '@sse-wiki/vue-rich-editor/styles'

const content = '...'

const fileHandlers = {
  getFileInfo: async (fileIds: string[]) => {
    // 实现批量获取文件信息逻辑
    return []
  },
}
</script>

<template>
  <RichViewer
    :content="content"
    :file-handlers="fileHandlers"
  />
</template>
```

## API

### RichEditor Props

- `modelValue?: string` - 编辑器内容（v-model，双向绑定）
- `fileHandlers?: FileHandlers` - 文件处理函数（可选）
  - `upload?: (file: File, onProgress?: (percent: number) => void) => Promise<FileInfo>`
  - `getFileInfo?: (fileIds: string[]) => Promise<FileInfo[]>`
- `placeholder?: string` - 占位符文本
- `readonly?: boolean` - 是否只读
- `minHeight?: string` - 最小高度（CSS 值，如 "400px"）
- `maxHeight?: string` - 最大高度（CSS 值）
- `showToolbar?: boolean` - 是否显示工具栏（默认 true）
- `autofocus?: boolean` - 是否自动聚焦

### RichEditor Events

- `update:modelValue` - 内容更新事件
- `blur` - 失去焦点事件
- `focus` - 获得焦点事件
- `upload-progress` - 文件上传进度事件
- `upload-error` - 文件上传错误事件
- `upload-success` - 文件上传成功事件
- `change` - 内容变化事件

### RichViewer Props

- `content: string` - 要显示的内容（必需）
- `fileHandlers?: { getFileInfo?: (fileIds: string[]) => Promise<FileInfo[]> }` - 文件处理函数（可选，用于内容水合）

### Types

```typescript
interface FileInfo {
  fileId: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  category?: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other'
  missing?: boolean
}

interface FileHandlers {
  upload?: (file: File, onProgress?: (percent: number) => void) => Promise<FileInfo>
  getFileInfo?: (fileIds: string[]) => Promise<FileInfo[]>
}
```
