import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Data fetching
          'vendor-query': ['@tanstack/react-query', 'axios'],
          // Charts (heavy)
          'vendor-charts': ['recharts'],
          // Spreadsheet / export (heavy)
          'vendor-xlsx': ['xlsx'],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next'],
          // Forms + validation
          'vendor-forms': ['react-hook-form', 'zustand'],
          // UI icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})
