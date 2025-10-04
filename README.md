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

### 环境变量配置

在启动应用前，需要配置环境变量：

目前无特殊配置，直接把 `apps/sse-wiki/.env.example`, `apps/auth/.env` 复制并重命名为 `.env` 即可 

### 首次构建 UI 包

```sh
pnpm build
```

### 启动应用

#### 启动 SSE-Wiki 主应用

```sh
cd apps/sse-wiki
pnpm dev
```

#### 启动认证应用

```sh
cd apps/auth
pnpm dev
```

> 注意：认证功能需要同时启动两个前端应用和对应的后端服务

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

## 3. 认证系统架构

### 应用架构

- **SSE-Wiki 主应用** (`apps/sse-wiki`): 端口 3000
  - 主要的知识库功能
  - 包含登录按钮和认证状态显示
  
- **认证应用** (`apps/auth`): 端口 3001
  - 独立的登录/注册页面
  - 处理用户认证流程

### 认证流程

1. 用户在 SSE-Wiki 主应用点击登录按钮
2. 调用预登录接口获取 state 参数
3. 跳转到认证应用的登录页面
4. 用户输入凭据并登录
5. 登录成功后重定向回 SSE-Wiki 主应用
6. 主应用处理登录回调并更新认证状态

### 后端服务要求

- **主服务**: `http://localhost:8080` - 处理业务逻辑
- **认证服务**: `http://localhost:8081` - 处理认证相关 API
