import { defineConfig } from '@tanstack/react-start/config'
import { resolve } from 'path'

export default defineConfig({
  ssr: true,
  vite: {
    resolve: {
      alias: {
        '~': resolve(__dirname, './src'),
        '@': resolve(__dirname, './src'),
      }
    },
    ssr: {
      external: ['elysia', 'better-auth', 'drizzle-orm', 'pg']
    }
  }
})
