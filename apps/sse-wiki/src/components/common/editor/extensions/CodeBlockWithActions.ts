/**
 * TipTap CodeBlock with Actions Extension
 * 支持语言自动识别、复制和运行功能的代码块
 */
import type { Component } from 'vue'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import CodeBlockWithActionsComponent from '../components/CodeBlockWithActions.vue'

export const CodeBlockWithActions = CodeBlockLowlight.extend({
  name: 'codeBlock',

  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {
        class: 'code-block',
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(CodeBlockWithActionsComponent as Component)
  },

  addProseMirrorPlugins() {
    const plugins = this.parent?.() || []
    return plugins
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      // 保持原有的快捷键支持，包括 Ctrl+Enter 退出代码块
      'Mod-Enter': () => {
        return this.editor.commands.exitCode()
      },
    }
  },
})
