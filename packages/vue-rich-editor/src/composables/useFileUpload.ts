/**
 * 文件上传队列管理组合式函数
 * 支持多文件并发上传、进度追踪、错误隔离和重试
 * 通过 uploadFn 参数注入上传逻辑，实现解耦
 */
import type { ComputedRef, Ref } from 'vue'
import type { FileInfo } from '../types'
import { computed, ref } from 'vue'

export type UploadTaskStatus = 'pending' | 'uploading' | 'success' | 'error'

export interface UploadTask {
  /** 唯一标识（UUID） */
  id: string
  /** 原始文件对象 */
  file: File
  /** 上传状态 */
  status: UploadTaskStatus
  /** 上传进度 0-100 */
  progress: number
  /** 错误信息 */
  error?: string
  /** 上传成功后的文件信息 */
  result?: FileInfo
  /** 创建时间戳 */
  createdAt: number
}

export interface UseFileUploadOptions {
  /** 文件上传函数（可选，未提供则禁用上传功能） */
  uploadFn?: (file: File, onProgress?: (percent: number) => void) => Promise<FileInfo>
  /** 最大并发数，默认 3 */
  maxConcurrent?: number
  /** 上传成功回调 */
  onSuccess?: (task: UploadTask) => void
  /** 上传失败回调 */
  onError?: (task: UploadTask, error: Error) => void
}

export interface UseFileUploadReturn {
  /** 上传队列 */
  uploadQueue: Ref<UploadTask[]>
  /** 是否有文件正在上传 */
  isUploading: ComputedRef<boolean>
  /** 是否启用上传功能 */
  enabled: ComputedRef<boolean>
  /** 添加文件到队列 */
  addFiles: (files: File[]) => void
  /** 重试失败的任务 */
  retryTask: (taskId: string) => void
  /** 移除任务 */
  removeTask: (taskId: string) => void
  /** 清除已完成的任务 */
  clearCompleted: () => void
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 文件上传队列管理组合式函数
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const { uploadFn, maxConcurrent = 3, onSuccess, onError } = options

  const uploadQueue = ref<UploadTask[]>([])

  /** 是否启用上传功能 */
  const enabled = computed(() => !!uploadFn)

  /** 是否有文件正在上传 */
  const isUploading = computed(() =>
    uploadQueue.value.some(task => task.status === 'uploading' || task.status === 'pending'),
  )

  /** 当前正在上传的任务数 */
  function getUploadingCount(): number {
    return uploadQueue.value.filter(task => task.status === 'uploading').length
  }

  /**
   * 处理队列，启动待处理的任务
   */
  function processQueue(): void {
    if (!uploadFn) {
      // 如果未提供上传函数，将所有任务标记为错误
      uploadQueue.value.forEach((task) => {
        if (task.status === 'pending') {
          task.status = 'error'
          task.error = '文件上传功能未启用'
        }
      })
      return
    }

    const uploadingCount = getUploadingCount()
    const availableSlots = maxConcurrent - uploadingCount

    if (availableSlots <= 0)
      return

    // 找出待处理的任务
    const pendingTasks = uploadQueue.value.filter(task => task.status === 'pending')
    const tasksToStart = pendingTasks.slice(0, availableSlots)

    for (const task of tasksToStart) {
      startUpload(task)
    }
  }

  /**
   * 开始上传单个任务
   */
  async function startUpload(task: UploadTask): Promise<void> {
    if (!uploadFn) {
      task.status = 'error'
      task.error = '文件上传功能未启用'
      return
    }

    // 更新状态为上传中
    task.status = 'uploading'
    task.progress = 0
    task.error = undefined

    try {
      const fileInfo = await uploadFn(task.file, (percent: number) => {
        task.progress = percent
      })

      // 上传成功
      task.status = 'success'
      task.progress = 100
      task.result = fileInfo

      onSuccess?.(task)
    }
    catch (error) {
      // 上传失败
      task.status = 'error'
      task.error = error instanceof Error ? error.message : '上传失败'

      onError?.(task, error instanceof Error ? error : new Error('上传失败'))
    }
    finally {
      // 继续处理队列中的其他任务
      processQueue()
    }
  }

  /**
   * 添加文件到上传队列
   */
  function addFiles(files: File[]): void {
    if (!uploadFn) {
      console.warn('文件上传功能未启用，无法添加文件')
      return
    }

    const newTasks: UploadTask[] = files.map(file => ({
      id: generateId(),
      file,
      status: 'pending' as const,
      progress: 0,
      createdAt: Date.now(),
    }))

    uploadQueue.value.push(...newTasks)

    // 开始处理队列
    processQueue()
  }

  /**
   * 重试失败的任务
   */
  function retryTask(taskId: string): void {
    const task = uploadQueue.value.find(t => t.id === taskId)
    if (!task || task.status !== 'error')
      return

    // 重置状态为待处理
    task.status = 'pending'
    task.progress = 0
    task.error = undefined
    task.result = undefined

    // 开始处理队列
    processQueue()
  }

  /**
   * 移除任务
   */
  function removeTask(taskId: string): void {
    const index = uploadQueue.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      uploadQueue.value.splice(index, 1)
    }
  }

  /**
   * 清除已完成的任务（成功或失败）
   */
  function clearCompleted(): void {
    uploadQueue.value = uploadQueue.value.filter(
      task => task.status === 'pending' || task.status === 'uploading',
    )
  }

  return {
    uploadQueue,
    isUploading,
    enabled,
    addFiles,
    retryTask,
    removeTask,
    clearCompleted,
  }
}
