# External Integrations

**Analysis Date:** 2026-03-30

## APIs & External Services

**No Third-Party APIs Detected**
- No external API integrations (Stripe, Supabase, AWS, etc.) currently implemented
- API surface is self-contained via Elysia backend

**Treaty Type-Safe API Client:**
- Service: Internal Elysia API
- SDK/Client: @elysiajs/eden 1.4.8
- Implementation: `src/server/get-treaty.ts`
- Purpose: Isomorphic type-safe client for server API routes
- Usage: Client-side code can call server endpoints with full type safety via `getTreaty()`

## Data Storage

**Primary Database:**
- Type: PostgreSQL relational database
- Connection: `DATABASE_URL` environment variable
- Connection Driver: pg 8.16.3 (Node.js PostgreSQL client)
- Client/ORM: Drizzle ORM 0.45.1
- Location: `src/db/index.ts` - Creates Drizzle instance with PostgreSQL node-postgres adapter
- Schema Definition: `src/db/schema.ts` (currently empty/not yet populated)

**Database Tools:**
- drizzle-kit 0.31.9 - Migration and schema management
- Commands available:
  - `npm run db:generate` - Generate migrations from schema changes
  - `npm run db:migrate` - Apply pending migrations
  - `npm run db:push` - Push schema changes directly
  - `npm run db:pull` - Introspect database and generate schema
  - `npm run db:studio` - Visual database editor (Drizzle Studio)

**File Storage:**
- Not configured - Application uses no external file storage integration

**Caching:**
- None configured - TanStack Query provides client-side caching of API responses

## Authentication & Identity

**Auth Provider:**
- Type: Custom authentication via better-auth
- Implementation: better-auth 1.5.3
- Client: better-auth/react with type-safe client
- Server: `src/lib/auth.ts` - Server-side authentication instance
- Client: `src/lib/auth-client.ts` - Browser authentication client
- Database Adapter: Drizzle ORM adapter (provider: "pg")
- UI Components: @daveyplate/better-auth-ui 3.4.0 (TanStack integration)

**Authentication Methods:**
- Email & password: Enabled via `emailAndPassword: { enabled: true }`
- Cookies: TanStack Start cookie plugin for secure session management
- Experimental: Joins enabled for enhanced relationship queries

**Integration:**
- Location: `src/providers.tsx` wraps app with AuthUIProviderTanstack
- Client integration: `src/lib/auth-client.ts`
- Router integration: better-auth UI provider bridges router navigation

## Monitoring & Observability

**Error Tracking:**
- Not configured - No Sentry, Rollbar, or similar configured
- Vite config hints at future Sentry support: external marker for `@sentry/*` packages

**Logs:**
- Console-based logging only (no centralized logging configured)

**Development Tools:**
- TanStack DevTools: @tanstack/react-router-devtools and @tanstack/react-query-devtools
  - Router state inspection
  - Query cache visualization
  - Location: `src/integrations/tanstack-query/devtools.tsx` (available in dev mode)

## CI/CD & Deployment

**Hosting:**
- Not configured - Application is ready for deployment but no specific platform configured
- SSR-capable via Nitro and TanStack Start
- Compatible with: Node.js servers, Bun runtime, serverless platforms (Vercel, Netlify, AWS Lambda, etc.)

**CI Pipeline:**
- Not configured - No GitHub Actions, GitLab CI, or similar configured

**Build Output:**
- Destination: `dist/` directory (excluded from git)
- SSR support: TanStack Start SSR + Nitro server

## Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (critical for database operations)
  - Format: `postgresql://user:password@host:port/database`
  - Used by: Drizzle ORM (`src/db/index.ts`) and drizzle-kit

**Optional Environment Variables:**
- `SERVER_URL` - Base URL for server (optional, for production deployments)
  - Validated via Zod in `src/env.ts`
- `VITE_APP_TITLE` - Application title for client (optional, prefixed with VITE_)
  - Validated via Zod in `src/env.ts`

**Environment Management:**
- Tool: @t3-oss/env-core 0.13.10 with Zod schema validation
- Location: `src/env.ts`
- Config: `emptyStringAsUndefined: true` treats empty strings as undefined
- Runtime: import.meta.env for Vite integration
- Prefix validation: Client variables must start with `VITE_`

**Secrets Location:**
- Files: `.env` or `.env.local` (excluded from git via `.gitignore`)
- Loaded by: dotenv 17.3.1 and drizzle-kit
- Note: `.env` is NOT committed; create locally for development

## Webhooks & Callbacks

**Incoming:**
- Not configured - No webhook endpoints for external services

**Outgoing:**
- Not configured - No external webhook integrations

## Development Data Generation

**Faker Integration:**
- Package: @faker-js/faker 10.3.0
- Purpose: Generate realistic seed data for development and testing
- Use cases: User factories, content seeding, test fixtures

## Component & Utility Libraries

**Accessible Primitives:**
- @base-ui/react 1.3.0 - Unstyled, WCAG-compliant component foundations
- Lucide React 1.7.0 - SVG icon library

**UI Components:**
- shadcn components via components.json configuration
- Built on top of @base-ui/react primitives
- Alias mappings configured: `#/components`, `#/components/ui`

---

*Integration audit: 2026-03-30*
