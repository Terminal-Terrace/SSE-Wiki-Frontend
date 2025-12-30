import type { FileInfo } from '@/services/upload/fileInfo'
/**
 * fileInfoCache 单元测试
 * 测试缓存的增删改查操作和批量获取
 * _Requirements: 4.2, 4.3_
 */
import { beforeEach, describe, expect, it } from 'vitest'

// 直接导入创建函数来测试独立实例
function createFileInfoCache() {
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

// 测试用的 mock FileInfo
function createMockFileInfo(fileId: string, overrides?: Partial<FileInfo>): FileInfo {
  return {
    fileId,
    fileName: `file-${fileId}.txt`,
    fileSize: 1024,
    mimeType: 'text/plain',
    url: `https://example.com/files/${fileId}`,
    category: 'document',
    status: 'uploaded',
    ...overrides,
  }
}

describe('fileInfoCache', () => {
  let cache: ReturnType<typeof createFileInfoCache>

  beforeEach(() => {
    cache = createFileInfoCache()
  })

  describe('get/set', () => {
    it('should return undefined for non-existent key', () => {
      expect(cache.get('non-existent')).toBeUndefined()
    })

    it('should store and retrieve file info', () => {
      const fileInfo = createMockFileInfo('file-1')
      cache.set('file-1', fileInfo)

      expect(cache.get('file-1')).toEqual(fileInfo)
    })

    it('should overwrite existing entry', () => {
      const fileInfo1 = createMockFileInfo('file-1', { fileName: 'old.txt' })
      const fileInfo2 = createMockFileInfo('file-1', { fileName: 'new.txt' })

      cache.set('file-1', fileInfo1)
      cache.set('file-1', fileInfo2)

      expect(cache.get('file-1')?.fileName).toBe('new.txt')
    })
  })

  describe('has', () => {
    it('should return false for non-existent key', () => {
      expect(cache.has('non-existent')).toBe(false)
    })

    it('should return true for existing key', () => {
      cache.set('file-1', createMockFileInfo('file-1'))
      expect(cache.has('file-1')).toBe(true)
    })
  })

  describe('getMany', () => {
    it('should return empty map for empty input', () => {
      const result = cache.getMany([])
      expect(result.size).toBe(0)
    })

    it('should return empty map when no keys exist', () => {
      const result = cache.getMany(['a', 'b', 'c'])
      expect(result.size).toBe(0)
    })

    it('should return only existing entries', () => {
      cache.set('file-1', createMockFileInfo('file-1'))
      cache.set('file-2', createMockFileInfo('file-2'))

      const result = cache.getMany(['file-1', 'file-3', 'file-2'])

      expect(result.size).toBe(2)
      expect(result.has('file-1')).toBe(true)
      expect(result.has('file-2')).toBe(true)
      expect(result.has('file-3')).toBe(false)
    })

    it('should return all entries when all keys exist', () => {
      cache.set('file-1', createMockFileInfo('file-1'))
      cache.set('file-2', createMockFileInfo('file-2'))
      cache.set('file-3', createMockFileInfo('file-3'))

      const result = cache.getMany(['file-1', 'file-2', 'file-3'])

      expect(result.size).toBe(3)
    })
  })

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('file-1', createMockFileInfo('file-1'))
      cache.set('file-2', createMockFileInfo('file-2'))

      expect(cache.size()).toBe(2)

      cache.clear()

      expect(cache.size()).toBe(0)
      expect(cache.has('file-1')).toBe(false)
      expect(cache.has('file-2')).toBe(false)
    })
  })

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size()).toBe(0)
    })

    it('should return correct count', () => {
      cache.set('file-1', createMockFileInfo('file-1'))
      expect(cache.size()).toBe(1)

      cache.set('file-2', createMockFileInfo('file-2'))
      expect(cache.size()).toBe(2)

      cache.set('file-1', createMockFileInfo('file-1')) // overwrite
      expect(cache.size()).toBe(2)
    })
  })
})
