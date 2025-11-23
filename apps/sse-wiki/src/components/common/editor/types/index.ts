/**
 * 编辑器相关类型定义
 */
import type { Editor } from '@tiptap/core'

export interface EditorRange {
  from: number
  to: number
}

export interface SlashCommandContext {
  editor: Editor
  range: EditorRange
}

export interface SlashCommandItem {
  title: string
  description?: string
  icon?: any
  keywords?: string[]
  command: (context: SlashCommandContext) => void
  group?: string
}

export interface SlashCommandItemsProvider {
  (query: string): SlashCommandItem[]
}

export interface ExecutableCodeBlockAttrs {
  language?: string
  code?: string
  executable?: boolean
  result?: string
  status?: 'idle' | 'running' | 'success' | 'error'
}

export interface FloatingToolbarPosition {
  top: number
  left: number
}
