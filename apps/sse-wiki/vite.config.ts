import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

import { cloudflare } from '@cloudflare/vite-plugin'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    server: {
      port: 3000,
      strictPort: true, // 端口占用时报错
      proxy: {
        // 文件上传相关 API 走独立 file-service
        '/api/v1/files': {
          target: env.VITE_FILE_SERVICE_URL || 'http://localhost:3003',
          changeOrigin: true,
          secure: false,
        },
        // 其他 API 仍然走 Node.js Gateway (统一 BFF)
        '/api': {
          target: env.VITE_GATEWAY_URL || 'http://localhost:3002',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      vue(),
      vueJsx(),
      // cloudflare 插件仅在生产构建时启用，避免本地代理冲突
      mode === 'production' && cloudflare(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
