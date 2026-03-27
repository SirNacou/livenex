// Better-auth server instance
// Shared across API routes and SSR context
import { betterAuth } from 'better-auth'
import { db } from '~/lib/db'

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET is not set in environment')
}

// Initialize better-auth with database
export const auth = betterAuth({
  database: {
    db,
    provider: 'pg',
  },
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.BASE_URL || 'https://yourdomain.com'
    : 'http://localhost:3000',
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
  },
  user: {
    additionalFields: {
      name: {
        type: 'string',
        input: true,
      },
    },
  },
})

// Type exports for better-auth
export type Session = any
export type User = any
