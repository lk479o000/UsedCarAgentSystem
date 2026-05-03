import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [vue(), UnoCSS()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ['echarts'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 8900,
    allowedHosts: true,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8902',
        changeOrigin: true,
      },
    },
  },
})
