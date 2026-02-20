import { resolve } from 'node:path'
import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      router: false,
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
