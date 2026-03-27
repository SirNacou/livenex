import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
      '@': resolve(__dirname, './src'),
    }
  },
  ssr: {
    external: ['elysia', 'better-auth', 'drizzle-orm', 'pg']
  },
  server: {
    port: 3000,
    middlewareMode: false,
  },
  build: {
    target: 'node20',
    minify: false,
  }
})
