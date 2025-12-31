/**
 * 文件信息缓存模块
 * 用于缓存已获取的文件元数据，避免重复请求
 */
import type { FileInfo } from '../types'

export interface FileInfoCache {
  /** 获取单个文件信息 */
  get: (fileId: string) => FileInfo | undefined
  /** 设置单个文件信息 */
  set: (fileId: string, info: FileInfo) => void
  /** 检查是否存在 */
  has: (fileId: string) => boolean
  /** 批量获取文件信息 */
  getMany: (fileIds: string[]) => Map<string, FileInfo>
  /** 清空缓存 */
  clear: () => void
  /** 获取缓存大小 */
  size: () => number
}

/**
 * 创建文件信息缓存实例
 */
function createFileInfoCache(): FileInfoCache {
  const cache = new Map<string, FileInfo>()

  return {
    get(fileId: string): FileInfo | undefined {
      return cache.get(fileId)
    },

    set(fileId: string, info: FileInfo): void {
      cache.set(fileId, info)
    },

    has(fileId: string): boolean {
      return cache.has(fileId)
    },

    getMany(fileIds: string[]): Map<string, FileInfo> {
      const result = new Map<string, FileInfo>()
      for (const fileId of fileIds) {
        const info = cache.get(fileId)
        if (info) {
          result.set(fileId, info)
        }
      }
      return result
    },

    clear(): void {
      cache.clear()
    },

    size(): number {
      return cache.size
    },
  }
}

/** 全局文件信息缓存实例 */
export const fileInfoCache = createFileInfoCache()
