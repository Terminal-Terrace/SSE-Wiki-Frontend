import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SseWikiVueRichEditor',
      fileName: format => `index.${format === 'es' ? 'mjs' : format}`,
    },
    rollupOptions: {
      external: [
        'vue',
        '@tiptap/vue-3',
        '@tiptap/core',
        '@tiptap/starter-kit',
        '@tiptap/extension-code-block-lowlight',
        '@tiptap/extension-link',
        '@tiptap/extension-placeholder',
        '@tiptap/extension-typography',
        '@tiptap/pm',
        'highlight.js',
        'lowlight',
        '@sse-wiki/ui',
        'lucide-vue-next',
      ],
      output: {
        globals: {
          'vue': 'Vue',
          '@tiptap/vue-3': 'TipTapVue3',
          '@tiptap/core': 'TipTapCore',
          '@sse-wiki/ui': 'SseWikiUi',
        },
      },
    },
  },
})
