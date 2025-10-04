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
        // 代理认证相关请求到认证服务
        '/api/v1/auth': {
          target: env.VITE_AUTH_SERVICE_URL || 'http://localhost:8081',
          changeOrigin: true,
          secure: false,
        },
        // 代理其他 API 请求到主服务
        '/api': {
          target: env.VITE_MAIN_SERVICE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      vue(),
      vueJsx(),
      cloudflare(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
