// Eden Treaty setup for type-safe API calls
// Provides isomorphic API access: direct on server, HTTP on client
import { treaty } from '@elysiajs/eden'

// Type stub for runtime fallback - real typing comes from Elysia
type AppType = any

// Create a treaty client that works both server-side and client-side  
export const getTreaty = () => {
  // During SSR (server): direct function call
  // During client nav: HTTP call to /api
  if (typeof window === 'undefined') {
    // Server-side: direct access to Elysia app
    try {
      const { app } = require('~/server/api')
      return treaty<AppType>(app)
    } catch (e) {
      console.error('Failed to get server treaty:', e)
      throw e
    }
  } else {
    // Client-side: HTTP requests
    return treaty<AppType>('http://localhost:3000')
  }
}
