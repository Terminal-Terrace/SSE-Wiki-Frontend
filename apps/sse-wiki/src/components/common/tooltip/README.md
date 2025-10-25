# Tooltip 组件

统一的 Tooltip 封装组件。

## 组件列表

### TooltipWrapper - 通用包装器

包裹任何元素。

```vue
<TooltipWrapper tooltip="提示文本">
  <Badge>内容</Badge>
</TooltipWrapper>
```

**Props:**

- `tooltip?: string` - 提示文本
- `side?: 'top' | 'right' | 'bottom' | 'left'` - 显示位置，默认 `bottom`

---

### TooltipButton - 智能按钮

支持纯图标、图标+文字、纯文字三种模式。

```vue
<!-- 纯图标 -->
<TooltipButton :icon="Grid" tooltip="网格视图" @click="handler" />

<!-- 图标+文字 -->
<TooltipButton :icon="Edit2" tooltip="编辑">
编辑
</TooltipButton>

<!-- 纯文字 -->
<TooltipButton tooltip="保存">
保存
</TooltipButton>
```

**Props:**

- `icon?: Component` - 图标组件
- `tooltip?: string` - 提示文本
- `side?: 'top' | 'right' | 'bottom' | 'left'` - 显示位置
- `variant?: ButtonVariant` - 按钮样式，默认 `ghost`
- `size?: ButtonSize` - 按钮大小，默认 `sm`
- `disabled?: boolean` - 是否禁用
- `active?: boolean` - 是否激活（显示高亮背景）

---

### TooltipToggleButton - 切换按钮

用于工具栏切换按钮。

```vue
<ToggleGroup type="single">
  <TooltipToggleButton
    :icon="Bold"
    value="bold"
    tooltip="加粗"
    :pressed="isActive"
    @click="toggle"
  />
</ToggleGroup>
```

**Props:**

- `icon: Component` - 图标组件（必填）
- `value: string` - Toggle 值（必填）
- `tooltip: string` - 提示文本（必填）
- `pressed?: boolean` - 是否按下

---

## 使用场景

| 场景             | 组件                  |
| ---------------- | --------------------- |
| 包裹非按钮元素   | `TooltipWrapper`      |
| 按钮（任何类型） | `TooltipButton`       |
| 工具栏切换按钮   | `TooltipToggleButton` |

## 导入

```typescript
import { TooltipButton, TooltipToggleButton, TooltipWrapper } from '@/components/common/tooltip'
```

## 注意事项

**DropdownMenu 触发器使用原生 title 避免冲突：**

```vue
<DropdownMenuTrigger as-child>
  <Button title="更多操作">
    <MoreVertical />
  </Button>
</DropdownMenuTrigger>
```
