/**
 * Tiptap FileCard Extension
 * 自定义文件卡片节点，用于在编辑器中嵌入文件
 */
import type { Component } from 'vue'
import { Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import FileCardComponent from '../components/FileCard.vue'
import { createPlaceholder } from './filePlaceholder'

// 导出工具函数
export { fileInfoCache } from './fileInfoCache'
export type { FileInfoCache } from './fileInfoCache'

export { createPlaceholder, extractFileIds, isValidPlaceholder, parsePlaceholders, replacePlaceholder } from './filePlaceholder'
export type { FilePlaceholder } from './filePlaceholder'

export { hydrateContent } from './hydrateContent'

export interface FileCardAttrs {
  fileId: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other'
  width?: number
  height?: number
  align?: 'left' | 'center' | 'right'
  missing?: boolean // 文件是否已失效
}

export const FileCard = Node.create({
  name: 'fileCard',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      fileId: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-file-id'),
        renderHTML: (attributes: any) => ({
          'data-file-id': attributes.fileId,
        }),
      },
      fileName: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-file-name'),
        renderHTML: (attributes: any) => ({
          'data-file-name': attributes.fileName,
        }),
      },
      fileSize: {
        default: 0,
        parseHTML: (element: HTMLElement) => Number(element.getAttribute('data-file-size')) || 0,
        renderHTML: (attributes: any) => ({
          'data-file-size': attributes.fileSize,
        }),
      },
      fileType: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-file-type'),
        renderHTML: (attributes: any) => ({
          'data-file-type': attributes.fileType,
        }),
      },
      fileUrl: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-file-url'),
        renderHTML: (attributes: any) => ({
          'data-file-url': attributes.fileUrl,
        }),
      },
      category: {
        default: 'other',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-category'),
        renderHTML: (attributes: any) => ({
          'data-category': attributes.category,
        }),
      },
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const width = element.getAttribute('data-width')
          return width ? Number(width) : null
        },
        renderHTML: (attributes: any) => {
          if (!attributes.width)
            return {}
          return { 'data-width': attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const height = element.getAttribute('data-height')
          return height ? Number(height) : null
        },
        renderHTML: (attributes: any) => {
          if (!attributes.height)
            return {}
          return { 'data-height': attributes.height }
        },
      },
      align: {
        default: 'left',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-align') || 'left',
        renderHTML: (attributes: any) => ({
          'data-align': attributes.align || 'left',
        }),
      },
      missing: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-missing') === 'true',
        renderHTML: (attributes: any) => {
          if (!attributes.missing)
            return {}
          return { 'data-missing': 'true' }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'file-card',
      },
    ]
  },

  renderHTML({ node }) {
    // 序列化为纯文本占位符 {{file:ID:NAME|w=...,h=...,align=...}}
    // 这样保存到数据库时，content 只包含占位符，不包含 HTML 标签或 URL
    const fileId = node.attrs.fileId || ''
    const fileName = node.attrs.fileName || 'unknown'
    const width = node.attrs.width ?? null
    const height = node.attrs.height ?? null
    const align = node.attrs.align ?? null

    const placeholder = createPlaceholder(fileId, fileName, {
      width: typeof width === 'number' ? width : null,
      height: typeof height === 'number' ? height : null,
      align,
    })

    // 返回纯文本节点
    return ['span', { 'data-type': 'file-placeholder' }, placeholder]
  },

  addNodeView(): any {
    return VueNodeViewRenderer(FileCardComponent as Component)
  },

  addCommands() {
    return {
      setFileCard:
        (attrs: FileCardAttrs) =>
          ({ commands }: any) => {
            return commands.insertContent({
              type: this.name,
              attrs,
            })
          },
    } as any
  },
})
