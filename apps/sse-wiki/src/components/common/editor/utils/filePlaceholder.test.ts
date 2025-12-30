/**
 * 文件占位符工具函数测试
 * 包含 Property 9 和 Property 10 的属性测试
 */
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  createPlaceholder,
  extractFileIds,
  isValidPlaceholder,
  parsePlaceholders,
} from './filePlaceholder'

describe('filePlaceholder', () => {
  describe('createPlaceholder', () => {
    it('should create basic placeholder', () => {
      const result = createPlaceholder('abc123', 'test.pdf')
      expect(result).toBe('{{file:abc123:test.pdf}}')
    })

    it('should create placeholder with layout options', () => {
      const result = createPlaceholder('abc123', 'image.png', {
        width: 800,
        height: 600,
        align: 'center',
      })
      expect(result).toBe('{{file:abc123:image.png|w=800,h=600,align=center}}')
    })

    it('should escape colons in filename', () => {
      const result = createPlaceholder('abc123', 'file:with:colons.txt')
      expect(result).toBe('{{file:abc123:file&#58;with&#58;colons.txt}}')
    })

    it('should escape double braces in filename', () => {
      const result = createPlaceholder('abc123', 'file}}name.txt')
      expect(result).toBe('{{file:abc123:file&#125;&#125;name.txt}}')
    })

    it('should ignore null/undefined layout options', () => {
      const result = createPlaceholder('abc123', 'test.pdf', {
        width: null,
        height: undefined,
        align: null,
      })
      expect(result).toBe('{{file:abc123:test.pdf}}')
    })

    it('should round width and height to integers', () => {
      const result = createPlaceholder('abc123', 'test.png', {
        width: 800.7,
        height: 600.3,
      })
      expect(result).toBe('{{file:abc123:test.png|w=801,h=600}}')
    })
  })

  describe('parsePlaceholders', () => {
    it('should parse basic placeholder', () => {
      const content = 'Hello {{file:abc123:test.pdf}} world'
      const result = parsePlaceholders(content)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'abc123',
        name: 'test.pdf',
        match: '{{file:abc123:test.pdf}}',
        index: 6,
      })
    })

    it('should parse placeholder with layout options', () => {
      const content = '{{file:abc123:image.png|w=800,h=600,align=center}}'
      const result = parsePlaceholders(content)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'abc123',
        name: 'image.png',
        width: 800,
        height: 600,
        align: 'center',
      })
    })

    it('should parse multiple placeholders', () => {
      const content = '{{file:id1:file1.pdf}} text {{file:id2:file2.png}}'
      const result = parsePlaceholders(content)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('id1')
      expect(result[1].id).toBe('id2')
    })

    it('should restore escaped colons in filename', () => {
      const content = '{{file:abc123:file&#58;with&#58;colons.txt}}'
      const result = parsePlaceholders(content)
      expect(result[0].name).toBe('file:with:colons.txt')
    })

    it('should restore escaped double braces in filename', () => {
      const content = '{{file:abc123:file&#125;&#125;name.txt}}'
      const result = parsePlaceholders(content)
      expect(result[0].name).toBe('file}}name.txt')
    })

    it('should return empty array for content without placeholders', () => {
      const content = 'Hello world, no placeholders here'
      const result = parsePlaceholders(content)
      expect(result).toHaveLength(0)
    })

    it('should ignore invalid layout values', () => {
      const content = '{{file:abc123:test.png|w=invalid,h=-100,align=invalid}}'
      const result = parsePlaceholders(content)
      expect(result[0].width).toBeUndefined()
      expect(result[0].height).toBeUndefined()
      expect(result[0].align).toBeUndefined()
    })
  })

  describe('extractFileIds', () => {
    it('should extract unique file IDs', () => {
      const content = '{{file:id1:a.pdf}} {{file:id2:b.pdf}} {{file:id1:c.pdf}}'
      const result = extractFileIds(content)
      expect(result).toHaveLength(2)
      expect(result).toContain('id1')
      expect(result).toContain('id2')
    })

    it('should return empty array for content without placeholders', () => {
      const result = extractFileIds('no placeholders')
      expect(result).toHaveLength(0)
    })
  })

  describe('isValidPlaceholder', () => {
    it('should return true for valid placeholder', () => {
      expect(isValidPlaceholder('{{file:abc123:test.pdf}}')).toBe(true)
    })

    it('should return false for invalid placeholder', () => {
      expect(isValidPlaceholder('{{file:abc123}}')).toBe(false)
      expect(isValidPlaceholder('not a placeholder')).toBe(false)
      expect(isValidPlaceholder('{{file:}}')).toBe(false)
    })
  })

  /**
   * Property 9: 占位符往返一致性
   * For any 有效的文件信息 { fileId, fileName, width, height, align }，
   * 执行 parse(serialize(info)) 应该返回与原始信息等价的结果。
   * 特别地，文件名中的特殊字符（冒号、双花括号）应该被正确转义和还原。
   *
   * Validates: Requirements 5.3, 5.4
   */
  describe('property 9: 占位符往返一致性', () => {
    // 生成安全的文件 ID（不含特殊字符）
    const safeFileId = fc.stringMatching(/^[\w-]{1,32}$/)

    // 生成布局选项
    const layoutOptions = fc.record({
      width: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
      height: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
      align: fc.option(fc.constantFrom('left', 'center', 'right') as fc.Arbitrary<'left' | 'center' | 'right'>, { nil: undefined }),
    })

    it('should roundtrip fileId correctly', () => {
      fc.assert(
        fc.property(safeFileId, (fileId) => {
          const placeholder = createPlaceholder(fileId, 'test.txt')
          const parsed = parsePlaceholders(placeholder)
          expect(parsed).toHaveLength(1)
          expect(parsed[0].id).toBe(fileId)
        }),
        { numRuns: 100 },
      )
    })

    it('should roundtrip fileName with special characters correctly', () => {
      fc.assert(
        fc.property(
          safeFileId,
          fc.stringOf(fc.oneof(
            fc.char16bits().filter(c => c !== '\0' && c !== '\n' && c !== '\r'),
          ), { minLength: 1, maxLength: 30 }).map(s => s.replace(/[|{}]/g, '_')), // 过滤掉会破坏格式的字符
          (fileId, name) => {
            const placeholder = createPlaceholder(fileId, name)
            const parsed = parsePlaceholders(placeholder)
            expect(parsed).toHaveLength(1)
            expect(parsed[0].name).toBe(name)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should roundtrip layout options correctly', () => {
      fc.assert(
        fc.property(safeFileId, layoutOptions, (fileId, options) => {
          const placeholder = createPlaceholder(fileId, 'test.txt', options)
          const parsed = parsePlaceholders(placeholder)
          expect(parsed).toHaveLength(1)

          if (options.width !== undefined) {
            expect(parsed[0].width).toBe(options.width)
          }
          else {
            expect(parsed[0].width).toBeUndefined()
          }

          if (options.height !== undefined) {
            expect(parsed[0].height).toBe(options.height)
          }
          else {
            expect(parsed[0].height).toBeUndefined()
          }

          if (options.align !== undefined) {
            expect(parsed[0].align).toBe(options.align)
          }
          else {
            expect(parsed[0].align).toBeUndefined()
          }
        }),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 10: 多占位符解析
   * For any 包含 N 个占位符的内容字符串，parsePlaceholders(content) 应该返回 N 个占位符对象，
   * 每个对象包含正确的 index 位置信息。
   *
   * Validates: Requirements 5.5
   */
  describe('property 10: 多占位符解析', () => {
    // 生成安全的文件 ID (fast-check 不支持 /i flag，用字符类代替)
    const safeFileId = fc.stringMatching(/^[a-z0-9]{1,16}$/i)

    // 生成安全的文件名（不含特殊字符）
    const safeFileName = fc.stringMatching(/^[\w.-]{1,20}$/)

    // 生成占位符
    const placeholder = fc.tuple(safeFileId, safeFileName).map(([id, name]) =>
      createPlaceholder(id, name),
    )

    // 生成分隔文本
    const separator = fc.stringOf(
      fc.char().filter(c => c !== '{' && c !== '}'),
      { minLength: 0, maxLength: 20 },
    )

    it('should parse correct number of placeholders', () => {
      fc.assert(
        fc.property(
          fc.array(placeholder, { minLength: 0, maxLength: 10 }),
          separator,
          (placeholders, sep) => {
            const content = placeholders.join(sep)
            const parsed = parsePlaceholders(content)
            expect(parsed).toHaveLength(placeholders.length)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should have correct index positions', () => {
      fc.assert(
        fc.property(
          fc.array(placeholder, { minLength: 1, maxLength: 5 }),
          (placeholders) => {
            // 用固定分隔符连接
            const sep = ' | '
            const content = placeholders.join(sep)
            const parsed = parsePlaceholders(content)

            expect(parsed).toHaveLength(placeholders.length)

            // 验证每个占位符的 index 是正确的
            for (let i = 0; i < parsed.length; i++) {
              const expectedIndex = content.indexOf(placeholders[i])
              expect(parsed[i].index).toBe(expectedIndex)
              // 验证 match 字段
              expect(parsed[i].match).toBe(placeholders[i])
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should extract unique file IDs correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(safeFileId, safeFileName), { minLength: 1, maxLength: 10 }),
          (items) => {
            const placeholders = items.map(([id, name]) => createPlaceholder(id, name))
            const content = placeholders.join(' ')
            const ids = extractFileIds(content)

            // 提取的 ID 应该是去重后的
            const uniqueIds = [...new Set(items.map(([id]) => id))]
            expect(ids).toHaveLength(uniqueIds.length)
            for (const id of uniqueIds) {
              expect(ids).toContain(id)
            }
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
