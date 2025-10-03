# SSE Wiki 客户端

## 快速开始

```sh
# 在仓库根目录安装依赖
pnpm install

# 回到应用目录启动开发服务器
cd apps/sse-wiki
pnpm dev
```

### 环境变量

```sh
# 设置单点登录应用地址
echo "VITE_AUTH_APP_URL=https://auth.example.com" >> .env
```

## 常用脚本

```sh
# 构建（包含类型检查）
pnpm build

# 仅运行类型检查
pnpm type-check

# 代码规范（提交前执行）
pnpm lint

# 预览构建产物
pnpm preview
```

> 所有命令均在 `apps/sse-wiki` 目录下执行。
