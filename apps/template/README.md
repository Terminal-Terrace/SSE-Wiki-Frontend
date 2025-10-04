# 应用模板

1. 复制本目录并改成目标应用名（如 `apps/auth`）
2. 更新 `package.json`、`wrangler.jsonc` 的 `name`
3. 在 `vite.config.ts` 的 `server.port` / `preview.port` 写上唯一端口
4. 回到仓库根目录执行 `pnpm install`
5. 进入新目录运行 `pnpm dev`
