import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

import { cloudflare } from '@cloudflare/vite-plugin'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    server: {
      port: 3001,
      strictPort: true, // 端口占用时报错
      proxy: {
        // 代理认证相关请求到认证服务
        '/api/v1/auth': {
          target: env.VITE_AUTH_SERVICE_URL || 'http://localhost:8081',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      vue(),
      vueDevTools(),
      cloudflare(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
