import type { EditorView } from '@tiptap/pm/view'
import type { App } from 'vue'
import type { SlashCommandItem, SlashCommandItemsProvider } from '../types'
/**
 * TipTap SlashCommand Suggestion Extension
 * 处理斜杠命令的自动完成建议
 */
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { createApp } from 'vue'
import SlashCommandMenu from '../components/SlashCommandMenu.vue'

export interface SlashCommandSuggestionOptions {
  items: SlashCommandItemsProvider
  char?: string
  allowSpaces?: boolean
  allowedPrefixes?: string[] | null
  startOfLine?: boolean
}

export const SlashCommandSuggestion = Extension.create<SlashCommandSuggestionOptions>({
  name: 'slashCommandSuggestion',

  addOptions() {
    return {
      items: () => [],
      char: '/',
      allowSpaces: false,
      allowedPrefixes: [' '],
      startOfLine: false,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('slashCommandSuggestion'),
        view: (view: EditorView) => {
          let menuElement: HTMLElement | null = null
          let app: App | null = null

          const hideMenu = () => {
            if (menuElement) {
              menuElement.remove()
              menuElement = null
            }
            if (app) {
              app.unmount()
              app = null
            }
          }

          const updateMenuPosition = (element: HTMLElement, coords: { top: number, left: number, bottom?: number }) => {
            const top = coords.bottom !== undefined ? coords.bottom + 8 : coords.top + 20
            element.style.top = `${top}px`
            element.style.left = `${coords.left}px`
          }

          const showMenu = (view: EditorView, range: { from: number, to: number }, query: string) => {
            const items = this.options.items(query)
            if (items.length === 0) {
              hideMenu()
              return
            }

            const editor = this.editor
            const coords = view.coordsAtPos(range.from) || { top: 0, left: 0 }

            // 如果菜单已存在，更新位置
            if (menuElement) {
              updateMenuPosition(menuElement, coords)
              return
            }

            // 创建菜单容器
            menuElement = document.createElement('div')
            menuElement.style.position = 'fixed'
            menuElement.style.zIndex = '9999'
            updateMenuPosition(menuElement, coords)
            document.body.appendChild(menuElement)

            // 创建 Vue 应用实例
            app = createApp(SlashCommandMenu, {
              items,
              query,
              command: (item: SlashCommandItem) => {
                item.command({ editor, range })
                hideMenu()
              },
            })

            app.mount(menuElement)
          }

          // 监听滚动事件，更新菜单位置
          const handleScroll = () => {
            if (menuElement) {
              const { state } = view
              const { selection } = state
              const { $from } = selection

              // 获取当前行的文本
              const lineStart = $from.before()
              const textBefore = state.doc.textBetween(lineStart, $from.pos, '\n')

              // 检查是否还在斜杠命令状态
              const match = textBefore.match(/\/(\S*)$/)
              if (match && match[1] !== undefined) {
                const from = $from.pos - match[1].length - 1
                const coords = view.coordsAtPos(from) || { top: 0, left: 0 }
                updateMenuPosition(menuElement, coords)
              }
            }
          }

          const handleStateChange = (view: EditorView) => {
            const { state } = view
            const { selection } = state
            const { $from } = selection

            // 安全检查：确保不在顶层节点
            if ($from.depth === 0) {
              hideMenu()
              return
            }

            // 获取当前行的文本
            let lineStart: number
            try {
              lineStart = $from.before()
            }
            catch {
              // 如果无法获取位置，隐藏菜单
              hideMenu()
              return
            }
            const textBefore = state.doc.textBetween(lineStart, $from.pos, '\n')

            // 检查是否以斜杠开头
            const match = textBefore.match(/\/(\S*)$/)
            if (match) {
              const query = match[1] || ''
              const from = $from.pos - query.length - 1
              const to = $from.pos

              // 检查是否允许的前缀
              const charBefore = textBefore[textBefore.length - query.length - 2]
              if (this.options.allowedPrefixes && charBefore && !this.options.allowedPrefixes.includes(charBefore)) {
                hideMenu()
                return
              }

              // 检查是否在行首
              if (this.options.startOfLine && textBefore.trim() !== `/${query}`) {
                hideMenu()
                return
              }

              showMenu(view, { from, to }, query)
            }
            else {
              hideMenu()
            }
          }

          // 添加滚动监听
          const editorDom = view.dom
          const scrollableParents: (HTMLElement | Window)[] = [window]

          // 查找所有可滚动的父元素
          let parent: HTMLElement | null = editorDom.parentElement
          while (parent) {
            const style = window.getComputedStyle(parent)
            if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
              scrollableParents.push(parent)
            }
            parent = parent.parentElement
          }

          // 为所有可滚动元素添加监听
          scrollableParents.forEach((element) => {
            element.addEventListener('scroll', handleScroll, true)
          })

          return {
            update: handleStateChange,
            destroy: () => {
              scrollableParents.forEach((element) => {
                element.removeEventListener('scroll', handleScroll, true)
              })
              hideMenu()
            },
          }
        },
      }),
    ]
  },
})
