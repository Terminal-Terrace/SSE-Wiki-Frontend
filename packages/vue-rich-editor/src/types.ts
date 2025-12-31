/**
 * 文件信息接口
 * 用户提供的文件上传和获取接口必须返回此格式
 */
export interface FileInfo {
  /** 文件ID */
  fileId: string
  /** 文件名 */
  fileName: string
  /** 文件大小（字节） */
  fileSize: number
  /** MIME 类型 */
  mimeType: string
  /** 文件URL */
  url: string
  /** 文件分类（可选） */
  category?: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other'
  /** 文件是否缺失（可选） */
  missing?: boolean
}

/**
 * 文件处理器接口
 * 通过 Props 注入，实现文件上传和获取逻辑的解耦
 */
export interface FileHandlers {
  /** 文件上传函数（可选） */
  upload?: (file: File, onProgress?: (percent: number) => void) => Promise<FileInfo>
  /** 批量获取文件信息函数（可选） */
  getFileInfo?: (fileIds: string[]) => Promise<FileInfo[]>
}

/**
 * RichEditor 组件 Props
 */
export interface RichEditorProps {
  /** 编辑器内容（v-model） */
  modelValue?: string
  /** 占位符文本 */
  placeholder?: string
  /** 最小高度 */
  minHeight?: string
  /** 最大高度 */
  maxHeight?: string
  /** 是否只读 */
  readonly?: boolean
  /** 是否显示工具栏 */
  showToolbar?: boolean
  /** 是否自动聚焦 */
  autofocus?: boolean
  /** 文件处理器（可选） */
  fileHandlers?: FileHandlers
}

/**
 * RichEditor 组件 Emits
 */
export interface RichEditorEmits {
  /** 内容更新事件 */
  'update:modelValue': [value: string]
  /** 失去焦点事件 */
  'blur': [editor: any]
  /** 获得焦点事件 */
  'focus': [editor: any]
  /** 文件上传进度事件 */
  'upload-progress': [taskId: string, progress: number]
  /** 文件上传错误事件 */
  'upload-error': [taskId: string, error: Error]
  /** 文件上传成功事件 */
  'upload-success': [taskId: string, fileInfo: FileInfo]
  /** 内容变化事件 */
  'change': [content: string]
}

/**
 * RichViewer 组件 Props
 */
export interface RichViewerProps {
  /** 要显示的内容 */
  content: string
  /** 文件处理器（可选，用于内容水合） */
  fileHandlers?: Pick<FileHandlers, 'getFileInfo'>
}
