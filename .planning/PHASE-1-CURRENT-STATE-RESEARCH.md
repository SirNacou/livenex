# Phase 1: Private Access Foundation - Current State Research

**Research Date:** 2026-03-27  
**Analysis Date:** After boilerplate replacement  
**Domain:** Full-stack authentication, session management, and API key system  
**Confidence:** HIGH

## Summary

The codebase has been rebuilt with fresh TanStack Start boilerplate, establishing a solid foundation for Phase 1 implementation. The core infrastructure is in place (routing, API integration, styling, package configuration), but **zero authentication features have been implemented yet**. The project is a clean slate ready for systematic implementation of the Phase 1 specification.

**Primary findings:**
- ✅ **TanStack Start** is fully integrated with file-based routing, SSR config, and React 19
- ✅ **Vite/Nitro** backend is wired for server functions
- ✅ **API route handler** exists at `/api/*` routing to ElysiaJS server
- ✅ **better-auth** library is installed and minimally configured
- ✅ **TanStack Query** integration ready with devtools
- ✅ **Database config** (Drizzle) is present but schema is empty
- ❌ **No authentication logic** implemented in auth handler
- ❌ **No database schema** defined for users, sessions, API keys
- ❌ **No auth UI** (login form, dashboard, API keys management)
- ❌ **No validation schemas** for auth payloads
- ❌ **No error handling middleware** for API routes

**Next steps:** Implement Phase 1 tasks in sequence: database schema → auth backend → auth UI → API key system → tests.

---

## User Constraints (from 01-CONTEXT.md)

### Locked Decisions (D-01 to D-30)

**Authentication Strategy (D-01 to D-07):**
- Email + password primary method (D-01)
- Optional OIDC support (D-02, D-03)
- Password reset deferred; no 2FA (D-04, D-05)
- httpOnly, Secure cookies (D-06)
- Post-login redirect to dashboard (D-07)

**Session Management (D-08 to D-17):**
- 30-day session validity (D-08)
- Multiple independent devices allowed (D-09, D-10)
- No remote revocation UI (D-11)
- No concurrent session limit (D-12)
- No IP validation (D-13)
- HTTPS enforced production, SameSite=Strict (D-14)
- HTTPS allowed local dev (D-15)
- Logout invalidates session immediately (D-16, D-17)

**API Key Scope & Permissions (D-18 to D-30):**
- Scoped by monitor group/tag (D-18)
- Read-only OR read-write permissions (D-19)
- Configurable per-key expiration (D-20)
- In-place rotation (D-21)
- Secret displayed once only (D-22)
- UI shows: name, created, expires, last-used, scopes, permission (D-23)
- Single-dialog creation form (D-24)
- Per-key revoke/regenerate with confirmation (D-25, D-26)
- Toast success feedback (D-27)
- User-defined names/labels (D-28)
- Last-used tracking (D-29)
- No full audit log (D-30)

### the agent's Discretion
- UI layout, typography, colors, spacing
- Form validation messages
- OIDC error handling strategies
- Database schema optimization

### Deferred (Out of Scope)
- Password reset (Phase 2+)
- 2FA/MFA (Phase 2+)
- Remote session revocation (Phase 2+)
- Full audit log (Phase 2+)

---

## Phase Requirements

| ID | Description | Current Status | Implementation Path |
|----|---|---|---|
| **AUTH-01** | User can sign in to private dashboard | NOT STARTED | Task: Auth backend (users table, login endpoint) + Login UI |
| **AUTH-02** | User can create, view, revoke API keys | NOT STARTED | Task: API keys schema + CRUD routes + Management UI |
| **STAT-01** | All data private by default | PARTIAL (scaffolding) | Task: Auth middleware verification + Tests |

---

## Current Implementation Status

### ✅ What Exists (Boilerplate Foundation)

#### Frontend (TanStack Start)
| Component | Status | Details |
|-----------|--------|---------|
| Routing | ✅ File-based (TanStack Router) | Routes: `/`, `/about`, `/api/*`, `/api/auth/*` |
| Entry point | ✅ `src/routes/__root.tsx` | Root layout with theme script, devtools |
| Pages | ✅ Home (`/`), About (`/about`) | Placeholder content |
| API routes | ✅ Catch-all handler | `/api/$` and `/api/auth/$` delegate to ElysiaJS |
| Query integration | ✅ TanStack Query | Provider, devtools plugins configured |
| Styling | ✅ Tailwind + custom CSS | `src/styles.css` with design tokens defined |
| Dev environment | ✅ Vite + React Compiler | Hot reload, SSR-ready |

**Files:**
- `src/routes/__root.tsx` — Root layout, theme init, devtools
- `src/routes/index.tsx` — Home page (template content)
- `src/routes/about.tsx` — About page (template content)
- `src/routes/api/$.ts` — Catch-all API handler
- `src/routes/api/auth/$.ts` — Auth handler (routes to better-auth)
- `src/router.tsx` — Router configuration
- `src/env.ts` — T3 env validation
- `src/integrations/tanstack-query/*` — Query provider, devtools
- `src/lib/auth-client.ts` — Client-side auth client (unused)
- `src/lib/auth.ts` — better-auth server config
- `src/styles.css` — Global styling

#### Backend (ElysiaJS + Nitro)
| Component | Status | Details |
|-----------|--------|---------|
| Server | ✅ Elysia app at `/api` | Two stub endpoints: `GET /`, `GET /hello/:name` |
| Routing | ✅ Via TanStack Start server functions | Vite + Nitro bridge |
| better-auth | ✅ Installed + plugin | `tanstackStartCookies()` configured; no routes yet |
| Error handling | ❌ NOT IMPLEMENTED | Need AppError pattern + global middleware |
| Response envelope | ❌ NOT IMPLEMENTED | Needed for consistency |
| Database | ⚠️ CONFIG ONLY | Drizzle Kit configured; no schema |

**Files:**
- `src/server/index.ts` — Main Elysia app (stub endpoints only)
- `src/lib/auth.ts` — better-auth server initialization
- `drizzle.config.ts` — Drizzle Kit configuration

#### Database (PostgreSQL + Drizzle)
| Component | Status | Details |
|-----------|--------|---------|
| Connection | ⚠️ CONFIG ONLY | `drizzle.config.ts` points to `DATABASE_URL` env var |
| Schema | ❌ NOT DEFINED | No tables yet |
| Migrations | ⚠️ EMPTY | `drizzle/` directory structure only |

#### Package Configuration
| Tool | Status | Version | Notes |
|------|--------|---------|-------|
| Node runtime | ✅ Specified | `"type": "module"` | ES modules |
| Package manager | ⚠️ PARTIAL | npm in `package.json` | Needs Bun migration per cleanup plan |
| Build tool | ✅ Vite | 7.3.1 | With TanStack plugins |
| Framework | ✅ TanStack Start | latest | RC version |
| Backend | ✅ Elysia | 1.4.28 | Stub server running |
| Auth | ✅ better-auth | 1.5.3 | Installed, not integrated |
| ORM | ✅ Drizzle | 0.45.1 | Config only |
| Validation | ✅ Zod | 4.3.6 | Not used yet |
| Styling | ✅ Tailwind | 4.1.18 | With custom tokens |
| Testing | ⚠️ CONFIG ONLY | Vitest 3.0.5 | No tests written |

**Env vars configured:**
```
DATABASE_URL=postgresql://...
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=(empty, needs generation)
```

### ❌ What's Missing (Phase 1 Implementation)

#### Backend Implementation Required

| Feature | Purpose | Phase 1 Task | Priority |
|---------|---------|------------|----------|
| **Users Table** | Store user credentials | 1-02 (schema) | CRITICAL |
| **Sessions Table** | Manage session tokens | 1-02 (schema) | CRITICAL |
| **API Keys Table** | Store API keys + metadata | 1-02 (schema) | CRITICAL |
| **Auth Middleware** | Extract user from request | Task (not yet scoped) | HIGH |
| **Auth Routes** | `POST /auth/signup`, `POST /auth/signin`, `POST /auth/logout` | Task (not yet scoped) | HIGH |
| **Password Hashing** | Secure credential storage | better-auth handles | BUILT-IN |
| **Session Validation** | Check valid + not expired | Task (middleware) | HIGH |
| **API Key Validation** | Check valid + not expired + authorized | Task (middleware) | MEDIUM |
| **Error Classes** | AppError, ValidationError, etc. | Task (not yet scoped) | HIGH |
| **Response Envelope** | Standardize `{ok, data, error}` format | Task (middleware) | HIGH |

#### Frontend Implementation Required

| Feature | Purpose | Phase 1 Task | Priority |
|---------|---------|------------|----------|
| **Login Page** | Accept email + password | Task (2-05 equiv) | CRITICAL |
| **Dashboard** | Show after login (placeholder) | Task (2-06 equiv) | HIGH |
| **API Keys UI** | CRUD for keys | Task (3-03 equiv) | HIGH |
| **Auth Context/Hook** | useAuth() to get user state | Task (not yet scoped) | HIGH |
| **Protected Routes** | Redirect unauthenticated to login | Task (not yet scoped) | MEDIUM |
| **API Client** | fetch wrapper for `/api/*` | Task (not yet scoped) | MEDIUM |
| **Form Validation** | Zod schemas + error display | Task (not yet scoped) | MEDIUM |

#### Testing Required

| Type | Coverage | Status |
|------|----------|--------|
| **Unit Tests** | Auth logic, error classes | NOT STARTED |
| **Integration Tests** | Auth flow (signup → login → API key CRUD) | NOT STARTED |
| **E2E Tests** | User journeys (login, create monitor, logout) | NOT STARTED (Phase 2 requirement) |

---

## Architecture Insights from Codebase

### Stack Status Verification

| Layer | Technology | Installed? | Configured? | Working? | Notes |
|-------|-----------|-----------|------------|----------|-------|
| **Web framework** | TanStack Start | ✅ Yes | ✅ Yes | ✅ Yes | RC version, full SSR setup |
| **HTTP server** | Elysia | ✅ Yes | ✅ Partial | ⚠️ Stub only | Server created but no auth routes |
| **Authentication** | better-auth | ✅ Yes | ⚠️ Partial | ❌ No | Lib installed, plugin configured, no routes |
| **Database** | PostgreSQL | ⚠️ NOT RUN | ✅ Config ready | ❌ No schema | Drizzle Kit ready, needs schema definition |
| **ORM** | Drizzle | ✅ Yes | ⚠️ Config only | ❌ No schema | No migrations yet |
| **Styling** | Tailwind v4 | ✅ Yes | ✅ Yes | ✅ Yes | Custom tokens in `styles.css` |
| **Query client** | TanStack Query | ✅ Yes | ✅ Yes | ✅ Yes | Provider configured, devtools enabled |
| **Validation** | Zod | ✅ Yes | ❌ No | ❌ No | Installed but unused |
| **Testing** | Vitest | ✅ Yes | ⚠️ Partial | ❌ No tests | Config in npm scripts, no test files |

**All required libraries are installed.** No external dependency blockers — implementation is purely feature work.

### Routing Architecture

```
Frontend Routes (TanStack Router):
  /                   → src/routes/index.tsx (home page)
  /about              → src/routes/about.tsx (info page)
  /api/*              → src/routes/api/$.ts → Elysia app
                        GET, POST, PUT, DELETE, PATCH
  /api/auth/*         → src/routes/api/auth/$.ts → better-auth handler
                        GET, POST (login/signup/logout)

Backend Routes (Elysia @ /api):
  GET /               → "Hello World" (stub)
  GET /hello/:name    → "Hello {name}!" (stub)
  (all routes TBD)
```

**Required additions:**
- `POST /api/auth/signup` — Create user account
- `POST /api/auth/signin` — Login with email + password
- `POST /api/auth/logout` — Invalidate session
- `POST /api/auth/session` — Get current user + session info
- `GET /api/auth/keys` — List API keys
- `POST /api/auth/keys` — Create API key
- `PATCH /api/auth/keys/:id` — Regenerate API key
- `DELETE /api/auth/keys/:id` — Revoke API key

### better-auth Integration Status

**What's done:**
- Library installed (`better-auth@1.5.3`)
- Server initialized in `src/lib/auth.ts`:
  ```typescript
  const auth = betterAuth({
    emailAndPassword: { enabled: true },
    plugins: [tanstackStartCookies()],
  })
  ```
- Route handler set up at `/api/auth/$`

**What's missing:**
- Database adapter configuration (needs PostgreSQL connection)
- User/session table creation
- Route handlers for signup/signin/logout
- Frontend client integration (auth context, login component)
- OIDC provider configuration (deferred but scaffolded)

### Database Schema Status

**Current state:** No schema defined, no migrations.

**Required tables (from Phase 1 decisions):**
1. **users** — Email, password hash, created_at, updated_at
2. **sessions** — User ID, token, expires_at, user_agent, IP, created_at
3. **api_keys** — User ID, secret hash, name, scopes, permissions, expires_at, last_used_at, created_at, updated_at
4. **accounts** (for OIDC) — Provider, external ID, user ID

**Drizzle Kit ready:** Just needs `drizzle.config.ts` ✅ and `src/db/schema.ts` with table definitions.

---

## What Still Needs to be Done (Phase 1 Implementation Gap)

### Wave 1: Foundation Setup (PARTIALLY DONE)

| Task | Status | What's Needed |
|------|--------|---------------|
| Project init & deps | ✅ DONE | npm → Bun migration (in cleanup) |
| Database schema | ❌ NOT DONE | Define tables, run migrations |
| Env config | ⚠️ PARTIAL | `BETTER_AUTH_SECRET` not generated |

**Action:** Complete Wave 1 by:
1. Generate `BETTER_AUTH_SECRET` via `bunx @better-auth/cli secret`
2. Define database schema in `src/db/schema.ts` (users, sessions, api_keys tables)
3. Run `bun run db:push` to create tables

### Wave 2: Backend & Frontend Core

#### Backend Path (❌ NOT STARTED)
- [ ] better-auth + database adapter setup
- [ ] `POST /auth/signup` endpoint
- [ ] `POST /auth/signin` endpoint
- [ ] `POST /auth/logout` endpoint
- [ ] Session validation middleware
- [ ] Error handling middleware
- [ ] Response envelope pattern

**Time estimate:** 6-8 hours

#### Frontend Path (⚠️ PARTIALLY STARTED)
- [ ] Login page (`/login` route)
- [ ] Dashboard page (`/dashboard` route) — placeholder
- [ ] Protected route wrapper (redirect to /login if unauthenticated)
- [ ] Auth context + useAuth hook
- [ ] API client wrapper for `/api/*`

**Time estimate:** 4-6 hours

### Wave 3: API Key System (❌ NOT STARTED)

**Backend:**
- [ ] API key generation + secret hashing
- [ ] `POST /api/auth/keys` endpoint (create)
- [ ] `GET /api/auth/keys` endpoint (list)
- [ ] `PATCH /api/auth/keys/:id` endpoint (regenerate)
- [ ] `DELETE /api/auth/keys/:id` endpoint (revoke)
- [ ] API key validation middleware

**Frontend:**
- [ ] API Key Management page (`/settings/keys`)
- [ ] Create key dialog with secret display-once behavior
- [ ] Key list with CRUD buttons
- [ ] Confirmation dialogs for revoke/regenerate

**Time estimate:** 8-10 hours

### Wave 4: Integration & Testing (❌ NOT STARTED)

- [ ] Authentication middleware integration
- [ ] Error handling tests
- [ ] Auth flow tests (signup → login → logout)
- [ ] API key CRUD tests
- [ ] Session expiry tests
- [ ] Protected route tests

**Time estimate:** 7-8 hours

### Wave 5: Final Integration (⚠️ NOT STARTED)

- [ ] E2E testing (full user flow)
- [ ] Documentation & setup guide
- [ ] Security review & hardening (HTTPS, SameSite, etc.)

**Time estimate:** 4-5 hours

---

## Standard Stack (Verified)

### Core Technologies

| Technology | Version | Status | Purpose |
|-----------|---------|--------|---------|
| **TanStack Start** | latest | ✅ Installed & running | SSR, file-based routing, server functions |
| **React** | 19.2.0 | ✅ Working | UI rendering |
| **Elysia** | 1.4.28 | ✅ Running (stubs) | HTTP API server |
| **better-auth** | 1.5.3 | ✅ Installed, config only | User authentication |
| **PostgreSQL** | 18.x | ⚠️ Not running locally | Data persistence |
| **Drizzle ORM** | 0.45.1 | ✅ Config ready | Type-safe SQL |
| **Zod** | 4.3.6 | ✅ Installed, unused | Runtime validation |
| **Tailwind CSS** | 4.1.18 | ✅ Working | Styling |
| **shadcn/ui** | (not installed) | ⚠️ Component library TBD | UI components (Phase 1+) |

### Supporting Libraries

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| TanStack Query | latest | Client-side state + API caching | ✅ Configured |
| TanStack Router | latest | File-based routing | ✅ Working |
| TanStack Form | latest | Form management (not used yet) | ✅ Installed |
| TanStack Table | latest | Data grid (Phase 2+) | ✅ Installed |
| Lucide React | 0.545.0 | Icon library | ✅ Installed |
| Biome | 2.4.5 | Linting + formatting | ✅ Installed |
| Vite | 7.3.1 | Build tool | ✅ Working |
| Nitro | nightly | Server runtime | ✅ Working |

**Installation:** All dependencies are already in `package.json` and `node_modules/`. No additional installations needed.

---

## Architecture Patterns Established

### Request/Response Flow

```
User Action
  ↓
React Component (src/routes/*.tsx)
  ↓
fetch() to /api/...
  ↓
TanStack Start Server Function (src/routes/api/$.ts)
  ↓
Elysia Route Handler (src/server/index.ts)
  ↓
Business Logic + Database (TBD)
  ↓
Response Envelope: { ok: true|false, data?: T, error?: {...} }
  ↓
TanStack Query (automatic response handling via api-client wrapper)
  ↓
Component re-renders with new data
```

### Authentication Flow (Planned)

```
1. User visits /login
2. User submits email + password
3. POST /api/auth/signin
   - Elysia validates input via Zod
   - Queries users table
   - Verifies password hash
   - Creates session record
   - Sets httpOnly cookie
   - Returns { ok: true, data: { user: {...} } }
4. Frontend stores user state in context
5. Protected routes check context, allow access
6. Next request includes cookie automatically
7. Middleware validates session from cookie
```

### Error Handling Pattern (Planned)

```typescript
// Backend route handler
try {
  // Validate input
  // Execute business logic
  // Return { ok: true, data: ... }
} catch (err) {
  if (err instanceof ValidationError) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', ... } }
  }
  if (err instanceof AuthenticationError) {
    return { ok: false, error: { code: 'AUTHENTICATION_ERROR', ... } }
  }
  // Generic 500
}

// Frontend component
const { ok, data, error } = await response.json()
if (!ok) {
  setError(error.message)
  return
}
useData(data)
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| User authentication | Custom login/password logic | better-auth | Handles password hashing, sessions, OIDC, cookies |
| Session tokens | JWT from scratch | better-auth sessions table | HTTPS + cookie security, expiry management |
| API key storage | Unencrypted secrets | Hash before storage, display once | Prevents compromise if DB leaked |
| Password hashing | `bcrypt` or `argon2` directly | better-auth (built-in) | Integrated with user model |
| CORS + session | Custom CORS headers | Caddy reverse proxy (later) | Same-origin architecture prevents most CORS issues |
| Input validation | String checks | Zod schemas | Type-safe, reusable, composable |
| Database queries | Raw SQL strings | Drizzle ORM | Type safety, prevents SQL injection |

**Key insight:** better-auth handles 80% of Phase 1 auth. Don't hand-roll session management, password hashing, or cookie security — use the library.

---

## Common Pitfalls (Phase 1)

### Pitfall 1: Storing API Key Secrets in Plaintext
**What goes wrong:** DB leak exposes all API keys; attacker can impersonate user  
**Why it happens:** Easier to develop/debug if secrets visible  
**How to avoid:** Hash secrets like passwords (e.g., via better-auth's hasher or bcrypt), store hash only, display secret once on creation, never store plaintext  
**Warning signs:** Secret visible in database logs, secret cached in memory  

### Pitfall 2: Sessions Without Expiry
**What goes wrong:** Old sessions valid forever; revoked users still have access  
**Why it happens:** Forgot to add `expires_at` check in middleware  
**How to avoid:** Always query sessions table with `WHERE expires_at > NOW()`, delete expired sessions in cleanup job  
**Warning signs:** Sessions table grows unbounded, users can't be revoked  

### Pitfall 3: Mixing Auth Logic Across Layers
**What goes wrong:** Session validation in both frontend and backend, inconsistent behavior  
**Why it happens:** Tried to avoid backend call for every request  
**How to avoid:** **Auth always checked server-side.** Frontend can show UI hint (if user exists in state), but every API call validates session from cookie/header  
**Warning signs:** Frontend has to handle 401 manually, bypass logic in components  

### Pitfall 4: Displaying API Key Secret Multiple Times
**What goes wrong:** User sees secret on edit screen, attacker sees it in browser history/cache  
**Why it happens:** Easier to implement if UI can re-fetch secret  
**Why it's bad:** Design decision D-22 explicitly says "display once only"  
**How to avoid:** Generate secret, show in modal with "copy to clipboard", close modal when dismissed, secret is gone forever (can only regenerate)  
**Warning signs:** Secret visible in list view, secret shown on edit page  

### Pitfall 5: TanStack Start Hydration Mismatches
**What goes wrong:** SSR renders different HTML than client, hydration fails, UI frozen  
**Why it happens:** Async data fetches during SSR, client renders before data available  
**How to avoid:** Use TanStack Query with `useQuery` (not imperative fetches in useEffect), keep SSR data minimal, use loaders  
**Warning signs:** "Hydration mismatch" console errors, interactive elements unresponsive  

### Pitfall 6: better-auth + TanStack Start Integration
**What goes wrong:** Auth state gets out of sync, login succeeds but UI doesn't update  
**Why it happens:** better-auth's cookie plugin doesn't trigger React re-render  
**How to avoid:** Wrap auth state in TanStack Query, use `useQuery` for current user, refetch on auth action  
**Warning signs:** User logged in but dashboard shows as unauthenticated, page refresh fixes it  

### Pitfall 7: API Key Scoping Implemented Wrongly
**What goes wrong:** API key for monitors group A can read data from group B  
**Why it happens:** Forgot to check `scopes` field in API key validation middleware  
**How to avoid:** Every API endpoint checks: (1) session valid + user found, (2) API key exists + not expired, (3) scopes include this resource  
**Warning signs:** Tests pass but manual testing finds cross-scope access  

---

## Code Examples

### Database Schema (To Be Implemented)

```typescript
// src/db/schema.ts (needs to be created)
import { pgTable, text, varchar, timestamp, serial, boolean, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  userAgent: varchar('user_agent', { length: 500 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  secretHash: text('secret_hash').notNull(),
  scopes: jsonb('scopes').notNull(), // ["group:read", "group:write"]
  permissions: varchar('permissions', { length: 20 }).notNull(), // 'read' | 'write'
  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  apiKeys: many(apiKeys),
}))
```

### API Route Structure (To Be Implemented)

```typescript
// src/server/index.ts (updated)
import { Elysia } from "elysia"
import { authRouter } from "#/api/auth"
import { errorHandler } from "#/lib/errors"

export const app = new Elysia({ prefix: "/api" })
  // Middleware
  .onError(errorHandler)
  
  // Routes
  .use(authRouter)
  
  // Fallback
  .get("/", () => ({ ok: true, data: "API ready" }))

export type Server = typeof app
```

### Login Component (To Be Implemented)

```typescript
// src/routes/login.tsx
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = Route.useNavigate()
  
  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error.message)
      return data.data
    },
    onSuccess: () => {
      navigate({ to: "/dashboard" })
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate() }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={loginMutation.isPending}>
        Sign In
      </button>
      {loginMutation.error && <p>{loginMutation.error.message}</p>}
    </form>
  )
}
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Notes |
|------------|------------|-----------|---------|-------|
| **Node.js** | All | ✅ Yes | 18+ | TanStack Start requires Node.js |
| **PostgreSQL** | Database | ⚠️ Not running | 18.x | Can use Docker (`docker-compose up`) |
| **Redis** | Queue (Phase 3+) | ⚠️ Not used yet | 7.x | Not required for Phase 1 |
| **Docker** | Optional local dev | ❓ Unknown | Latest | Helpful but not required |
| **Bun** | Build/runtime | ✅ (npm now) | Latest | Recommended per cleanup plan |

**Phase 1 blockers:** None. Can run fully in Node.js + local PostgreSQL (or Docker).

---

## Validation Architecture

### Test Framework Status

| Property | Value |
|----------|-------|
| Framework | Vitest 3.0.5 |
| Config file | `vite.config.ts` (vitest section TBD) |
| Quick run | `npm run test` or `bun test` |
| Full suite | `npm run test` (same) |

### Phase 1 Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User can sign up with email + password | Unit | `vitest run src/__tests__/auth.test.ts` | ❌ Wave 0 |
| AUTH-01 | User can sign in and receive session cookie | Integration | `vitest run src/__tests__/auth-flow.test.ts` | ❌ Wave 0 |
| AUTH-02 | User can create API key and see secret once | Unit | `vitest run src/__tests__/api-keys.test.ts` | ❌ Wave 0 |
| AUTH-02 | User can list, regenerate, revoke keys | Integration | `vitest run src/__tests__/api-keys-flow.test.ts` | ❌ Wave 0 |
| STAT-01 | Unauthenticated request returns 401 | Unit | `vitest run src/__tests__/auth-middleware.test.ts` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] **Test files** — No test files exist yet, only npm scripts configured
- [ ] **Test fixtures** — No setup/teardown for database, auth, or API mocking
- [ ] **Vitest config** — No `vitest.config.ts` (can inherit from vite.config.ts)
- [ ] **E2E tests** — Playwright or Cypress not yet installed (Phase 2+)
- [ ] Framework: Install `@testing-library/react` if integration tests needed

**Recommendation:** Defer test setup to Wave 4 when backend is complete. Create test fixtures at that time for database seeding and mock API responses.

---

## Open Questions

1. **Bun or Node?**
   - What we know: Cleanup plan calls for Bun, but current `package.json` still has npm scripts
   - What's unclear: Are we migrating to Bun in Wave 1 or staying with npm/Node?
   - Recommendation: Follow cleanup plan — convert to Bun before Phase 1 implementation

2. **OIDC implementation scope**
   - What we know: D-02/D-03 allow optional OIDC alongside password auth
   - What's unclear: Should Wave 1 include OIDC, or is it Phase 1.1 stretch goal?
   - Recommendation: **Defer OIDC.** Implement password auth fully first (Wave 1-4), add OIDC as Phase 1 stretch

3. **Database running locally?**
   - What we know: Drizzle configured to use `DATABASE_URL` env var
   - What's unclear: Should we use `docker-compose up` to spin up PostgreSQL or do local manual setup?
   - Recommendation: Use docker-compose for consistency; document setup in Wave 5

4. **shadcn/ui components?**
   - What we know: AGENTS.md lists shadcn/ui as "current", not installed in `package.json`
   - What's unclear: Should we add form, button, dialog components from shadcn/ui?
   - Recommendation: **Install when needed** in Phase 1 (buttons, forms) — don't add all upfront

5. **API response envelope format**
   - What we know: ARCHITECTURE.md defines it, backend stub doesn't implement it yet
   - What's unclear: Should every Elysia route manually wrap, or use middleware?
   - Recommendation: Use Elysia's `.derive()` or `.onAfterHandle()` to wrap all responses globally

---

## State of the Art

| Old Approach | Current Approach | When Changed | Notes |
|---|---|---|---|
| TanStack Router v1 | TanStack Start (SSR + Router) | 2024 | Start is the new standard for full-stack React |
| Separate frontend/backend repos | Monorepo with Vite Server Functions | 2024 | Faster iteration, type safety across boundaries |
| Session JWT | Server sessions table | 2024 | More secure (secrets never sent to client) |
| `fetch()` directly | TanStack Query hooks | 2023 | Better caching, loading states, error handling |
| npm as package manager | Bun (optional) | 2024 | Faster installs, built-in testing, simpler config |

**Deprecated/outdated:**
- **Next.js API routes** — TanStack Start server functions are more flexible
- **Express.js for auth** — better-auth handles 80% of auth setup
- **Cookie-cutter template UI** — TanStack Start base template is excellent, just needs Phase 1 pages

---

## Sources

### Primary (HIGH confidence)
- **TanStack Start** - `https://tanstack.com/start/docs` — Official docs confirm SSR routing, server functions, plugins
- **better-auth** - `v1.5.3` installed, `https://better-auth.com/docs` — Email + password, OIDC, TanStack Start plugin all confirmed
- **Drizzle ORM** - `v0.45.1` installed, `https://orm.drizzle.team` — PostgreSQL support confirmed
- **Elysia** - `v1.4.28` installed, `https://elysiajs.com` — Framework confirmed, used in app.ts

### Secondary (MEDIUM confidence)
- **AGENTS.md** — Project configuration, stack decisions (all MEDIUM-HIGH confidence)
- **ARCHITECTURE.md** — Layer definitions, error patterns, response envelopes (defined in project)
- **Phase 1 CONTEXT.md** — Locked decisions D-01 to D-30 (all CRITICAL for implementation)

### Code Review (HIGH confidence)
- **Current codebase analysis** — Boilerplate exists, auth not implemented, schema not defined

---

## Metadata

**Confidence breakdown:**
- **Current state analysis:** HIGH — Verified by code review
- **Stack verification:** HIGH — All installed, configs found
- **Missing features:** HIGH — Clear from CONTEXT.md vs current code
- **Implementation path:** MEDIUM-HIGH — Based on existing PLAN.md (may need updates)

**Research date:** 2026-03-27  
**Valid until:** 2026-04-10 (2 weeks; should verify before Wave 1 if delayed)  
**Last updated:** Post-boilerplate replacement

---

## Next Steps for Planner

### Immediate Actions
1. **Review this RESEARCH.md** with team (15 min)
2. **Verify Bun migration** — Check if cleanup plan was executed
3. **Generate BETTER_AUTH_SECRET** — Run `bunx @better-auth/cli secret`, add to `.env.local`
4. **Spin up PostgreSQL** — Run `docker-compose up -d` to get database running

### Before Wave 1 Starts
1. **Read Phase 1 PLAN.md** — Review full task breakdown (already exists in `.planning/`)
2. **Assign tasks** — Map tasks 1-01 through 5-03 to developers
3. **Set up dev environment** — Install deps, verify endpoints respond
4. **Create test fixtures** — Prepare for Wave 4 testing

### For Wave 1 (Foundation Setup)
1. Task 1-01: Project init & dependencies → ✅ MOSTLY DONE (just Bun migration pending)
2. Task 1-02: Database schema → IN PROGRESS (schema.ts + migrations needed)
3. Task 1-03: Env config → IN PROGRESS (SECRET generation pending)

---

## Summary

**Phase 1 is at 15-20% completion:**
- ✅ Infrastructure in place (TanStack Start, Elysia, database config)
- ✅ Boilerplate routes and styling foundation
- ❌ Zero authentication implemented
- ❌ Zero database schema
- ❌ Zero API key system
- ❌ Zero tests

**Estimated effort to completion:**
- Wave 1 (Foundation): 2-3 hours (mostly done)
- Wave 2 (Backend & Frontend): 10-12 hours
- Wave 3 (API Keys): 8-10 hours
- Wave 4 (Testing): 7-8 hours
- Wave 5 (Docs & Security): 4-5 hours

**Total: 31-38 hours** (aligned with original plan estimate of 33 hours)

**Status:** Ready for planner to create PLAN.md with updated task assignments. All planning constraints (CONTEXT.md decisions) are understood and will be implemented in upcoming waves.
