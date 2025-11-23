# 富文本编辑器模块

基于 TipTap 的富文本编辑器组件，提供了丰富的编辑功能和扩展能力。

## 功能特性

1. **斜杠命令菜单** - 输入 `/` 触发格式选择菜单
2. **浮动工具栏** - 选中文字时显示格式化选项
3. **可执行代码块** - 支持代码在线运行（JavaScript）
4. **文件上传** - 支持拖拽和粘贴上传文件
5. **Markdown 快捷键** - 支持 Markdown 语法快捷输入

## 目录结构

```
editor/
├── components/          # Vue 组件
│   ├── SlashCommandMenu.vue      # 斜杠命令菜单
│   ├── FloatingToolbar.vue        # 浮动工具栏
│   ├── ExecutableCodeBlock.vue    # 可执行代码块
│   └── ...
├── extensions/         # TipTap 扩展
│   ├── SlashCommandSuggestion.ts  # 斜杠命令扩展
│   ├── FloatingToolbar.ts         # 浮动工具栏扩展
│   └── ExecutableCodeBlock.ts     # 可执行代码块扩展
├── config/            # 配置文件
│   └── slashCommands.ts            # 斜杠命令配置
├── types/             # TypeScript 类型定义
│   └── index.ts                    # 统一类型导出
├── utils/             # 工具函数
│   └── codeExecution.ts            # 代码执行工具
├── ContentEditor.vue   # 主编辑器组件
└── index.ts           # 统一导出
```

## 使用方式

### 基础使用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ContentEditor } from '@/components/common/editor'

const content = ref('')
</script>

<template>
  <ContentEditor
    v-model="content"
    placeholder="开始编写内容..."
    :readonly="false"
    :show-toolbar="true"
  />
</template>
```

### 高级配置

```vue
<template>
  <ContentEditor
    v-model="content"
    min-height="400px"
    max-height="600px"
    :readonly="readonly"
    :show-toolbar="true"
    :autofocus="true"
    @blur="handleBlur"
    @focus="handleFocus"
  />
</template>
```

## 扩展开发

### 添加新的斜杠命令

在 `config/slashCommands.ts` 中添加新的命令项：

```typescript
{
  title: '自定义命令',
  description: '命令描述',
  icon: YourIcon,
  keywords: ['keyword1', 'keyword2'],
  group: '常用',
  command: ({ editor, range }) => {
    // 执行命令逻辑
    editor.chain().focus().deleteRange(range).yourCommand().run()
  },
}
```

### 添加新的代码执行语言

在 `utils/codeExecution.ts` 中添加新的执行函数：

```typescript
export async function executeYourLanguage(code: string): Promise<CodeExecutionResult> {
  // 实现代码执行逻辑
  return {
    success: true,
    output: '执行结果',
  }
}
```

然后在 `executeCodeByLanguage` 函数中添加语言分支。

## 类型定义

所有类型定义都在 `types/index.ts` 中：

- `SlashCommandItem` - 斜杠命令项类型
- `SlashCommandContext` - 命令执行上下文
- `ExecutableCodeBlockAttrs` - 可执行代码块属性
- `FloatingToolbarPosition` - 浮动工具栏位置

## 代码规范

1. **类型安全** - 所有函数和组件都使用 TypeScript 类型
2. **模块化** - 功能按模块划分，职责清晰
3. **可扩展** - 易于添加新功能和扩展
4. **错误处理** - 完善的错误处理机制
5. **代码复用** - 公共逻辑抽取为工具函数

## 注意事项

1. 可执行代码块目前仅支持 JavaScript，其他语言需要后端支持
2. 任务列表和表格功能需要安装对应的 TipTap 扩展
3. 文件上传功能依赖 `@/utils/fileUpload` 工具函数
