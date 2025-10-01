# SSE Wiki 前端大仓

## 1. 项目开发

### 安装 pnpm

```sh
npm i -g pnpm
```

### 安装依赖

```sh
pnpm install
```

### 首次构建 UI 包

```sh
pnpm build
```

### 启动应用

```sh
cd apps/sse-wiki
pnpm dev
```

### 格式化代码（提交前执行）

```sh
pnpm lint
```

### 提交代码

```sh
pnpm -w cz
```

## 2. 引入新组件（shadcn-vue）

```sh
cd packages/ui
pnpm dlx shadcn-vue@latest add <component-name>
pnpm build
```

> `packages/ui` 下的 `pnpm build` 会先执行 `sync-exports` 再打包产物。
