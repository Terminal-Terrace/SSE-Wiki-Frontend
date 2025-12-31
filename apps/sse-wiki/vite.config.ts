import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

import { cloudflare } from '@cloudflare/vite-plugin'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    // 依赖预构建：排除编辑器包，实现真正的按需加载
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'axios', '@sse-wiki/ui'],
      exclude: ['@sse-wiki/vue-rich-editor'],
    },
    server: {
      port: 3000,
      strictPort: true,
      hmr: {
        overlay: true,
      },
      proxy: {
        // 文件上传相关 API 走独立 file-service
        '/api/v1/files': {
          target: env.VITE_FILE_SERVICE_URL || 'http://localhost:3003',
          changeOrigin: true,
          secure: false,
        },
        // 其他 API 走 Node.js Gateway (统一 BFF)
        '/api': {
          target: env.VITE_GATEWAY_URL || 'http://localhost:3002',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api/v1/files': {
          target: env.VITE_FILE_SERVICE_URL || 'http://localhost:3003',
          changeOrigin: true,
          secure: false,
        },
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
      // Cloudflare 插件仅在部署时启用，避免本地预览时影响 API 代理
      process.env.CLOUDFLARE_DEPLOY === 'true' && cloudflare(),
      visualizer({
        open: false,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),
    build: {
      rollupOptions: {
        output: {
          // 代码分割策略：将代码分割为独立的 chunk，支持按需加载
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'editor': ['@tiptap/core', '@tiptap/vue-3', '@tiptap/starter-kit'],
            'ui': ['@sse-wiki/ui'],
            'utils': ['axios', 'marked', 'highlight.js'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
