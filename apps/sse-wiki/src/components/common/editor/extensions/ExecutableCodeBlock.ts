/**
 * TipTap ExecutableCodeBlock Extension
 * 支持代码在线运行的代码块扩展
 */
import type { Component } from 'vue'
import type { ExecutableCodeBlockAttrs } from '../types'
import { mergeAttributes, Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ExecutableCodeBlockComponent from '../components/ExecutableCodeBlock.vue'

export type { ExecutableCodeBlockAttrs }

export const ExecutableCodeBlock = Node.create({
  name: 'executableCodeBlock',

  group: 'block',

  content: 'text*',

  code: true,

  defining: true,

  addAttributes() {
    return {
      language: {
        default: 'javascript',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-language') || 'javascript',
        renderHTML: (attributes: any) => ({
          'data-language': attributes.language,
        }),
      },
      code: {
        default: '',
        parseHTML: (element: HTMLElement) => {
          const codeElement = element.querySelector('code')
          return codeElement?.textContent || element.textContent || ''
        },
        renderHTML: (_attributes: any) => ({}),
      },
      executable: {
        default: true,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-executable') !== 'false',
        renderHTML: (attributes: any) => ({
          'data-executable': attributes.executable !== false ? 'true' : 'false',
        }),
      },
      result: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-result') || '',
        renderHTML: (attributes: any) => ({
          'data-result': attributes.result || '',
        }),
      },
      status: {
        default: 'idle',
        parseHTML: (element: HTMLElement) => (element.getAttribute('data-status') as any) || 'idle',
        renderHTML: (attributes: any) => ({
          'data-status': attributes.status || 'idle',
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'pre[data-executable-code-block]',
        preserveWhitespace: 'full',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(HTMLAttributes, {
        'data-executable-code-block': 'true',
        'data-language': node.attrs.language,
        'data-executable': node.attrs.executable !== false ? 'true' : 'false',
        'data-result': node.attrs.result || '',
        'data-status': node.attrs.status || 'idle',
      }),
      ['code', {}, node.attrs.code || ''],
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(ExecutableCodeBlockComponent as Component)
  },

  addCommands() {
    return {
      setExecutableCodeBlock:
        (attrs: Partial<ExecutableCodeBlockAttrs>) =>
          ({ commands }: any) => {
            return commands.insertContent({
              type: this.name,
              attrs,
            })
          },
      updateExecutableCodeBlock:
        (attrs: Partial<ExecutableCodeBlockAttrs>) =>
          ({ commands }: any) => {
            return commands.updateAttributes(this.name, attrs)
          },
    } as any
  },
})
