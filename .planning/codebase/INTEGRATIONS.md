# External Integrations

**Analysis Date:** 2026-03-30

## APIs & External Services

**Authentication:**
- Better Auth - Full authentication framework
  - SDK/Client: `better-auth` v1.5.3 with `@daveyplate/better-auth-ui` v3.4.0
  - Auth method: Email and password enabled (configured in `src/lib/auth.ts`)
  - TanStack integration: Uses `tanstackStartCookies()` plugin for cookie-based session management
  - Client-side: `createAuthClient` from `better-auth/react` at `src/lib/auth-client.ts`

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `DATABASE_URL` environment variable (configured in `drizzle.config.ts`)
  - Client: `pg` v8.16.3 (node-postgres driver)
  - ORM: Drizzle ORM v0.45.1 with type-safe schema definitions
  - Schema location: `src/db/schema.ts` (empty/not yet populated)
  - Database instance: `src/db/index.ts` - Singleton connection using `drizzle(process.env.DATABASE_URL!, { schema })`
  - Adapter: `drizzleAdapter` from `better-auth/adapters/drizzle` for auth storage
  - Migrations: Managed by drizzle-kit v0.31.9

**File Storage:**
- Local filesystem only - No external file storage service configured

**Caching:**
- React Query (in-memory) - Client-side query caching via TanStack React Query v5.95.2
- No external caching service (Redis, Memcached, etc.) detected

## Authentication & Identity

**Auth Provider:**
- Better Auth (custom/self-hosted)
  - Implementation: Full authentication framework with email/password support
  - Database-backed: Stores sessions and user data in PostgreSQL via Drizzle ORM
  - Cookie-based sessions: TanStack Start cookies plugin handles session persistence
  - UI Provider: `AuthUIProviderTanstack` from `@daveyplate/better-auth-ui` wraps the application
  - Auth route: `/api/auth/$` (catch-all API route at `src/routes/api/auth/$.ts`)
  - Handlers: Both GET and POST requests delegated to `auth.handler(request)`

## Monitoring & Observability

**Error Tracking:**
- Not detected - No external error tracking service (Sentry, etc.) configured

**Logs:**
- Console logging only - Development via browser console and server stdout
- No centralized logging service configured

## CI/CD & Deployment

**Hosting:**
- Not configured in codebase - Deployment target not specified

**CI Pipeline:**
- Not configured in codebase

**Build Output:**
- Vite build target: `npm run build` command available
- Built for full-stack deployment with TanStack React Start + Nitro backend

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string (required, used in `src/db/index.ts`)
- `VITE_APP_TITLE` - Optional client-side app title (VITE_ prefix required)
- `SERVER_URL` - Optional server URL configuration

**Secrets location:**
- `.env` file present (local development)
- `.env.local` file supported (git-ignored local overrides)
- dotenv v17.3.1 loads environment variables for drizzle-kit at runtime

## Webhooks & Callbacks

**Incoming:**
- `/api/auth/$` - Authentication API endpoint (catch-all route)
  - Handles all Better Auth requests (sign-up, sign-in, sign-out, session validation)

**Outgoing:**
- Not detected - No outbound webhook integrations configured

## Development Integration

**State Management Flow:**
1. TanStack Router provides URL-based routing (`src/router.tsx`)
2. TanStack React Query manages server state with devtools at `src/integrations/tanstack-query/root-provider.tsx`
3. Better Auth handles authentication via `src/lib/auth.ts` (server) and `src/lib/auth-client.ts` (client)
4. Database access via Drizzle ORM at `src/db/index.ts`

**Provider Tree:**
- Root providers configured at `src/providers.tsx`
  - TanStackQueryProvider: Query state management
  - AuthUIProviderTanstack: Authentication UI and session management
  - Link integration with router for navigation within auth UI

**Request Handlers:**
- TanStack React Router file-based API routes in `src/routes/api/`
- All auth requests routed through `/api/auth/$` handler to Better Auth framework

---

*Integration audit: 2026-03-30*
