import type { Ref } from 'vue'
import type { FileInfo } from '../types'
/**
 * 内容水合组合式函数
 * 通过 getFileInfo 参数注入文件信息获取逻辑，实现解耦
 */
import { watch } from 'vue'
import { hydrateContent } from '../utils/hydrateContent'

export interface UseContentHydrationOptions {
  /** 编辑器实例 */
  editor: Ref<any>
  /** 初始内容 */
  initialContent: Ref<string> | string
  /** 获取文件信息的函数（可选，未提供则跳过水合） */
  getFileInfo?: (fileIds: string[]) => Promise<FileInfo[]>
}

/**
 * 内容水合组合式函数
 * 监听内容变化，将占位符替换为 file-card 节点
 */
export function useContentHydration(options: UseContentHydrationOptions): void {
  const { editor, initialContent, getFileInfo } = options

  if (!getFileInfo) {
    // 如果未提供 getFileInfo，跳过水合
    return
  }

  // 监听编辑器实例变化，执行初始水合
  watch(editor, async (ed) => {
    if (!ed)
      return

    const content = typeof initialContent === 'string' ? initialContent : initialContent.value
    if (!content)
      return

    try {
      const hydrated = await hydrateContent(content, getFileInfo)
      if (hydrated && hydrated !== ed.getHTML()) {
        ed.commands.setContent(hydrated)
      }
    }
    catch (error) {
      console.error('Failed to hydrate initial content:', error)
    }
  }, { immediate: true })

  // 监听外部内容变化（非编辑器内部编辑导致的变化）
  if (typeof initialContent !== 'string') {
    watch(initialContent, async (newContent) => {
      if (!editor.value || !newContent)
        return

      try {
        const hydrated = await hydrateContent(newContent, getFileInfo)
        if (hydrated && hydrated !== editor.value.getHTML()) {
          editor.value.commands.setContent(hydrated)
        }
      }
      catch (error) {
        console.error('Failed to hydrate content:', error)
      }
    })
  }
}
