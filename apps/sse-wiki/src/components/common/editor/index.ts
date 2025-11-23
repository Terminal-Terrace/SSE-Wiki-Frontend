// 配置
export { createSlashCommandItemsProvider } from './config/slashCommands'

/**
 * 编辑器模块统一导出
 */
export { default as ContentEditor } from './ContentEditor.vue'
export { CodeBlockWithActions } from './extensions/CodeBlockWithActions'
export { FloatingToolbarExtension } from './extensions/FloatingToolbar'
export { MathBlock } from './extensions/MathBlock'

// 扩展
export { SlashCommandSuggestion } from './extensions/SlashCommandSuggestion'

// 类型
export type {
  EditorRange,
  FloatingToolbarPosition,
  SlashCommandContext,
  SlashCommandItem,
  SlashCommandItemsProvider,
} from './types'

// 工具函数
export { executeCodeByLanguage, executeJavaScript, executePython } from './utils/codeExecution'
export type { CodeExecutionResult } from './utils/codeExecution'
