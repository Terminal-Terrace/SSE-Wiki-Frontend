/**
 * 斜杠命令菜单配置
 */
import type { SlashCommandItem } from '../types'
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Paperclip,
  Quote,
  Sigma,
  Type,
} from 'lucide-vue-next'

/**
 * 创建基础格式命令项
 */
function createBasicFormatItems(): SlashCommandItem[] {
  return [
    {
      title: '文本',
      description: '普通段落文本',
      icon: Type,
      keywords: ['文本', '段落', 'paragraph', 'text'],
      group: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setParagraph().run()
      },
    },
    {
      title: 'H1',
      description: '一级标题',
      icon: Heading1,
      keywords: ['一级标题', 'h1', '标题1', 'heading1'],
      group: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run()
      },
    },
    {
      title: 'H2',
      description: '二级标题',
      icon: Heading2,
      keywords: ['二级标题', 'h2', '标题2', 'heading2'],
      group: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run()
      },
    },
    {
      title: 'H3',
      description: '三级标题',
      icon: Heading3,
      keywords: ['三级标题', 'h3', '标题3', 'heading3'],
      group: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run()
      },
    },
    {
      title: '有序列表',
      icon: ListOrdered,
      keywords: ['有序列表', '数字列表', 'ordered', 'ol'],
      group: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: '无序列表',
      icon: List,
      keywords: ['无序列表', '项目符号', 'bullet', 'ul'],
      group: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: '代码块',
      icon: Code2,
      keywords: ['代码块', 'code', '代码'],
      group: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
      },
    },
    {
      title: '引用',
      icon: Quote,
      keywords: ['引用', 'quote', 'blockquote'],
      group: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
      },
    },
    {
      title: '分隔线',
      icon: Minus,
      keywords: ['分隔线', 'hr', 'divider', 'horizontal'],
      group: '基础',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
    {
      title: '链接',
      icon: LinkIcon,
      keywords: ['链接', 'link', 'url'],
      group: '基础',
      command: ({ editor, range }) => {
        // 触发链接输入对话框（需要在组件中处理）
        const url = prompt('输入链接地址:')
        if (url) {
          editor.chain().focus().deleteRange(range).setLink({ href: url }).run()
        }
      },
    },
    {
      title: 'LaTeX',
      icon: Sigma,
      keywords: ['公式', 'latex', 'math', '数学', 'equation'],
      group: '基础',
      command: ({ editor, range }) => {
        // 触发公式输入对话框（需要在组件中处理）
        const formula = prompt('输入 LaTeX 公式（支持 $...$ 和 $$...$$ 语法）:')
        if (formula) {
          const trimmedFormula = formula.trim()
          if (trimmedFormula.startsWith('$$') && trimmedFormula.endsWith('$$')) {
            // 块级公式
            const blockFormula = trimmedFormula.slice(2, -2).trim()
            ;(editor.chain().focus().deleteRange(range) as any).insertMathBlock(blockFormula).run()
          }
          else if (trimmedFormula.startsWith('$') && trimmedFormula.endsWith('$')) {
            // 行内公式
            const inlineFormula = trimmedFormula.slice(1, -1).trim()
            ;(editor.chain().focus().deleteRange(range) as any).insertMathInline(inlineFormula).run()
          }
          else {
            // 默认作为行内公式
            ;(editor.chain().focus().deleteRange(range) as any).insertMathInline(trimmedFormula).run()
          }
        }
      },
    },
  ]
}

/**
 * 创建常用命令项
 */
function createCommonItems(handleFileUpload: (files: File[], position: number) => Promise<void>): SlashCommandItem[] {
  return [
    {
      title: '图片',
      icon: ImageIcon,
      keywords: ['图片', 'image', 'img', 'photo'],
      group: '常用',
      command: ({ editor, range: _range }) => {
        // 触发文件上传
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
          const files = (e.target as HTMLInputElement).files
          if (files && files.length > 0) {
            const pos = editor.state.selection.from
            await handleFileUpload(Array.from(files), pos)
          }
        }
        input.click()
      },
    },
    {
      title: '文件',
      icon: Paperclip,
      keywords: ['视频', '文件', 'video', 'file', 'attachment'],
      group: '常用',
      command: ({ editor, range: _range }) => {
        // 触发文件上传
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = true
        input.onchange = async (e) => {
          const files = (e.target as HTMLInputElement).files
          if (files && files.length > 0) {
            const pos = editor.state.selection.from
            await handleFileUpload(Array.from(files), pos)
          }
        }
        input.click()
      },
    },
    {
      title: '代码块',
      icon: Code2,
      keywords: ['代码块', 'code', 'codeblock'],
      group: '常用',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
      },
    },
  ]
}

/**
 * 过滤命令项
 */
function filterItems(items: SlashCommandItem[], query: string): SlashCommandItem[] {
  if (!query) {
    return items
  }

  const q = query.toLowerCase()
  return items.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(q)
    const descMatch = item.description?.toLowerCase().includes(q)
    const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(q))
    return titleMatch || descMatch || keywordMatch
  })
}

/**
 * 创建斜杠命令项提供者
 */
export function createSlashCommandItemsProvider(
  handleFileUpload: (files: File[], position: number) => Promise<void>,
): (query: string) => SlashCommandItem[] {
  const allItems = [
    ...createBasicFormatItems(),
    ...createCommonItems(handleFileUpload),
  ]

  return (query: string) => filterItems(allItems, query)
}
