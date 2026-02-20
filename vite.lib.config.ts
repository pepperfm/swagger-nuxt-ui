import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist/lib',
    emptyOutDir: true,
    cssCodeSplit: true,
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      name: 'SwaggerNuxtUi',
      formats: ['es', 'cjs'],
      fileName: format => (format === 'es' ? 'index.mjs' : 'index.cjs'),
      cssFileName: 'swagger-ui',
    },
    rollupOptions: {
      external: id => (
        id === 'vue'
        || id === '@vueuse/core'
        || id === '@nuxt/ui'
        || id.startsWith('@nuxt/ui/')
      ),
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
