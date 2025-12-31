/**
 * @sse-wiki/vue-rich-editor 导出入口
 */

// 组件
export { default as RichEditor } from './components/RichEditor.vue'
export { default as RichViewer } from './components/RichViewer.vue'

// Composables
export {
  useContentHydration,
  useFileUpload,
} from './composables'
export type {
  UploadTask,
  UploadTaskStatus,
  UseContentHydrationOptions,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from './composables'

// 扩展
export { FileCard } from './extensions/FileCardExtension'

export type { FileCardAttrs } from './extensions/FileCardExtension'
// 类型
export type {
  FileHandlers,
  FileInfo,
  RichEditorEmits,
  RichEditorProps,
  RichViewerProps,
} from './types'

// Utils
export {
  createPlaceholder,
  extractFileIds,
  fileInfoCache,
  hydrateContent,
  isValidPlaceholder,
  parsePlaceholders,
  replacePlaceholder,
} from './utils'
export type {
  FileInfoCache,
  FilePlaceholder,
} from './utils'
