/**
 * TipTap MathBlock Extension
 * 支持 $$$$ 语法自动识别并渲染数学公式
 */
import type { Component } from 'vue'
import { mergeAttributes, Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import MathBlockComponent from '../components/MathBlock.vue'

export interface MathBlockOptions {
  HTMLAttributes: Record<string, any>
}

export const MathBlock = Node.create<MathBlockOptions>({
  name: 'mathBlock',

  group: 'block',

  content: '',

  defining: true,

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'math-block',
      },
    }
  },

  addAttributes() {
    return {
      formula: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-formula') || '',
        renderHTML: (attributes: any) => ({
          'data-formula': attributes.formula,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-math-block]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-math-block': 'true',
        'data-formula': node.attrs.formula,
      }),
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(MathBlockComponent as Component)
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mathBlock'),
        appendTransaction: (transactions, oldState, newState) => {
          // 只在有实际变化时处理
          if (!transactions.some(tr => tr.docChanged)) {
            return null
          }

          let modified = false
          const tr = newState.tr

          // 遍历文档，查找 $$...$$ 模式
          newState.doc.descendants((node, pos) => {
            // 跳过已有的 mathBlock 节点
            if (node.type.name === 'mathBlock') {
              return
            }

            if (node.isText && node.text) {
              const text = node.text

              // 匹配 $$...$$ 块级公式（允许换行和空格）
              const blockMathRegex = /\$\$([^$]+)\$\$/g
              const matches: Array<{ start: number, end: number, formula: string }> = []

              let match: RegExpExecArray | null = null
              // eslint-disable-next-line no-cond-assign
              while ((match = blockMathRegex.exec(text)) !== null) {
                const matchStart = pos + match.index
                const matchEnd = pos + match.index + match[0].length
                const formula = match[1]?.trim() || ''

                if (!formula) {
                  continue
                }

                // 检查起始位置是否在代码块中
                const $pos = newState.doc.resolve(matchStart)
                const nodeAtPos = $pos.parent

                // 如果已经在代码块中，跳过
                if (nodeAtPos.type.name === 'codeBlock' || nodeAtPos.type.name === 'executableCodeBlock') {
                  continue
                }

                matches.push({
                  start: matchStart,
                  end: matchEnd,
                  formula,
                })
              }

              // 从后往前替换，避免位置偏移
              for (let i = matches.length - 1; i >= 0; i--) {
                const matchItem = matches[i]
                if (!matchItem)
                  continue

                const { start, end, formula } = matchItem

                // 创建数学公式节点
                const mathBlockNode = newState.schema.nodes.mathBlock
                if (mathBlockNode) {
                  const mathBlock = mathBlockNode.create({
                    formula,
                  })

                  tr.replaceWith(start, end, mathBlock)
                  modified = true
                }
              }
            }
          })

          return modified ? tr : null
        },
      }),
    ]
  },

  addCommands() {
    return {
      insertMathBlock:
        (formula: string) =>
          ({ commands }: any) => {
            return commands.insertContent({
              type: this.name,
              attrs: { formula },
            })
          },
      insertMathInline:
        (formula: string) =>
          ({ commands }: any) => {
            // 行内公式可以用 span 标签包装
            return commands.insertContent(`$$${formula}$$`)
          },
    } as any
  },
})
