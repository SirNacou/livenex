# TanStack Start + ElysiaJS Integration Research

**Research Date:** 2026-03-27  
**Phase:** 1.1 - Project Structure & Organization (Follow-up)  
**Status:** Planning-ready  
**Confidence Level:** HIGH

---

## Executive Summary

This research addresses the **architectural integration** of TanStack Start (RC) as the frontend/routing layer with ElysiaJS as the HTTP foundation for both API and server functions. The goal is to unify the currently-separated packages (frontend, backend, shared) into a **single full-stack application** while maintaining clean boundaries, type safety, and the security/auth patterns established in Phase 1.

**Primary Recommendation:** Implement the **TanStack Start + ElysiaJS unified pattern** where:
1. TanStack Start owns the routing, SSR, and page/layout structure
2. ElysiaJS runs inside TanStack Start's server handlers (via `src/routes/api.$.ts`)
3. Both layers share the same Node.js runtime, database connection, and auth context
4. Frontend components use `getTreaty()` for type-safe, zero-HTTP-overhead server calls during SSR
5. API clients use Eden Treaty for type-safe HTTP calls on the browser side

This approach eliminates the complexity of managing separate frontend/backend deployments while maintaining the flexibility to split if needed later.

---

## Current State

### Existing Structure (3 Packages)

```
packages/
├── frontend/          (@livenex/frontend)
│   ├── package.json   (TanStack Start, React 19, Tailwind, shadcn/ui)
│   └── src/           (UI components, routes, loaders)
├── backend/           (@livenex/backend)
│   ├── package.json   (ElysiaJS, better-auth, Drizzle)
│   └── src/           (API routes, services, middleware)
└── shared/            (@livenex/shared)
    ├── package.json   (Types, schemas, utilities)
    └── types/         (Zod schemas, TypeScript interfaces)
```

**Key Problems:**
- ✗ Separate build processes (2 dev servers, 2 deployments)
- ✗ API boundary overhead (HTTP calls even during SSR)
- ✗ Duplicate dependency management (shared copies of React, zod, etc.)
- ✗ Auth context must be passed via headers (no shared memory during SSR)
- ✗ Database connection pooling split across 2 processes

### Target State (Unified)

```
livenex/                          (monorepo or single package)
├── package.json                  (Unified dependencies)
├── vite.config.ts                (TanStack Start config with ElysiaJS handler)
├── tsconfig.json
├── src/
│   ├── routes/
│   │   ├── __root.tsx            (Root layout, auth boundary)
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   └── logout.tsx
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── api.$.ts              ← ElysiaJS mounted here
│   │   └── status.$index.tsx      (Public status pages)
│   ├── lib/
│   │   ├── auth.ts               (better-auth instance, shared)
│   │   ├── db.ts                 (Drizzle client, shared)
│   │   ├── api.ts                (Eden Treaty client)
│   │   └── server.ts             (Server-only utilities)
│   ├── server/                   (New: Server code)
│   │   ├── api/                  (ElysiaJS API definition)
│   │   │   ├── auth.ts           (Auth routes)
│   │   │   ├── keys.ts           (API key routes)
│   │   │   └── index.ts          (Main ElysiaJS app)
│   │   ├── services/             (Business logic)
│   │   ├── db/                   (Drizzle schema, migrations)
│   │   └── middleware/
│   ├── components/               (React components, shared)
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── ...
│   └── types/                    (Shared type definitions)
│       ├── schemas.ts
│       ├── api.ts
│       └── auth.ts
├── db/                           (Drizzle migrations)
│   └── migrations/
└── docker-compose.yml            (PostgreSQL, Redis)
```

---

## Integration Pattern Explained

### 1. How ElysiaJS Fits Inside TanStack Start

**Official Pattern (from elysiajs.com/integrations/tanstack-start.html):**

```typescript
// src/routes/api.$.ts
import { Elysia } from 'elysia'
import { createFileRoute } from '@tanstack/react-router'

const app = new Elysia({
  prefix: '/api'
}).get('/', 'Hello!')

const handle = ({ request }: { request: Request }) => 
  app.fetch(request)

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: handle,
      POST: handle,  // Also handle other methods
      PUT: handle,
      DELETE: handle,
      PATCH: handle
    }
  }
})
```

**What this means:**
- Any request to `/api/*` is routed through this file route
- The `handle` function receives the request and passes it to Elysia
- Elysia routes, validates, and responds
- This runs on the server during SSR (no HTTP overhead on the server)

### 2. Type-Safe Server Calls with Eden Treaty

**Pattern 1: Direct Elysia Call (SSR-only, zero HTTP overhead)**

```typescript
// src/lib/api.ts
import { treaty } from '@elysiajs/eden'
import { createIsomorphicFn } from '@tanstack/react-start'
import { app } from '~/server/api'

export const getTreaty = createIsomorphicFn()
  .server(() => treaty(app).api)        // Direct call on server
  .client(() => treaty<typeof app>('http://localhost:3000').api) // HTTP on client
```

**Pattern 2: Component Usage**

```typescript
// src/routes/dashboard.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getTreaty } from '~/lib/api'

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // During SSR: no HTTP, direct function call
    // During client navigation: HTTP request
    const response = await getTreaty().auth.session.get()
    return response.data
  },
  component: Dashboard
})

function Dashboard() {
  const session = Route.useLoaderData()
  return <div>{session?.user?.email}</div>
}
```

### 3. Shared Resources (Auth, DB, Config)

**before (separate packages):**
```typescript
// backend/src/auth.ts
export const auth = initAuthWithBetter(db)

// frontend makes HTTP request to /api/auth/session
const response = await fetch('/api/auth/session')
```

**after (unified):**
```typescript
// src/lib/auth.ts
export const auth = initAuthWithBetter(db)

// During SSR, server calls directly:
const session = await auth.api.getSession()

// During client navigation, Eden Treaty makes HTTP:
const response = await getTreaty().auth.session.get()
```

---

## Key Architecture Decisions

### Decision 1: Monorepo vs Single Package

**Option A: Single Package (RECOMMENDED)**
- ✓ Simpler dependency management (one package.json)
- ✓ Unified vite.config.ts and tsconfig.json
- ✓ Easier IDE indexing and refactoring
- ✓ Faster local dev (one install, one build)
- ✗ Requires more discipline in file organization

**Option B: Monorepo (pnpm workspaces)**
- ✓ Can keep separate packages for re-use
- ✗ pnpm auto-install complexity (mentioned in ElysiaJS docs)
- ✗ Still need shared package across frontend+backend

**Recommendation:** Start with **single package** — easier to refactor later if needed.

### Decision 2: Server Code Location

**Option A: `src/server/` directory (RECOMMENDED)**
- All server-only code lives in `src/server/`
- Elysia API defined in `src/server/api/`
- Drizzle schema in `src/server/db/`
- Imports: `import { app } from '~/server/api'`
- Clear visual separation

**Option B: Mix in `src/`**
- Elysia routes alongside React routes
- Harder to distinguish server vs client code
- Risk of accidental server imports in client code

**Recommendation:** Use **`src/server/`** directory for clarity.

### Decision 3: Build & Deployment

**Current (separate):**
- Frontend: `npm run build` → static assets
- Backend: `npm run build` → Node server
- Deployment: 2 services

**Unified:**
- Single: `npm run build` → SSR-capable Node app
- Deployment: 1 service (same VM, Docker container, or serverless)
- Vite handles bundling + TanStack Start SSR config

**Recommendation:** Treat as **single Node.js application** — deploy once.

---

## Unified Entry Point & Build Process

### Entry Point Structure

```
src/
├── entry.server.ts        (TanStack Start: server entry, handles SSR)
├── routes/
│   ├── __root.tsx         (Root layout, auth layout boundary)
│   ├── api.$.ts           (ElysiaJS mounted → /api/*)
│   └── ... (other routes)
├── server/
│   ├── api/index.ts       (ElysiaJS app definition)
│   ├── db/schema.ts       (Drizzle schema)
│   └── middleware/        (Auth, logging, etc.)
└── lib/                   (Shared utilities)
```

### Build Output

```
dist/
├── client/                (Vite builds here)
│   ├── assets/
│   ├── index.html
│   └── manifest.json
├── server/                (TanStack Start SSR server)
│   └── index.js
└── server.js              (Entry point)
```

### Dev Server

```bash
npm run dev
# Starts ONE dev server on :3000
# Handles both:
# - React routes (with HMR)
# - ElysiaJS /api/* routes
# - Auto-recompile on src/ changes
```

---

## Database & Auth in Unified Context

### Shared Database Connection

**Problem:** Both frontend (during SSR) and backend (during API calls) need the same db instance.

**Solution:** Create single db client in `src/server/db.ts`

```typescript
// src/server/db.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const client = new Pool({
  connectionString: process.env.DATABASE_URL
})

export const db = drizzle(client, { schema })
```

**Usage:**
```typescript
// src/server/api/auth.ts (ElysiaJS routes)
import { db } from '../db'

app.post('/auth/signin', async ({ body }) => {
  const user = await db.query.users.findFirst(...)
  // ...
})

// src/routes/__root.tsx (Layout, during SSR)
import { db } from '~/server/db'

export const Route = createRootRouteWithContext<{ auth: Session }>()({
  component: Root,
  loader: async () => {
    const session = await auth.api.getSession() // Uses db internally
    return session
  }
})
```

### Shared Authentication

**Pattern:** better-auth instance shared, but accessed differently

```typescript
// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { db } from '~/server/db'

export const auth = betterAuth({
  database: db,
  ...config
})

// On server (during SSR): Direct call
const session = await auth.api.getSession({ request })

// On client: HTTP via Eden Treaty
const session = await getTreaty().auth.session.get()
```

---

## Asset & Public File Handling

### Static Assets

```
public/                    (Copied to dist/ as-is)
├── favicon.ico
├── robots.txt
└── manifest.webmanifest
```

### How TanStack Start Handles Assets

- `public/*` → Served from root in dev, copied to `dist/` in build
- Vite auto-hashes bundled assets
- No changes to current asset strategy needed

---

## Type Safety Throughout

### Shared Type Exports

```typescript
// src/types/api.ts
export interface User {
  id: string
  email: string
  createdAt: Date
}

// src/types/auth.ts
export interface Session {
  user: User
  expiresAt: Date
}

// src/server/api/auth.ts (ElysiaJS)
import { Session } from '~/types/auth'

app.get('/auth/session', async (): Promise<Session> => {
  // ...
})

// Frontend uses same types via Eden Treaty
const response = await getTreaty().auth.session.get()
// response type is { data: Session, status: 200 }
```

### No `any` Types

- All API responses typed via Zod schemas
- Frontend gets **inferred types** from ElysiaJS via Eden Treaty
- No separate API client code needed (type safety is automatic)

---

## Migration Path from Current Structure

### Phase 1.1 Integration Plan (High-Level)

1. **Consolidate Packages**
   - Move backend code from `packages/backend/src/` → `src/server/`
   - Move frontend code from `packages/frontend/src/` → `src/`
   - Move shared types from `packages/shared/` → `src/types/`
   - Create unified `package.json` at root

2. **Setup TanStack Start**
   - Create `vite.config.ts` (TanStack Start preset)
   - Create `tsconfig.json` (unified)
   - Update npm scripts: `dev`, `build`, `preview`

3. **Mount ElysiaJS**
   - Create `src/routes/api.$.ts`
   - Move Elysia app definition to `src/server/api/index.ts`
   - Export as named `app` for Eden Treaty

4. **Setup Auth & DB**
   - Consolidate auth initialization in `src/lib/auth.ts`
   - Move Drizzle schema to `src/server/db/schema.ts`
   - Update migrations path to `db/migrations/`

5. **Update Imports**
   - Frontend: replace `@livenex/backend` imports with `~/server`
   - All: use `~` alias for src root
   - Verify no circular dependencies

6. **Test Unified Dev Server**
   - `npm run dev` starts one server on :3000
   - Both React routes and ElysiaJS routes respond
   - HMR works for client code
   - API calls work from browser

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Circular dependencies** | Build fails | Use clear `src/server/` boundary, linting rules |
| **TanStack Start RC breaking changes** | Rework required | Lock version, monitor release notes, plan upgrade path |
| **Auth context in SSR** | Session not available | Use `getTreaty()` for auth checks, avoid HTTP in loaders |
| **Database connection pool exhaustion** | Memory leak | Single pool instance, proper cleanup in dev reload |
| **Build size increase** | Slower SSR startup | Use code splitting, lazy load API routes if needed |
| **Deployment complexity** | More moving parts | Single Docker image, clear env vars for Postgres/Redis |

---

## Success Criteria for Integration

Phase 1.1 integration is complete when:

- [ ] `src/` contains all code (no packages/ subdirs)
- [ ] Single `package.json` at root with all deps
- [ ] `vite.config.ts` configured for TanStack Start
- [ ] `src/routes/api.$.ts` mounts ElysiaJS app
- [ ] `/api/auth/signin` returns 200 with valid JWT
- [ ] `/dashboard` requires auth (redirects to login if not)
- [ ] Single `npm run dev` starts one server on :3000
- [ ] Both React and API routes respond correctly
- [ ] HMR works for client code changes
- [ ] Database queries work from server context (SSR + API)
- [ ] Eden Treaty type inference works (no `any` types)
- [ ] All existing tests still pass
- [ ] No `@livenex/backend` or `@livenex/frontend` imports in code

---

## Standard Stack Applied to Integration

### Frontend (React in TanStack Start)
- **TanStack Start** — Routing, SSR, server functions
- **React 19** — UI runtime
- **Tailwind CSS** — Styling
- **shadcn/ui** — UI components
- **Eden Treaty** — Type-safe API client

### Backend (ElysiaJS inside TanStack Start)
- **ElysiaJS** — HTTP server (mounted in route handler)
- **better-auth** — Authentication
- **Drizzle ORM** — Database access
- **Zod** — Validation

### Database & Cache
- **PostgreSQL 18** — Primary database
- **Redis 8** — Queue backend (for Phase 2+)

### Shared
- **TypeScript** — Full stack type safety
- **Vite** — Build tool (via TanStack Start)
- **Node.js** — Single runtime

---

## References

### Official Docs
- https://tanstack.com/start/docs/ (TanStack Start)
- https://elysiajs.com/integrations/tanstack-start.html (ElysiaJS integration)
- https://elysiajs.com/eden/overview.html (Eden Treaty)
- https://orm.drizzle.team/docs/overview (Drizzle ORM)

### Related
- Current project: AGENTS.md (stack), PHASE-1-RESEARCH-SUMMARY.md (auth decisions)

---

## Metadata

**Research Date:** 2026-03-27  
**Phase:** 1.1 - Project Structure & Organization (Integration Focus)  
**Status:** Ready for Planning  
**Confidence:** HIGH  

**Confidence Breakdown:**
- **ElysiaJS + TanStack Start integration:** HIGH (official pattern, well-documented)
- **Monorepo → Single package consolidation:** HIGH (straightforward refactoring)
- **Database/Auth sharing:** HIGH (established patterns)
- **Build process unification:** MEDIUM-HIGH (TanStack Start is RC, some unknowns)
- **Performance impact:** MEDIUM (SSR + API in same process, needs monitoring)

**Valid Until:** 2026-04-27 (30 days)

---

## Next Steps

1. Use `/gsd-plan-phase --research` to generate phase plan from this research
2. Plan will break down:
   - Package consolidation (move files)
   - TanStack Start + vite.config setup
   - ElysiaJS mounting
   - Auth/DB consolidation
   - Import updates
   - Testing & verification
3. Execute plan with `/gsd-execute-phase 01.1-integration`
4. Deliver Phase 1 context + integrated foundation for Phase 1 proper (auth implementation)

