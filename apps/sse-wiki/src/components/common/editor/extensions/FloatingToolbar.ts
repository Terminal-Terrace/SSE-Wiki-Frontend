import type { EditorView } from '@tiptap/pm/view'
import type { App } from 'vue'
/**
 * TipTap FloatingToolbar Extension
 * 当选中文字时显示浮动工具栏
 */
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { createApp } from 'vue'
import FloatingToolbar from '../components/FloatingToolbar.vue'

export const FloatingToolbarExtension = Extension.create({
  name: 'floatingToolbar',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('floatingToolbar'),
        view: (view: EditorView) => {
          let toolbarElement: HTMLElement | null = null
          let app: App | null = null
          let hideTimeout: ReturnType<typeof setTimeout> | null = null

          const hideToolbar = () => {
            if (hideTimeout) {
              clearTimeout(hideTimeout)
              hideTimeout = null
            }
            if (toolbarElement) {
              toolbarElement.remove()
              toolbarElement = null
            }
            if (app) {
              app.unmount()
              app = null
            }
          }

          // 处理鼠标移动到工具栏上时，保持工具栏显示
          const handleToolbarMouseEnter = () => {
            if (hideTimeout) {
              clearTimeout(hideTimeout)
              hideTimeout = null
            }
          }

          // 处理鼠标离开工具栏时，延迟隐藏
          const handleToolbarMouseLeave = () => {
            const { state } = view
            const { selection } = state
            const { from, to } = selection

            if (from === to) {
              hideTimeout = setTimeout(() => {
                hideToolbar()
              }, 200)
            }
          }

          const showToolbar = (view: EditorView) => {
            const { state } = view
            const { selection } = state
            const { from, to } = selection

            // 只有选中文本时才显示工具栏
            if (from === to) {
              hideToolbar()
              return
            }

            // 清除隐藏定时器
            if (hideTimeout) {
              clearTimeout(hideTimeout)
              hideTimeout = null
            }

            const editor = this.editor

            // 获取选中范围的坐标
            const startCoords = view.coordsAtPos(from)
            const endCoords = view.coordsAtPos(to)

            // 计算工具栏位置（在选中文本的上方居中）
            // 使用选中范围的中间位置作为参考点
            const middlePos = Math.floor((from + to) / 2)
            const middleCoords = view.coordsAtPos(middlePos)

            // 获取工具栏的预计宽度（用于居中）
            const toolbarWidth = 400 // 估算宽度，实际会根据内容调整

            let left = middleCoords.left - toolbarWidth / 2
            const top = Math.min(startCoords.top, endCoords.top)

            // 确保工具栏不会超出视口左侧
            if (left < 10) {
              left = 10
            }

            // 确保工具栏不会超出视口右侧
            const viewportWidth = window.innerWidth
            if (left + toolbarWidth > viewportWidth - 10) {
              left = viewportWidth - toolbarWidth - 10
            }

            // 如果工具栏已存在，更新位置
            if (toolbarElement && app) {
              // 更新位置
              toolbarElement.style.top = `${top - 45}px`
              toolbarElement.style.left = `${left}px`
              return
            }

            // 创建工具栏容器
            toolbarElement = document.createElement('div')
            toolbarElement.style.position = 'fixed'
            toolbarElement.style.zIndex = '9999'
            toolbarElement.style.top = `${top - 45}px`
            toolbarElement.style.left = `${left}px`
            toolbarElement.addEventListener('mouseenter', handleToolbarMouseEnter)
            toolbarElement.addEventListener('mouseleave', handleToolbarMouseLeave)
            document.body.appendChild(toolbarElement)

            // 创建 Vue 应用实例
            app = createApp(FloatingToolbar, {
              editor,
              position: {
                top: top - 45,
                left,
              },
            })

            app.mount(toolbarElement)
          }

          const handleStateChange = (view: EditorView) => {
            const { state } = view
            const { selection } = state
            const { from, to } = selection

            // 如果有选中文本，显示工具栏
            if (from !== to) {
              // 延迟显示，避免在拖拽过程中频繁更新
              if (hideTimeout) {
                clearTimeout(hideTimeout)
              }
              setTimeout(() => {
                showToolbar(view)
              }, 10)
            }
            else {
              // 延迟隐藏，给用户时间点击工具栏
              hideTimeout = setTimeout(() => {
                hideToolbar()
              }, 100)
            }
          }

          // 处理鼠标选择
          const handleMouseUp = () => {
            setTimeout(() => {
              const { state } = view
              const { selection } = state
              const { from, to } = selection

              if (from !== to) {
                showToolbar(view)
              }
            }, 10)
          }

          // 处理点击外部区域
          const handleClick = (event: MouseEvent) => {
            // 如果点击的是工具栏，不隐藏
            if (toolbarElement && toolbarElement.contains(event.target as Node)) {
              return
            }

            // 如果点击的是编辑器外部，检查是否还有选中文本
            const { state } = view
            const { selection } = state
            const { from, to } = selection

            // 如果没有选中文本，隐藏工具栏
            if (from === to) {
              hideToolbar()
            }
          }

          // 添加事件监听
          view.dom.addEventListener('mouseup', handleMouseUp)
          document.addEventListener('mousedown', handleClick)

          return {
            update: handleStateChange,
            destroy: () => {
              view.dom.removeEventListener('mouseup', handleMouseUp)
              document.removeEventListener('mousedown', handleClick)
              if (toolbarElement) {
                toolbarElement.removeEventListener('mouseenter', handleToolbarMouseEnter)
                toolbarElement.removeEventListener('mouseleave', handleToolbarMouseLeave)
              }
              if (hideTimeout) {
                clearTimeout(hideTimeout)
              }
              hideToolbar()
            },
          }
        },
      }),
    ]
  },
})
