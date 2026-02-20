import { resolve } from 'node:path'
import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      router: false,
      ui: {
        colors: {
          primary: 'green',
          neutral: 'slate',
        },
        page: {
          slots: {
            root: 'flex flex-col lg:grid lg:grid-cols-12 lg:gap-6',
            left: 'lg:col-span-2',
            center: 'lg:col-span-6',
            right: 'lg:col-span-4 order-first lg:order-last',
          },
        },
      },
    }),
  ],
  build: {
    outDir: 'dist/viewer',
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      input: resolve(__dirname, 'bridge-viewer/main.ts'),
      output: {
        entryFileNames: 'viewer.js',
        assetFileNames: assetInfo => assetInfo.name?.endsWith('.css') ? 'viewer.css' : 'assets/[name][extname]',
        inlineDynamicImports: true,
      },
    },
  },
})
