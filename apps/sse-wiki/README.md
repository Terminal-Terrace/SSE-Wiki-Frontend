# SSE Wiki 客户端

## 说明

前端使用 `camelCase`，API 层暂时通过 `toCamelCase()` 将 BFF 的 `snake_case` 转换为 `camelCase`。
暂时先写了个 toCamelCase() 函数进行转换

**使用方法：**

在 API 服务文件中（如 `src/services/articleApi.ts`、`src/services/moduleApi.ts`），调用 API 后使用 `toCamelCase()` 转换：

```typescript
import { toCamelCase } from '@/utils/convert'

// 单个对象转换
async getArticle(id: number): Promise<Page> {
  const resp = await request.get(`${this.baseURL}/${id}`)
  return toCamelCase<Page>(resp)
}

// 数组转换
async getModuleTree(): Promise<ModuleTreeNode[]> {
  const data = await request.get(this.baseURL)
  return toCamelCase<ModuleTreeNode[]>(data || [])
}
```

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
