/**
 * TipTap SlashCommand Extension
 * 支持通过输入 '/' 触发命令菜单
 */
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface SlashCommandOptions {
  suggestion: {
    char: string
    allowSpaces?: boolean
    allowedPrefixes?: string[] | null
    startOfLine?: boolean
    decorationTag?: string
    decorationClass?: string
    command?: (props: { editor: any, range: { from: number, to: number }, props: any }) => void
    items?: (query: string) => any[]
    render?: () => {
      onStart?: (props: any) => void
      onUpdate?: (props: any) => void
      onKeyDown?: (props: any) => boolean
      onExit?: () => void
    }
  }
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        allowSpaces: false,
        allowedPrefixes: [' '],
        startOfLine: false,
        decorationTag: 'span',
        decorationClass: 'slash-command-query',
        items: () => [],
        command: () => {},
        render: () => ({}),
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('slashCommand'),
        props: {
          handleKeyDown: (view, event) => {
            if (event.key === 'Escape') {
              const { state } = view
              const { selection } = state
              const { $from } = selection

              // 检查是否在斜杠命令中
              const textBefore = $from.nodeBefore?.textContent || ''
              if (textBefore.endsWith('/')) {
                return true
              }
            }
            return false
          },
        },
      }),
    ]
  },
})
