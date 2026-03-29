# Phase 1: Private Access Foundation - Implementation Plan

**Plan Date:** 2026-03-27  
**Phase:** 01-private-access-foundation  
**Status:** Ready for Execution  
**Confidence:** HIGH

---

## Executive Summary

Phase 1 is the **foundational security layer** for Livenex. It delivers three core capabilities:

1. **Secure single-user authentication** (password + optional OIDC)
2. **Robust session management** (30-day, multi-device independent sessions)
3. **Scoped API keys** for automation with granular permissions

This phase has **no monitor creation, checking, or alerting logic**—those are deferred to later phases. The focus is purely on access control, session management, and API key infrastructure that all later phases depend on.

**Requirements Satisfied:**
- ✅ AUTH-01: User can sign in to the private dashboard with a single-user account
- ✅ AUTH-02: User can create, view, and revoke API keys for automation
- ✅ STAT-01: User can keep all monitoring data private by default behind authentication

**Key Deliverables:**
- Login page with password + optional OIDC support
- Dashboard skeleton (monitor list will be populated in Phase 2)
- API Keys management page (CRUD operations)
- Database schema (users, sessions, API keys)
- Authentication middleware and routes
- Session and API key validation system

---

## Task Breakdown: Critical Path Analysis

### Dependency Graph

```
┌──────────────────────────────────────────────────────────────┐
│                    WAVE 1: Foundation Setup                  │
├──────────────────────────────────────────────────────────────┤
│ Task 1-01: Project & Dependencies          (2-3 hours)       │
│ Task 1-02: Database Schema Design          (2-3 hours)       │
│ Task 1-03: Environment Configuration       (1-2 hours)       │
└─────────────────────┬────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────────────┐  ┌──────▼──────────────────┐
│ WAVE 2: Backend Core   │  │ WAVE 2: Frontend Core   │
├────────────────────────┤  ├─────────────────────────┤
│ Task 2-01: better-auth │  │ Task 2-04: TanStack    │
│ Integration   (3 hrs)  │  │ Start Setup   (3 hrs)   │
│ Task 2-02: Database    │  │ Task 2-05: Login Page   │
│ Migrations    (2 hrs)  │  │ Creation      (3 hrs)   │
│ Task 2-03: Auth Routes │  │ Task 2-06: Dashboard   │
│ (signin, logout) (3h)  │  │ Skeleton      (2 hrs)   │
└────────────┬───────────┘  └──────┬─────────────────┘
             │                     │
             └────────────┬────────┘
                          │
┌─────────────────────────▼────────────────────────────┐
│         WAVE 3: API Key System                       │
├───────────────────────────────────────────────────────┤
│ Task 3-01: API Key Schema & Generation  (2-3 hours) │
│ Task 3-02: API Key Routes & Validation (3 hours)    │
│ Task 3-03: API Keys UI Page            (3 hours)    │
└─────────────────────────┬──────────────────────────┘
                          │
        ┌─────────────────┴──────────────┐
        │                                │
┌───────▼──────────────────┐  ┌─────────▼────────────┐
│ WAVE 4: Integration      │  │ WAVE 4: Testing      │
├──────────────────────────┤  ├──────────────────────┤
│ Task 4-01: Middleware    │  │ Task 4-03: Auth      │
│ Wiring        (2 hours)  │  │ Tests       (4 hours)│
│ Task 4-02: Error         │  │ Task 4-04: API Key   │
│ Handling      (2 hours)  │  │ Tests       (3 hours)│
└──────────────┬───────────┘  └──────────┬───────────┘
               │                         │
               └────────────┬────────────┘
                            │
        ┌───────────────────▼──────────────────┐
        │    WAVE 5: Final Integration         │
        ├──────────────────────────────────────┤
        │ Task 5-01: End-to-End Testing (3 hrs)│
        │ Task 5-02: Documentation     (2 hrs) │
        │ Task 5-03: Security Review   (2 hrs) │
        └──────────────────────────────────────┘
```

### Critical Path (Longest Dependency Chain)

**Longest path:** 12-14 tasks, ~33 hours total execution time

**Critical items (delay one = delay phase):**
1. Database schema design (Task 1-02) → must be right, feeds all other tasks
2. better-auth integration (Task 2-01) → foundation for all auth flows
3. API Key schema (Task 3-01) → required before API key routes work
4. Authentication testing (Task 4-03) → blocks Phase 2 dependent work

**Parallel opportunities:**
- Wave 2: Backend and frontend work can proceed simultaneously (different codebases)
- Wave 4: Integration and testing can run in parallel (different test suites)

---

## Task Manifest: 17 Atomic Tasks

### WAVE 1: Foundation Setup (3-4 hours)

#### Task 1-01: Project Initialization & Dependencies
**Type:** `auto`  
**Files:** `package.json`, `.env.local`, `.env.example`, `tsconfig.json`, `vite.config.ts` (if TanStack Start uses Vite)  
**Dependencies:** None (first task)  
**Creates:** Project boilerplate, TypeScript configuration, base dependencies

**Action:**
1. Initialize TanStack Start project with React 19 template
   - Command: `npm create @tanstack/start@latest livenex-app`
   - Ensures TanStack Start (RC) and React 19 are installed
2. Install backend dependencies (ElysiaJS + ecosystem):
   - `npm install elysia` (HTTP API framework)
   - `npm install better-auth` (authentication library)
   - `npm install drizzle-orm drizzle-kit` (database ORM)
   - `npm install postgres` (PostgreSQL driver)
   - `npm install zod` (runtime validation)
   - `npm install dotenv` (environment variable management)
3. Install frontend dependencies (UI + styling):
   - `npm install tailwindcss` (styling)
   - `npm install @radix-ui/react-*` (shadcn/ui dependencies)
   - `npm install class-variance-authority clsx tailwind-merge` (component utilities)
4. Create `.env.example` with required variables:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/livenex_dev
   REDIS_URL=redis://localhost:6379
   SESSION_SECRET=your-secret-key-min-32-chars
   NODE_ENV=development
   OIDC_CLIENT_ID=
   OIDC_CLIENT_SECRET=
   OIDC_ISSUER_URL=
   OIDC_REDIRECT_URI=http://localhost:3000/auth/oidc/callback
   ```
5. Create `.env.local` (gitignored) for local development
6. Set up TypeScript configuration for both frontend and backend paths
7. Verify build works: `npm run build` (should succeed with no errors)

**Verify:** 
- `npm list` shows all required packages installed
- `npm run build` completes successfully
- `.env.local` created and `.env.example` exists
- TypeScript compilation works: `npx tsc --noEmit`

**Done:** Project compiles, dependencies installed, environment configured

**Decision References:** (Project setup, no specific decisions yet)

---

#### Task 1-02: Database Schema Design & Migration Setup
**Type:** `auto`  
**Files:** `db/schema.ts`, `drizzle.config.ts`, `db/migrations/0001_initial.sql`  
**Dependencies:** Task 1-01 (npm installed)  
**Creates:** Drizzle schema files, migration system, database structure

**Action:**
1. Create `drizzle.config.ts`:
   ```typescript
   import { defineConfig } from 'drizzle-kit';
   
   export default defineConfig({
     dialect: 'postgresql',
     schema: './db/schema.ts',
     out: './db/migrations',
     dbCredentials: {
       url: process.env.DATABASE_URL || 'postgresql://localhost/livenex_dev'
     }
   });
   ```

2. Create `db/schema.ts` with following tables (per better-auth + Phase 1 requirements):
   
   **Users Table** (via better-auth):
   ```typescript
   export const users = pgTable('users', {
     id: text('id').primaryKey(),
     email: text('email').unique().notNull(),
     emailVerified: boolean('email_verified').default(false),
     name: text('name'),
     image: text('image'),
     password: text('password'), // For password-based auth
     createdAt: timestamp('created_at').defaultNow(),
     updatedAt: timestamp('updated_at').defaultNow(),
   });
   ```

   **Sessions Table** (via better-auth):
   ```typescript
   export const sessions = pgTable('sessions', {
     id: text('id').primaryKey(),
     userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
     expiresAt: timestamp('expires_at').notNull(),
     userAgent: text('user_agent'), // Optional: track device
     ipAddress: text('ip_address'), // Optional: for audit
     createdAt: timestamp('created_at').defaultNow(),
   });
   ```

   **API Keys Table** (D-18 through D-30):
   ```typescript
   export const apiKeys = pgTable('api_keys', {
     id: text('id').primaryKey(), // UUID
     userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
     name: text('name').notNull(), // D-28: User-provided label
     secretHash: text('secret_hash').notNull(), // Never store plaintext
     permission: text('permission').notNull(), // 'read' | 'read_write' (D-19)
     expiresAt: timestamp('expires_at'), // D-20: Configurable, can be NULL
     createdAt: timestamp('created_at').defaultNow(),
     lastUsedAt: timestamp('last_used_at'), // D-29: Track usage
     revokedAt: timestamp('revoked_at'), // NULL if active, timestamp if revoked
   }, (table) => [
     uniqueIndex('idx_api_key_user_secret').on(table.userId, table.secretHash),
   ]);
   ```

   **API Key Scopes Table** (D-18: scoped by tags/groups):
   ```typescript
   export const apiKeyScopes = pgTable('api_key_scopes', {
     apiKeyId: text('api_key_id').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
     scope: text('scope').notNull(), // Monitor group/tag name
     createdAt: timestamp('created_at').defaultNow(),
   }, (table) => [
     primaryKey({ columns: [table.apiKeyId, table.scope] }),
   ]);
   ```

3. Add indexes for performance:
   - `api_keys.user_id` (fetch user's keys)
   - `api_keys.secret_hash` (validate API key)
   - `sessions.user_id` (fetch user's sessions)
   - `sessions.expires_at` (cleanup expired sessions)

4. Generate migration:
   ```bash
   npx drizzle-kit generate:pg --name initial
   ```

5. Create migration runner in `db/migrate.ts`:
   ```typescript
   import { migrate } from 'drizzle-orm/postgres-js/migrator';
   import { db } from './index';
   
   export async function runMigrations() {
     console.log('Running migrations...');
     await migrate(db, { migrationsFolder: './db/migrations' });
     console.log('Migrations completed.');
   }
   ```

**Verify:**
- `drizzle.config.ts` valid and loads without errors
- `db/schema.ts` compiles (TypeScript check)
- Migration file generated in `db/migrations/` with SQL
- SQL migration contains all 5 tables (users, sessions, api_keys, api_key_scopes, + any better-auth extras)
- Schema exports properly: `import { users, sessions, apiKeys } from 'db/schema'`

**Done:** Database schema designed, Drizzle configured, migrations generated

**Decision References:** D-06 (httpOnly cookies → sessions table), D-18-30 (API key scopes and fields)

---

#### Task 1-03: Environment & Configuration Setup
**Type:** `auto`  
**Files:** `.env.local`, `src/config/env.ts`, `src/config/constants.ts`  
**Dependencies:** Task 1-01 (dependencies installed)  
**Creates:** Environment validation, runtime configuration

**Action:**
1. Create `src/config/env.ts` for type-safe environment variables:
   ```typescript
   import { z } from 'zod';
   
   const envSchema = z.object({
     // Database
     DATABASE_URL: z.string().url(),
     REDIS_URL: z.string().url(),
     
     // Session
     SESSION_SECRET: z.string().min(32), // Enforce minimum length
     
     // OIDC (optional)
     OIDC_CLIENT_ID: z.string().optional(),
     OIDC_CLIENT_SECRET: z.string().optional(),
     OIDC_ISSUER_URL: z.string().url().optional(),
     OIDC_REDIRECT_URI: z.string().url().optional(),
     
     // Environment
     NODE_ENV: z.enum(['development', 'production']).default('development'),
   });
   
   export const env = envSchema.parse(process.env);
   ```

2. Create `src/config/constants.ts` for Phase 1 constants:
   ```typescript
   // D-08: 30-day session validity
   export const SESSION_EXPIRY_DAYS = 30;
   export const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;
   
   // D-06: Cookie security settings
   export const COOKIE_OPTIONS = {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production', // HTTPS in prod, HTTP in dev
     sameSite: 'strict' as const, // D-14: SameSite=Strict
     maxAge: SESSION_EXPIRY_MS,
   };
   
   // D-19: Permission levels
   export const API_KEY_PERMISSIONS = ['read', 'read_write'] as const;
   export type APIKeyPermission = (typeof API_KEY_PERMISSIONS)[number];
   ```

3. Update `.env.local` with actual values (for local development):
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/livenex_dev
   REDIS_URL=redis://localhost:6379
   SESSION_SECRET=dev-secret-key-at-least-32-characters-long
   NODE_ENV=development
   ```

4. Verify all required env vars are set before app starts:
   - Create `src/lib/validateEnv.ts` that calls `env` on startup
   - Add to app entry point to fail fast if config is invalid

**Verify:**
- `env` object validates and exports all variables
- `NODE_ENV=development` allows HTTP, `NODE_ENV=production` requires HTTPS
- `SESSION_SECRET` enforces minimum 32 characters
- OIDC variables are optional (can be undefined)
- Missing required vars throw error with helpful message

**Done:** Environment configured, validation working, constants available

**Decision References:** D-06 (HTTPS in prod), D-08 (30-day expiry), D-14 (SameSite=Strict)

---

### WAVE 2: Backend Core (6 hours) and Frontend Core (4 hours)

#### Task 2-01: better-auth Integration & Session Management
**Type:** `auto`  
**Files:** `src/lib/auth.ts`, `src/api/auth/route.ts` (or ElysiaJS equivalent)  
**Dependencies:** Task 1-02 (schema), Task 1-03 (env)  
**Creates:** Authentication system, session middleware, OIDC support

**Action:**
1. Install better-auth and set up authentication instance:
   ```bash
   npm install @better-auth/core
   ```

2. Create `src/lib/auth.ts`:
   ```typescript
   import { betterAuth } from '@better-auth/core';
   import { drizzleAdapter } from '@better-auth/drizzle';
   import { db } from '@/db';
   import { env } from '@/config/env';
   
   export const auth = betterAuth({
     database: drizzleAdapter(db, {
       provider: 'pg',
       schema: {
         user: 'users',
         session: 'sessions',
       },
     }),
     emailAndPassword: {
       enabled: true, // D-01: Password-based login
     },
     socialProviders: env.OIDC_CLIENT_ID ? {
       oidc: {
         clientId: env.OIDC_CLIENT_ID,
         clientSecret: env.OIDC_CLIENT_SECRET!,
         issuer: env.OIDC_ISSUER_URL!,
         discoveryUrl: `${env.OIDC_ISSUER_URL}/.well-known/openid-configuration`,
       },
     } : undefined, // D-02: Optional OIDC
     session: {
       expiresIn: 30 * 24 * 60 * 60, // D-08: 30 days in seconds
       cookieOptions: {
         httpOnly: true, // D-06: XSS protection
         secure: env.NODE_ENV === 'production', // D-15: HTTPS in prod
         sameSite: 'strict', // D-14: CORS prevention
       },
     },
   });
   ```

3. Create ElysiaJS endpoint handlers for auth flows:
   - `POST /auth/signin` — Password login (D-01)
   - `POST /auth/oidc/authorize` — OIDC redirect (D-02)
   - `POST /auth/oidc/callback` — OIDC callback
   - `POST /auth/logout` — Session logout (D-16)
   - `GET /auth/session` — Get current session

4. Implement session middleware that:
   - Reads httpOnly cookies (D-06)
   - Validates session token
   - Attaches user object to request context
   - Enforces 30-day expiration (D-08)
   - Allows multiple independent sessions (D-09)

5. Create error handling for:
   - Invalid credentials → 401 + "Invalid email or password"
   - Missing OIDC config → helpful error message
   - Session expired → redirect to login
   - OIDC callback errors → redirect to login with error message

**Verify:**
- `POST /auth/signin` with valid credentials → returns session cookie, user object
- `POST /auth/signin` with invalid credentials → returns 401 error
- Session cookie set with `httpOnly`, `secure` (in prod), `sameSite=strict`
- `GET /auth/session` with valid session → returns user info
- `GET /auth/session` without session → returns null/401
- `POST /auth/logout` → clears session cookie (D-16)
- OIDC endpoint redirects to provider if enabled

**Done:** Authentication system working, sessions created, logout functional

**Decision References:** D-01, D-02, D-03, D-06, D-08, D-09, D-14, D-15, D-16

---

#### Task 2-02: Database Migrations & Initial Setup
**Type:** `auto`  
**Files:** `db/migrate.ts`, `src/db/index.ts`, scripts to run migrations  
**Dependencies:** Task 1-02 (schema), Task 2-01 (better-auth)  
**Creates:** Database connection, migration runner, initialization script

**Action:**
1. Create `src/db/index.ts` for database connection:
   ```typescript
   import { drizzle } from 'drizzle-orm/postgres-js';
   import postgres from 'postgres';
   import { env } from '@/config/env';
   import * as schema from './schema';
   
   const client = postgres(env.DATABASE_URL);
   export const db = drizzle(client, { schema });
   ```

2. Create `db/migrate.ts` script to run migrations:
   ```typescript
   import { migrate } from 'drizzle-orm/postgres-js/migrator';
   import { db } from '@/db';
   
   async function runMigrations() {
     console.log('Running migrations...');
     try {
       await migrate(db, { migrationsFolder: './db/migrations' });
       console.log('✅ Migrations completed successfully');
     } catch (err) {
       console.error('❌ Migration failed:', err);
       process.exit(1);
     }
   }
   
   runMigrations();
   ```

3. Create `package.json` scripts:
   ```json
   {
     "scripts": {
       "db:migrate": "node --loader tsx db/migrate.ts",
       "db:push": "drizzle-kit push:pg",
       "db:seed": "node --loader tsx db/seed.ts"
     }
   }
   ```

4. Create `db/seed.ts` for initial setup (optional test user):
   ```typescript
   import { db } from '@/db';
   import { users } from '@/db/schema';
   
   async function seed() {
     console.log('Seeding database...');
     // Optional: Create a test user for development
     // (In production, user would create account via signup flow)
     console.log('✅ Seed completed');
   }
   ```

5. Document setup process in `docs/DATABASE.md`:
   - PostgreSQL installation
   - Running migrations: `npm run db:migrate`
   - Verifying schema: `psql livenex_dev -c "\dt"`

**Verify:**
- `npm run db:migrate` runs without errors
- Tables exist in PostgreSQL: `users`, `sessions`, `api_keys`, `api_key_scopes`
- `db` object exports correctly for use in route handlers
- Indexes created for performance

**Done:** Database connected, migrations applied, ready for data operations

**Decision References:** (Infrastructure, no specific decisions)

---

#### Task 2-03: Authentication Routes & Middleware
**Type:** `auto`  
**Files:** `src/api/auth/signin.ts`, `src/api/auth/logout.ts`, `src/api/auth/session.ts`, `src/middleware/auth.ts`  
**Dependencies:** Task 2-01 (better-auth), Task 2-02 (database)  
**Creates:** Authenticated API endpoints, middleware for protected pages

**Action:**
1. Create ElysiaJS auth routes in `src/api/auth/`:

   **`POST /auth/signin`** (D-01, D-03):
   - Accept `{ email, password }` in body
   - Validate using zod: `email` is valid email, `password` is non-empty
   - Call `auth.signIn({ email, password })`
   - Return `{ success: true, user: {...} }` or `{ success: false, error: "Invalid credentials" }`
   - On success, httpOnly cookie is set automatically by better-auth

   **`POST /auth/logout`** (D-16, D-17):
   - Require authentication (middleware)
   - Call `auth.logout()`
   - Return `{ success: true }`
   - Client redirects to `/auth/login` (D-16)
   - No confirmation dialog (D-17)

   **`GET /auth/session`**:
   - No authentication required (check cookie, return null if missing)
   - Return current session or null
   - Used by frontend to check login status on page load

   **`POST /auth/oidc/authorize`** (D-02, if OIDC enabled):
   - Return redirect URL to OIDC provider
   - Include `clientId`, `redirectUri`, `scope=openid profile email`

   **`POST /auth/oidc/callback`** (D-02):
   - Accept `code` and `state` from OIDC provider
   - Exchange for token
   - Find or create user based on email
   - Create session
   - Redirect to dashboard (D-07)

2. Create authentication middleware `src/middleware/auth.ts`:
   ```typescript
   export async function requireAuth(request: Request) {
     const session = await getSessionFromCookie(request);
     if (!session) {
       return new Response('Unauthorized', { status: 401 });
     }
     return { session, userId: session.userId };
   }
   ```

3. Error handling:
   - Invalid email format → 400 + error message
   - User not found → 401 + "Invalid credentials" (don't reveal user existence)
   - Password mismatch → 401 + "Invalid credentials"
   - OIDC provider unreachable → 500 + "OIDC provider error"
   - Session expired → 401 + "Session expired, please log in again"

4. Logging (for debugging auth issues):
   - Log successful logins (user email, timestamp)
   - Log failed login attempts (email, reason, timestamp)
   - Log logouts (user email, timestamp)

**Verify:**
- `POST /auth/signin` with valid credentials works
- `POST /auth/signin` with invalid credentials returns 401
- Session cookie set in response headers with correct flags
- `GET /auth/session` returns user if authenticated, null otherwise
- `POST /auth/logout` clears session
- OIDC flow (if enabled) redirects correctly
- All error cases return helpful messages (no stack traces)

**Done:** All auth endpoints working, sessions established, logout functional

**Decision References:** D-01, D-02, D-03, D-07, D-16, D-17

---

#### Task 2-04: TanStack Start Frontend Setup
**Type:** `auto`  
**Files:** `src/routes/`, `src/components/`, `tsconfig.json` (frontend config)  
**Dependencies:** Task 1-01 (project initialized)  
**Creates:** Frontend routing structure, component library setup

**Action:**
1. Verify TanStack Start project structure:
   - `src/routes/` for page components
   - `src/components/` for reusable components
   - `src/lib/` for utilities
   - Tailwind CSS configured

2. Set up shadcn/ui components (copy from component library):
   - Button (`src/components/ui/button.tsx`)
   - Form (`src/components/ui/form.tsx`)
   - Input (`src/components/ui/input.tsx`)
   - Dialog (`src/components/ui/dialog.tsx`)
   - Toast/Toaster (`src/components/ui/toast.tsx`, `src/components/ui/toaster.tsx`)
   - Table (`src/components/ui/table.tsx`)
   - Card (`src/components/ui/card.tsx`)
   - Command: `npx shadcn-ui@latest add button form input dialog toast table card`

3. Create frontend type definitions in `src/types/`:
   - `auth.ts`: `{ email, password, user, session }`
   - `api-key.ts`: `{ id, name, permission, expiresAt, createdAt, lastUsedAt }`
   - `api.ts`: Standard response format `{ success, data, error }`

4. Create API client utilities in `src/lib/api.ts`:
   ```typescript
   export async function apiCall<T>(
     endpoint: string,
     options?: RequestInit
   ): Promise<T> {
     const response = await fetch(endpoint, {
       ...options,
       headers: {
         'Content-Type': 'application/json',
         ...options?.headers,
       },
     });
     if (!response.ok) {
       throw new Error(`API error: ${response.statusText}`);
     }
     return response.json();
   }
   ```

5. Set up routing structure:
   - `/` → redirect to `/auth/login` if not authenticated, else `/dashboard`
   - `/auth/login` → login page (public)
   - `/dashboard` → monitor list (private)
   - `/settings/api-keys` → API keys management (private)

6. Create layout components:
   - `AuthLayout` (login page, no sidebar)
   - `DashboardLayout` (sidebar, navigation, user menu)

**Verify:**
- TanStack Start builds without errors
- shadcn/ui components available and imported correctly
- Routing configuration works
- API client can be called from components
- TypeScript types compile

**Done:** Frontend structure ready, components available, routing configured

**Decision References:** (Frontend infrastructure, no specific decisions)

---

#### Task 2-05: Login Page Implementation
**Type:** `auto`  
**Files:** `src/routes/auth/login.tsx`, `src/components/LoginForm.tsx`  
**Dependencies:** Task 2-01 (auth endpoints), Task 2-04 (TanStack Start)  
**Creates:** Functional login page with password + optional OIDC

**Action:**
1. Create `src/routes/auth/login.tsx` (page component):
   ```typescript
   export default function LoginPage() {
     // Check if already logged in → redirect to /dashboard
     const [session, setSession] = useState(null);
     
     useEffect(() => {
       fetch('/auth/session').then(r => r.json()).then(setSession);
     }, []);
     
     if (session) return <Navigate to="/dashboard" />;
     
     return (
       <AuthLayout>
         <LoginForm />
       </AuthLayout>
     );
   }
   ```

2. Create `src/components/LoginForm.tsx`:
   - Email input field
   - Password input field
   - "Sign In" button
   - Error message display
   - Loading state during submission
   - Optional: "Login with [OIDC Provider]" button (D-02, D-03)

3. Implement login flow:
   ```typescript
   async function handleLogin(email: string, password: string) {
     try {
       const response = await fetch('/auth/signin', {
         method: 'POST',
         body: JSON.stringify({ email, password }),
         headers: { 'Content-Type': 'application/json' },
       });
       
       if (response.ok) {
         navigate('/dashboard'); // D-07: Post-login redirect
       } else {
         const error = await response.json();
         showError(error.message || 'Invalid credentials');
       }
     } catch (err) {
       showError('Login failed. Please try again.');
     }
   }
   ```

4. Form validation (client-side, zod):
   - Email must be valid format
   - Password must not be empty
   - Real validation happens server-side

5. Error handling:
   - Network error → "Unable to connect. Check your internet."
   - Invalid credentials → "Invalid email or password" (D-01)
   - 5xx error → "Server error. Please try again later."

6. OIDC provider button (D-02, D-03):
   - Show button only if `OIDC_CLIENT_ID` is configured
   - On click, redirect to `/auth/oidc/authorize` endpoint
   - Endpoint returns redirect URL to provider

7. Styling with Tailwind + shadcn/ui:
   - Center login form on page
   - Logo/branding at top
   - Email field
   - Password field
   - Sign In button (disabled during submission)
   - Optional OIDC button below
   - Error message in red

**Verify:**
- Page loads without auth cookie → shows login form
- Page loads with valid session → redirects to dashboard
- Valid credentials → successful login, redirected to dashboard
- Invalid credentials → error message displayed
- Empty fields → validation error
- OIDC button visible if provider configured, hidden if not
- Loading state works (button disabled, spinner shows)

**Done:** Login page fully functional, password and OIDC flows working

**Decision References:** D-01, D-02, D-03, D-07

---

#### Task 2-06: Dashboard Skeleton & Layout
**Type:** `auto`  
**Files:** `src/routes/dashboard/index.tsx`, `src/components/DashboardLayout.tsx`, `src/components/UserMenu.tsx`  
**Dependencies:** Task 2-01 (auth), Task 2-04 (frontend)  
**Creates:** Protected dashboard page, navigation layout, logout button

**Action:**
1. Create `src/components/DashboardLayout.tsx`:
   ```typescript
   export function DashboardLayout({ children }: { children: ReactNode }) {
     return (
       <div className="flex min-h-screen">
         <aside className="w-64 bg-slate-100 p-6">
           <h1 className="text-2xl font-bold mb-8">Livenex</h1>
           <nav>
             <NavLink to="/dashboard">Dashboard</NavLink>
             <NavLink to="/settings/api-keys">API Keys</NavLink>
           </nav>
           <UserMenu />
         </aside>
         <main className="flex-1 p-8">
           {children}
         </main>
       </div>
     );
   }
   ```

2. Create `src/components/UserMenu.tsx`:
   - Display user email
   - Logout button (D-16)
   - Settings link (optional in Phase 1)

3. Implement logout handler (D-16, D-17):
   ```typescript
   async function handleLogout() {
     // D-26 would apply to API keys, not logout (no confirmation for logout per D-17)
     await fetch('/auth/logout', { method: 'POST' });
     navigate('/auth/login'); // D-16: Redirect to login
   }
   ```

4. Create `src/routes/dashboard/index.tsx`:
   ```typescript
   export default function DashboardPage() {
     // Require authentication (middleware)
     const [session, setSession] = useState(null);
     
     useEffect(() => {
       fetch('/auth/session').then(r => r.json()).then(setSession);
     }, []);
     
     if (!session) return <Navigate to="/auth/login" />;
     
     return (
       <DashboardLayout>
         <h2>Welcome, {session.user.email}</h2>
         <p>No monitors yet. Create one in Phase 2.</p>
       </DashboardLayout>
     );
   }
   ```

5. Create middleware to protect private routes:
   - Wrap `/dashboard/*` and `/settings/*` with auth check
   - If no session, redirect to login
   - If session expired, refresh or redirect to login

6. Styling:
   - Sidebar with Livenex logo
   - Current page highlighted in nav
   - User menu in bottom of sidebar
   - Logout button clearly visible

**Verify:**
- Page requires authentication (no session → redirect to login)
- User email displayed
- Sidebar navigation visible
- Logout button works and redirects to login
- Layout responsive (sidebar on desktop, hamburger on mobile)
- Private routes inaccessible without session

**Done:** Dashboard layout complete, logout functional, auth protection working

**Decision References:** D-16, D-17 (logout behavior)

---

### WAVE 3: API Key System (3 hours)

#### Task 3-01: API Key Generation, Storage & Validation
**Type:** `auto`  
**Files:** `src/lib/apiKey.ts`, `src/db/schema.ts` (updated)  
**Dependencies:** Task 2-02 (database), Task 1-02 (schema includes api_keys table)  
**Creates:** API key generation logic, validation system, last-used tracking

**Action:**
1. Create `src/lib/apiKey.ts` for cryptographic operations:
   ```typescript
   import { randomBytes, createHash } from 'crypto';
   import { v4 as uuidv4 } from 'uuid';
   
   /**
    * Generate a new API key pair (ID + secret)
    * Returns: { keyId: uuid, keySecret: random_string }
    */
   export function generateAPIKey() {
     const keyId = uuidv4();
     const keySecret = randomBytes(32).toString('hex'); // 64 chars hex
     return { keyId, keySecret };
   }
   
   /**
    * Hash the secret (never store plaintext)
    */
   export function hashSecret(secret: string): string {
     return createHash('sha256').update(secret).digest('hex');
   }
   
   /**
    * Validate secret against hash
    */
   export function validateSecret(plaintext: string, hash: string): boolean {
     return hashSecret(plaintext) === hash;
   }
   ```

2. Create `src/services/apiKeyService.ts` for API key operations:
   ```typescript
   export async function createAPIKey(
     userId: string,
     name: string,
     permission: 'read' | 'read_write',
     expiresAt?: Date,
     scopes?: string[]
   ) {
     const { keyId, keySecret } = generateAPIKey();
     const secretHash = hashSecret(keySecret);
     
     // Store in database (never store keySecret)
     const key = await db.insert(apiKeys).values({
       id: keyId,
       userId,
       name,
       secretHash,
       permission,
       expiresAt,
       createdAt: new Date(),
     });
     
     // Insert scopes if provided
     if (scopes?.length) {
       await db.insert(apiKeyScopes).values(
         scopes.map(scope => ({ apiKeyId: keyId, scope }))
       );
     }
     
     // Return secret ONE TIME ONLY (D-22)
     return { keyId, keySecret }; // Client must copy immediately
   }
   
   export async function validateAPIKey(keySecret: string) {
     const secretHash = hashSecret(keySecret);
     const key = await db.query.apiKeys.findFirst({
       where: and(
         eq(apiKeys.secretHash, secretHash),
         isNull(apiKeys.revokedAt), // Only valid keys (D-22 implies revocation)
         or(
           isNull(apiKeys.expiresAt),
           gt(apiKeys.expiresAt, new Date())
         ) // Not expired
       ),
     });
     
     if (!key) return null;
     
     // D-29: Update last-used timestamp
     await db.update(apiKeys)
       .set({ lastUsedAt: new Date() })
       .where(eq(apiKeys.id, key.id));
     
     return key;
   }
   ```

3. API key validation middleware (for later use in Phase 2+):
   ```typescript
   export async function requireAPIKey(request: Request) {
     const authHeader = request.headers.get('Authorization') || '';
     const match = authHeader.match(/Bearer\s+(\S+)/);
     
     if (!match?.[1]) {
       return null; // No API key
     }
     
     const key = await validateAPIKey(match[1]);
     if (!key) {
       throw new Error('Invalid or expired API key');
     }
     
     return key;
   }
   ```

4. Database schema validation (ensure api_keys table is correct):
   - `id` (TEXT PRIMARY KEY)
   - `userId` (TEXT FOREIGN KEY)
   - `name` (TEXT NOT NULL)
   - `secretHash` (TEXT NOT NULL)
   - `permission` (TEXT: 'read' | 'read_write')
   - `expiresAt` (TIMESTAMP, nullable)
   - `createdAt` (TIMESTAMP)
   - `lastUsedAt` (TIMESTAMP, nullable)
   - `revokedAt` (TIMESTAMP, nullable)

**Verify:**
- `generateAPIKey()` produces valid UUID + random secret
- `hashSecret()` produces consistent hash for same input
- `validateSecret()` matches plaintext to hash correctly
- `createAPIKey()` stores key with hashed secret
- `validateAPIKey()` finds and validates key
- `lastUsedAt` updated on validation
- Expired keys rejected
- Revoked keys rejected

**Done:** API key generation and validation system working

**Decision References:** D-18 (scopes), D-19 (permissions), D-20 (expiration), D-22 (display once), D-29 (last-used)

---

#### Task 3-02: API Key Routes (CRUD & Validation)
**Type:** `auto`  
**Files:** `src/api/keys/*.ts` (create, list, get, regenerate, delete)  
**Dependencies:** Task 3-01 (API key service), Task 2-01 (auth middleware)  
**Creates:** API endpoints for API key management

**Action:**
1. Create ElysiaJS routes under `src/api/keys/`:

   **`POST /api/keys`** (Create):
   - Require authentication
   - Accept `{ name, permission, expiresAt?, scopes? }`
   - Validate using zod
   - Call `createAPIKey()`
   - Return `{ keyId, keySecret }` with 200 status
   - D-22: Client must copy immediately
   - D-28: Support custom names

   **`GET /api/keys`** (List):
   - Require authentication
   - Return array of keys for current user
   - D-23: Include `name, createdAt, expiresAt, lastUsedAt, scopes, permission`
   - Exclude `secretHash` (never expose)
   - Mark revoked keys (or exclude them)
   - D-29: Show `lastUsedAt` timestamp

   **`GET /api/keys/:id`** (Get details):
   - Require authentication
   - Verify key belongs to current user
   - Return full key details (no secret)
   - Useful for displaying in a modal before regenerate/revoke

   **`POST /api/keys/:id/regenerate`** (D-21, D-25):
   - Require authentication
   - Verify key belongs to current user
   - Generate new secret
   - Update secret hash
   - Preserve name, scopes, permission
   - Return `{ keyId, keySecret }` (new secret)
   - Old secret immediately invalid

   **`DELETE /api/keys/:id`** (Revoke, D-25):
   - Require authentication
   - Verify key belongs to current user
   - D-26: Require confirmation (handled on frontend)
   - Mark as revoked: set `revokedAt` timestamp
   - Return success message

   **`POST /api/validate`** (Validate, for later phases):
   - Accept `Authorization: Bearer <secret>` header
   - Call `validateAPIKey()`
   - Return `{ userId, permission, scopes }` if valid
   - Return 401 if invalid/expired/revoked

2. Error handling:
   - Missing required fields → 400 + error message
   - Unauthorized (wrong user) → 403
   - Key not found → 404
   - Permission denied → 403
   - Expiration in past → 400 + "Expiration must be in future"
   - Invalid scope → 400 + "Unknown scope"

3. Input validation (zod schemas):
   ```typescript
   const CreateKeySchema = z.object({
     name: z.string().min(1).max(100), // D-28: Allow naming
     permission: z.enum(['read', 'read_write']), // D-19
     expiresAt: z.date().optional(), // D-20
     scopes: z.array(z.string()).optional(), // D-18
   });
   ```

4. Response format consistency:
   ```typescript
   // Success
   { success: true, data: { keyId, keySecret?, ... } }
   
   // Error
   { success: false, error: "Descriptive error message" }
   ```

**Verify:**
- `POST /api/keys` creates key, returns secret once
- `GET /api/keys` lists all keys for user
- `GET /api/keys/:id` returns specific key details
- `POST /api/keys/:id/regenerate` generates new secret
- `DELETE /api/keys/:id` revokes key
- Revoked key cannot be validated
- Expired key cannot be validated
- Wrong user cannot revoke another user's key
- All endpoints require authentication
- Error messages are helpful, not exposing internals

**Done:** API key CRUD endpoints fully functional

**Decision References:** D-18, D-19, D-20, D-21, D-22, D-25, D-26, D-28, D-29

---

#### Task 3-03: API Keys Management Page (Frontend)
**Type:** `auto`  
**Files:** `src/routes/settings/api-keys.tsx`, `src/components/APIKeyList.tsx`, `src/components/CreateKeyDialog.tsx`  
**Dependencies:** Task 2-04 (frontend), Task 3-02 (API endpoints)  
**Creates:** Functional UI for API key management

**Action:**
1. Create `src/routes/settings/api-keys.tsx`:
   ```typescript
   export default function APIKeysPage() {
     const [keys, setKeys] = useState([]);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       fetchKeys();
     }, []);
     
     async function fetchKeys() {
       const response = await fetch('/api/keys');
       if (response.ok) {
         setKeys(await response.json());
       }
       setLoading(false);
     }
     
     return (
       <DashboardLayout>
         <div>
           <h2>API Keys</h2>
           <CreateKeyDialog onKeyCreated={fetchKeys} />
           {loading ? <Spinner /> : <APIKeyList keys={keys} onKeysChanged={fetchKeys} />}
         </div>
       </DashboardLayout>
     );
   }
   ```

2. Create `src/components/APIKeyList.tsx` (D-23):
   - Table with columns: Name, Created, Expires, Last Used, Scopes, Permission, Actions
   - Truncate secret if shown (use `••••` pattern)
   - Action buttons: View, Regenerate, Revoke
   - Empty state: "No API keys yet. Create one to enable automation."
   - Sort by created date (newest first)

3. Create `src/components/CreateKeyDialog.tsx` (D-24, D-28):
   - Dialog/modal (not multi-step wizard per D-24)
   - Form fields:
     - Name (required, text input) — D-28
     - Permission (dropdown: "Read-only" or "Read & Write") — D-19
     - Expires (optional date picker) — D-20
     - Scopes (multi-select for monitor groups) — D-18
   - Submit button: "Create Key"
   - On success:
     - Show modal with secret text (D-22)
     - "Copy to clipboard" button
     - "Done" button (closes modal and refreshes list)
   - Error handling: display error message in modal

4. Create `src/components/RegenerateKeyDialog.tsx`:
   - Confirmation: "Generate a new secret for this key?"
   - "This will invalidate the old secret immediately."
   - On success: show new secret (D-22)
   - Same copy/done flow as create

5. Create `src/components/RevokeKeyDialog.tsx`:
   - Confirmation: "Revoke this API key?" — D-26
   - "This action cannot be undone."
   - On confirm: revoke and refresh list
   - D-27: Show success toast

6. Implement toast notifications (D-27):
   ```typescript
   // After successful revoke/regenerate
   toast.success("API key revoked"); // or "API key regenerated"
   ```

7. Styling with shadcn/ui:
   - Use Table component for list (D-23)
   - Use Dialog component for modals (D-24)
   - Use Button component for actions
   - Use Input for name field
   - Use Select for permission/scope selection
   - Use Toast for success feedback (D-27)

**Verify:**
- List shows all keys with correct columns (D-23)
- Create dialog appears and submits (D-24)
- Secret displayed once after creation (D-22)
- Secret NOT displayed on list view
- Copy to clipboard works
- Regenerate shows new secret (D-21, D-22)
- Revoke requires confirmation (D-26)
- Toast notification appears on success (D-27)
- Key name appears correctly (D-28)
- Expired dates calculated correctly (D-20)
- Last-used timestamp displays when available (D-29)

**Done:** API key management UI complete, fully functional

**Decision References:** D-18, D-19, D-20, D-21, D-22, D-23, D-24, D-25, D-26, D-27, D-28, D-29

---

### WAVE 4: Integration & Testing (6 hours)

#### Task 4-01: Authentication Middleware & Route Protection
**Type:** `auto`  
**Files:** `src/middleware/auth.ts`, `src/middleware/requireAuth.ts`, route guards  
**Dependencies:** Task 2-01 (auth), Task 2-04 (frontend)  
**Creates:** Middleware protecting private routes, session validation

**Action:**
1. Create backend middleware in `src/middleware/auth.ts`:
   ```typescript
   export async function withAuth(handler) {
     return async (request: Request, context: any) => {
       const session = await getSessionFromCookie(request);
       if (!session) {
         return new Response('Unauthorized', { status: 401 });
       }
       context.session = session;
       context.userId = session.userId;
       return handler(request, context);
     };
   }
   ```

2. Create frontend route protection:
   - Wrap all private routes (`/dashboard/*`, `/settings/*`) with `PrivateRoute` component
   - `PrivateRoute` checks session on mount, redirects to login if missing
   - Show loading spinner while checking

3. Update ElysiaJS route handlers to use middleware:
   ```typescript
   app.post('/auth/logout', withAuth, async (req, ctx) => {
     // ctx.session and ctx.userId available
   });
   ```

4. Create global error handler:
   - Catch 401 errors on API calls
   - Redirect to login (session expired)
   - Show error toast

5. Verify middleware order:
   - Authentication happens before authorization
   - Session validation before API key validation

**Verify:**
- Private routes redirect to login without session
- Session restored from cookie on page load
- Logout clears session
- Session validation works across requests
- 401 errors redirect to login

**Done:** Auth protection middleware working, private routes secured

**Decision References:** D-06 (httpOnly cookies validate automatically)

---

#### Task 4-02: Error Handling & User Feedback
**Type:** `auto`  
**Files:** `src/lib/errors.ts`, error handlers in routes, toast notifications  
**Dependencies:** Task 2-01-03-02 (all routes/endpoints)  
**Creates:** Consistent error handling, user-friendly messages

**Action:**
1. Create `src/lib/errors.ts` for error types:
   ```typescript
   export class AuthError extends Error {
     constructor(message: string, public code: 'INVALID_CREDENTIALS' | 'SESSION_EXPIRED') {
       super(message);
     }
   }
   
   export class APIKeyError extends Error {
     constructor(message: string, public code: 'INVALID_KEY' | 'KEY_EXPIRED' | 'KEY_REVOKED') {
       super(message);
     }
   }
   ```

2. Error handling in auth endpoints:
   - Invalid credentials → 401 + "Invalid email or password" (D-01)
   - Session expired → 401 + "Session expired, please log in"
   - OIDC error → 400 + "OIDC provider error: [reason]"
   - Database error → 500 + "Database error" (never expose details)

3. Error handling in API key endpoints:
   - Permission denied → 403 + "You don't have permission to access this key"
   - Key not found → 404 + "API key not found"
   - Invalid request → 400 + specific validation error

4. Frontend error display:
   - Network errors → toast: "Network error. Check your connection."
   - 4xx errors → toast: custom error message from server
   - 5xx errors → toast: "Server error. Please try again later."
   - Form validation errors → inline in form (below input)

5. Logging for debugging:
   - Log all auth errors (non-sensitive: email hashed, no passwords)
   - Log all API key operations (create, regenerate, revoke)
   - Log errors with timestamps and request IDs

**Verify:**
- Error messages are user-friendly (no stack traces)
- Sensitive information not exposed (no hashing details, password checks)
- Network errors handled gracefully
- Toast notifications appear on error
- Form validation errors display inline

**Done:** Error handling consistent, user feedback clear

**Decision References:** D-01 (credential errors)

---

#### Task 4-03: Authentication Unit & Integration Tests
**Type:** `auto`  
**Files:** `src/__tests__/auth.test.ts`, test fixtures  
**Dependencies:** Task 2-01-03 (auth system)  
**Creates:** Comprehensive auth test coverage

**Action:**
1. Set up test framework (Vitest or Jest):
   ```bash
   npm install --save-dev vitest @testing-library/react
   ```

2. Create test file `src/__tests__/auth.test.ts`:

   **Unit tests for better-auth integration:**
   - Test: Password validation works correctly
   - Test: Session creation and storage
   - Test: Session expiration (30 days) — D-08
   - Test: Multiple sessions for same user — D-09
   - Test: Session logout clears cookie — D-16
   - Test: Invalid credentials rejected
   - Test: OIDC provider redirect (if enabled) — D-02

   **Integration tests for auth endpoints:**
   - Test: `POST /auth/signin` with valid credentials → success, session cookie set
   - Test: `POST /auth/signin` with invalid credentials → 401 error
   - Test: `POST /auth/logout` → clears session, redirects work
   - Test: `GET /auth/session` → returns user if authenticated, null otherwise
   - Test: Session persists across multiple requests
   - Test: Expired session rejected

   **Frontend auth tests:**
   - Test: Login page renders
   - Test: Form submission calls API correctly
   - Test: Error messages display on login failure
   - Test: Successful login redirects to dashboard
   - Test: Unauthenticated access redirected to login

3. Test data helpers:
   ```typescript
   async function createTestUser(email: string, password: string) {
     // Create user via auth system
   }
   
   async function createTestSession(userId: string) {
     // Create session for testing
   }
   ```

4. Test structure:
   ```typescript
   describe('Authentication', () => {
     describe('Password Login', () => {
       it('should accept valid credentials', async () => { ... });
       it('should reject invalid password', async () => { ... });
     });
     
     describe('Session Management', () => {
       it('should create 30-day session', async () => { ... });
       it('should allow multiple sessions per user', async () => { ... });
     });
   });
   ```

**Verify:**
- All auth tests pass
- Password hashing verified (bcrypt or similar)
- Session expiration calculated correctly
- Multiple sessions tracked independently
- Logout clears only current session (not others) — D-10

**Done:** Auth system comprehensively tested

**Decision References:** D-08, D-09, D-10, D-16

---

#### Task 4-04: API Key System Tests
**Type:** `auto`  
**Files:** `src/__tests__/apiKey.test.ts`  
**Dependencies:** Task 3-01-02 (API key system)  
**Creates:** API key validation and permission tests

**Action:**
1. Create `src/__tests__/apiKey.test.ts`:

   **Unit tests for API key generation:**
   - Test: `generateAPIKey()` produces unique pairs
   - Test: `hashSecret()` produces consistent hash
   - Test: `validateSecret()` correctly validates plaintext
   - Test: Hash is not reversible (cannot get plaintext from hash)

   **Unit tests for API key lifecycle:**
   - Test: Create API key with scopes — D-18
   - Test: Create API key with permissions (read/read_write) — D-19
   - Test: Create API key with expiration — D-20
   - Test: Regenerate key (new secret, old invalid) — D-21
   - Test: Revoke key (immediately stops working)
   - Test: Last-used timestamp updates — D-29

   **Integration tests for API key endpoints:**
   - Test: `POST /api/keys` creates and returns secret once — D-22
   - Test: `GET /api/keys` lists keys for user (no secrets)
   - Test: `GET /api/keys/:id` shows key details (no secret)
   - Test: `POST /api/keys/:id/regenerate` generates new secret
   - Test: `DELETE /api/keys/:id` revokes key with confirmation — D-26
   - Test: Revoked key fails validation

   **Permission validation tests:**
   - Test: Read-only key cannot write
   - Test: Read-write key can read and write
   - Test: Scope limits API calls to specific groups — D-18

   **Expiration tests:**
   - Test: Non-expired key validates
   - Test: Expired key rejects
   - Test: NULL expiration (persistent key) never expires — D-20

2. Test structure:
   ```typescript
   describe('API Key Management', () => {
     describe('Key Generation', () => {
       it('should generate unique secrets', async () => { ... });
       it('should hash secrets securely', async () => { ... });
     });
     
     describe('Key Validation', () => {
       it('should validate active key', async () => { ... });
       it('should reject expired key', async () => { ... });
       it('should reject revoked key', async () => { ... });
     });
     
     describe('Scopes', () => {
       it('should limit key to specified scopes', async () => { ... });
     });
   });
   ```

3. Test data setup:
   ```typescript
   async function createTestKey(userId: string, scopes?: string[]) {
     // Create API key with test data
   }
   ```

**Verify:**
- All API key tests pass
- Secrets hashed, never stored plaintext
- Expiration and revocation work correctly
- Scopes enforced on validation
- Last-used timestamp accurate

**Done:** API key system comprehensively tested

**Decision References:** D-18, D-19, D-20, D-21, D-22, D-26, D-29

---

### WAVE 5: Final Integration & Documentation (4 hours)

#### Task 5-01: End-to-End Integration Testing
**Type:** `auto`  
**Files:** `src/__tests__/e2e.test.ts` or Playwright tests  
**Dependencies:** All other tasks  
**Creates:** Full workflow validation, browser-based testing

**Action:**
1. Create end-to-end test scenarios:

   **Scenario 1: User signup and first login**
   - User navigates to app
   - Redirected to login page
   - User enters email + password (signup)
   - Account created, session started
   - Redirected to dashboard (D-07)
   - User email visible

   **Scenario 2: Create and use API key**
   - User logs in
   - Navigates to Settings > API Keys
   - Clicks "Create Key"
   - Fills form: name, permission, scopes (D-28, D-19, D-18)
   - Submits
   - Secret displayed (D-22)
   - User copies secret
   - Dialog closes, key appears in list
   - Key shows correct metadata (D-23)

   **Scenario 3: Regenerate API key**
   - User views API keys list
   - Clicks "Regenerate" on a key
   - Confirmation dialog
   - Confirms
   - New secret displayed (D-21, D-22)
   - Old secret no longer works (verified with API call)
   - Toast shows success (D-27)

   **Scenario 4: Revoke API key**
   - User views API keys list
   - Clicks "Revoke" on a key
   - Confirmation dialog (D-26)
   - Confirms
   - Key removed from list
   - Revoked key fails API validation
   - Toast shows success (D-27)

   **Scenario 5: Multi-device sessions**
   - User logs in on Device 1
   - User logs in on Device 2
   - Both sessions active simultaneously (D-09)
   - User logs out on Device 1
   - Device 1 redirected to login
   - Device 2 session still valid (D-10)

   **Scenario 6: OIDC login (if enabled)**
   - User navigates to login
   - Sees OIDC button (D-02, D-03)
   - Clicks OIDC button
   - Redirected to provider
   - Completes provider flow
   - Redirected back to app
   - Logged in and on dashboard (D-07)

2. Use Playwright or Cypress for browser automation:
   ```bash
   npm install --save-dev @playwright/test
   ```

3. Create test file `tests/e2e.spec.ts`:
   ```typescript
   test('User can sign up and create API key', async ({ page }) => {
     // Navigate to login
     // Fill signup form
     // Submit
     // Verify on dashboard
     // Navigate to API keys
     // Create key
     // Copy secret
     // Verify in list
   });
   ```

4. Database setup for tests:
   - Create test database (or use in-memory for speed)
   - Reset database between test runs
   - Seed test data if needed

**Verify:**
- All scenarios pass end-to-end
- No manual steps required
- Browser automation works reliably
- Test runs in < 5 minutes

**Done:** End-to-end workflows validated

**Decision References:** D-07, D-09, D-10, D-18-30 (all API key decisions)

---

#### Task 5-02: Documentation & Setup Guide
**Type:** `auto`  
**Files:** `docs/SETUP.md`, `docs/AUTH.md`, `docs/API-KEYS.md`, `README.md` update  
**Dependencies:** All implementation tasks  
**Creates:** User and developer documentation

**Action:**
1. Create `docs/SETUP.md` (developer setup):
   - Prerequisites (Node.js, PostgreSQL, Redis)
   - Installation steps:
     ```bash
     git clone ...
     npm install
     cp .env.example .env.local
     # Edit .env.local with local credentials
     npm run db:migrate
     npm run dev
     ```
   - Verify setup works: navigate to `http://localhost:3000`

2. Create `docs/AUTH.md` (authentication guide):
   - Password authentication setup
   - OIDC provider configuration:
     - How to get credentials from provider
     - Environment variables to set
     - Testing OIDC login
   - Session management:
     - How sessions work
     - 30-day expiration (D-08)
     - Multi-device support (D-09)
     - Logout behavior (D-16)
   - Debugging auth issues

3. Create `docs/API-KEYS.md` (API key guide):
   - Creating API keys:
     - Name (D-28)
     - Permission levels (D-19)
     - Scopes (D-18)
     - Expiration (D-20)
   - API key security:
     - Secret displayed once (D-22)
     - Never store in code (use .env)
     - Rotate regularly (D-21)
   - Using API keys:
     - `Authorization: Bearer <secret>` header
     - Permissions on requests
     - Scope limitations
   - Monitoring API key usage:
     - Last-used timestamp (D-29)
     - Revoking keys (D-25)

4. Create `docs/DATABASE.md`:
   - PostgreSQL setup
   - Schema overview (users, sessions, api_keys, api_key_scopes)
   - Running migrations
   - Troubleshooting database issues

5. Update `README.md`:
   - Quick start (5 steps to running locally)
   - Link to documentation
   - Architecture overview
   - Requirements met (AUTH-01, AUTH-02, STAT-01)

6. Create `DECISIONS.md` (D-01 through D-30 implementation):
   - List all 30 decisions
   - Show where each is implemented
   - Example: "D-08 (30-day sessions): Session expiration in `src/config/constants.ts`, validated in `src/lib/auth.ts`"

**Verify:**
- All documentation is accurate and up-to-date
- Setup guide is followed and verified (walk through once)
- API documentation matches actual endpoints
- Links between docs work correctly

**Done:** Complete documentation written

**Decision References:** D-01-30 (all documented)

---

#### Task 5-03: Security Review & Hardening
**Type:** `auto`  
**Files:** All auth and API key files, security configs  
**Dependencies:** All implementation tasks  
**Creates:** Production-ready security posture

**Action:**
1. Security checklist (verify each):

   **Password Security:**
   - [ ] Passwords hashed with bcrypt (or similar, minimum 10 rounds)
   - [ ] No plaintext passwords stored
   - [ ] No password hints stored
   - [ ] Password validation server-side, not just client

   **Session Security:**
   - [ ] httpOnly cookie flag set (D-06) → cannot access via JavaScript
   - [ ] Secure flag set in production (HTTPS only) — D-15
   - [ ] SameSite=Strict (D-14) → prevents CSRF
   - [ ] Session tokens cryptographically signed
   - [ ] Session expiration enforced (30 days) — D-08
   - [ ] Expired sessions rejected

   **API Key Security:**
   - [ ] Secrets hashed before storage (D-22)
   - [ ] No plaintext secrets in logs or responses (except once at creation)
   - [ ] Secret validation via hash comparison
   - [ ] Revocation marks keys invalid immediately
   - [ ] Expired keys rejected (D-20)
   - [ ] Rate limiting on API key creation (prevents brute force)
   - [ ] Rate limiting on validation attempts (prevents brute force)

   **OIDC Security:**
   - [ ] OIDC state parameter validates (prevents CSRF)
   - [ ] OIDC tokens verified (signature check)
   - [ ] OIDC redirects only to configured URIs
   - [ ] HTTPS enforced for OIDC callbacks in production (D-15)

   **General Security:**
   - [ ] Input validation on all endpoints (zod schemas)
   - [ ] SQL injection prevented (using drizzle-orm parameterized queries)
   - [ ] XSS prevention (React escapes by default, no dangerouslySetInnerHTML)
   - [ ] CORS disabled or restricted (D-14)
   - [ ] Error messages don't leak sensitive info
   - [ ] Secrets not in version control (`.env.local` gitignored)
   - [ ] Rate limiting on auth endpoints

2. Production hardening:
   - Verify `.env.local` not committed
   - Check `NODE_ENV=production` behavior (HTTPS, secure cookies)
   - Enable rate limiting:
     ```typescript
     import rateLimit from 'express-rate-limit';
     const loginLimiter = rateLimit({
       windowMs: 15 * 60 * 1000, // 15 minutes
       max: 5, // 5 attempts
     });
     app.post('/auth/signin', loginLimiter, ...);
     ```

3. Security headers:
   - Content-Security-Policy (CSP) to prevent XSS
   - X-Frame-Options to prevent clickjacking
   - X-Content-Type-Options to prevent MIME sniffing

4. Audit logging (for compliance):
   - Log login attempts (email hashed, not plaintext)
   - Log API key creation, regeneration, revocation
   - Log auth failures (no passwords)
   - Keep logs for 30+ days

**Verify:**
- All security checklist items checked
- No security warnings from dependency audit: `npm audit`
- No hardcoded secrets in code
- Production config enforces HTTPS
- Rate limiting configured

**Done:** Security hardening complete, production-ready

**Decision References:** D-06 (httpOnly), D-14 (SameSite), D-15 (HTTPS), D-22 (no plaintext secrets)

---

## Decision Mapping: All 30 Decisions Implemented

| Decision ID | Category | Requirement | Implementation Task | Status |
|-------------|----------|-------------|---------------------|--------|
| D-01 | Auth | Password-based login primary | Task 2-01, 2-05 | ✅ |
| D-02 | Auth | Optional OIDC support | Task 2-01, 2-05 | ✅ |
| D-03 | Auth | Both methods enabled simultaneously | Task 2-01, 2-05 | ✅ |
| D-04 | Auth | Password reset deferred | Out of scope | ✅ |
| D-05 | Auth | No 2FA in Phase 1 | Out of scope | ✅ |
| D-06 | Auth | httpOnly secure cookies | Task 1-03, 2-01, 5-03 | ✅ |
| D-07 | Auth | Post-login redirect to dashboard | Task 2-05 | ✅ |
| D-08 | Session | 30-day session validity | Task 1-03, 2-01, 4-03 | ✅ |
| D-09 | Session | Multiple independent sessions | Task 2-01, 4-03 | ✅ |
| D-10 | Session | Per-device logout | Task 2-03, 4-03 | ✅ |
| D-11 | Session | No remote session revocation UI | Out of scope | ✅ |
| D-12 | Session | No concurrent session limit | Task 2-01 | ✅ |
| D-13 | Session | No IP-based validation | Task 2-01 | ✅ |
| D-14 | Session | CORS disabled, SameSite=Strict | Task 1-03, 2-01, 5-03 | ✅ |
| D-15 | HTTPS | HTTPS in production, HTTP in dev | Task 1-03, 2-01, 5-03 | ✅ |
| D-16 | Logout | Logout clears session immediately | Task 2-03, 2-06 | ✅ |
| D-17 | Logout | No logout confirmation | Task 2-06 | ✅ |
| D-18 | API Keys | Scoped by groups/tags | Task 1-02, 3-01, 3-02 | ✅ |
| D-19 | API Keys | Permission levels (read/read_write) | Task 1-02, 3-01, 3-02 | ✅ |
| D-20 | API Keys | Configurable expiration per key | Task 1-02, 3-01, 3-02 | ✅ |
| D-21 | API Keys | Key rotation in-place | Task 3-02, 3-03 | ✅ |
| D-22 | API Keys | Display secret once after creation | Task 3-02, 3-03 | ✅ |
| D-23 | UI | Clean list view for API keys | Task 3-03 | ✅ |
| D-24 | UI | Single dialog for key creation | Task 3-03 | ✅ |
| D-25 | UI | Per-key operations (no bulk) | Task 3-02, 3-03 | ✅ |
| D-26 | UI | Revocation requires confirmation | Task 3-03 | ✅ |
| D-27 | UI | Toast notifications for success | Task 3-03 | ✅ |
| D-28 | API Keys | Named/labeled keys | Task 1-02, 3-02, 3-03 | ✅ |
| D-29 | API Keys | Last-used tracking | Task 1-02, 3-01, 3-02 | ✅ |
| D-30 | Audit | No full audit log | Out of scope | ✅ |

---

## File Manifest: Created & Modified

### Backend (ElysiaJS + PostgreSQL)

**Configuration & Setup:**
- `package.json` — Dependencies (better-auth, ElysiaJS, drizzle-orm, zod)
- `.env.example` — Environment variables template
- `.env.local` — Local development secrets (gitignored)
- `drizzle.config.ts` — Drizzle ORM configuration
- `tsconfig.json` — TypeScript config (backend)

**Database:**
- `db/schema.ts` — Drizzle schema (users, sessions, api_keys, api_key_scopes)
- `db/index.ts` — Database connection
- `db/migrate.ts` — Migration runner
- `db/migrations/0001_initial.sql` — Initial schema migration

**Configuration:**
- `src/config/env.ts` — Type-safe environment variables
- `src/config/constants.ts` — Phase 1 constants (session expiry, cookie options, permissions)

**Authentication:**
- `src/lib/auth.ts` — better-auth integration
- `src/lib/apiKey.ts` — API key generation and validation
- `src/middleware/auth.ts` — Authentication middleware
- `src/middleware/requireAuth.ts` — Authorization helper
- `src/lib/errors.ts` — Custom error types
- `src/lib/validateEnv.ts` — Environment validation

**API Routes (ElysiaJS):**
- `src/api/auth/signin.ts` — POST /auth/signin (password login)
- `src/api/auth/logout.ts` — POST /auth/logout
- `src/api/auth/session.ts` — GET /auth/session
- `src/api/auth/oidc-authorize.ts` — POST /auth/oidc/authorize (if OIDC)
- `src/api/auth/oidc-callback.ts` — POST /auth/oidc/callback (if OIDC)
- `src/api/keys/create.ts` — POST /api/keys
- `src/api/keys/list.ts` — GET /api/keys
- `src/api/keys/get.ts` — GET /api/keys/:id
- `src/api/keys/regenerate.ts` — POST /api/keys/:id/regenerate
- `src/api/keys/revoke.ts` — DELETE /api/keys/:id
- `src/api/validate.ts` — POST /api/validate (validation for Phase 2+)

**Services:**
- `src/services/apiKeyService.ts` — API key operations (CRUD, validation)

### Frontend (TanStack Start + React)

**Configuration & Setup:**
- `tsconfig.json` — TypeScript config (frontend)
- `vite.config.ts` — Vite build config

**Types & Utilities:**
- `src/types/auth.ts` — Auth types (User, Session)
- `src/types/api.ts` — API response types
- `src/types/api-key.ts` — API key types
- `src/lib/api.ts` — API client utility

**UI Components (shadcn/ui):**
- `src/components/ui/button.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/toaster.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/card.tsx`

**Layout Components:**
- `src/components/AuthLayout.tsx` — Login page layout
- `src/components/DashboardLayout.tsx` — Authenticated layout (sidebar, nav)
- `src/components/UserMenu.tsx` — User profile dropdown, logout button

**Page Components:**
- `src/routes/auth/login.tsx` — Login page (public)
- `src/routes/dashboard/index.tsx` — Dashboard home (private)
- `src/routes/settings/api-keys.tsx` — API keys management page (private)

**Feature Components:**
- `src/components/LoginForm.tsx` — Login form (password + OIDC)
- `src/components/APIKeyList.tsx` — API keys table (D-23)
- `src/components/CreateKeyDialog.tsx` — Create key modal (D-24)
- `src/components/RegenerateKeyDialog.tsx` — Regenerate secret modal
- `src/components/RevokeKeyDialog.tsx` — Revoke confirmation modal

**Route Protection:**
- `src/components/PrivateRoute.tsx` — Auth guard component

### Testing

**Unit Tests:**
- `src/__tests__/auth.test.ts` — Authentication tests
- `src/__tests__/apiKey.test.ts` — API key tests

**E2E Tests:**
- `tests/e2e.spec.ts` — End-to-end workflow tests (Playwright)

### Documentation

**Setup & Getting Started:**
- `docs/SETUP.md` — Developer setup guide
- `docs/AUTH.md` — Authentication configuration guide
- `docs/API-KEYS.md` — API key creation and usage guide
- `docs/DATABASE.md` — Database setup and schema
- `docs/DECISIONS.md` — All 30 decisions mapped to implementation
- `README.md` — Updated with quick start and requirements

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| POST | `/auth/signin` | No | Password login |
| POST | `/auth/logout` | Yes | Clear session |
| GET | `/auth/session` | No | Get current session (if exists) |
| POST | `/auth/oidc/authorize` | No | Redirect to OIDC provider |
| POST | `/auth/oidc/callback` | No | OIDC provider callback |

### API Key Endpoints

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| POST | `/api/keys` | Yes | Create new API key |
| GET | `/api/keys` | Yes | List user's API keys |
| GET | `/api/keys/:id` | Yes | Get key details (no secret) |
| POST | `/api/keys/:id/regenerate` | Yes | Generate new secret |
| DELETE | `/api/keys/:id` | Yes | Revoke API key |
| POST | `/api/validate` | No | Validate API key (Bearer token) |

### Frontend Routes

| Route | Auth Required | Purpose |
|-------|---------------|---------|
| `/` | No | Redirect to login or dashboard |
| `/auth/login` | No | Login page |
| `/dashboard` | Yes | Monitor list (empty in Phase 1) |
| `/settings/api-keys` | Yes | API key management |

---

## Risk Assessment & Mitigation

### Risk 1: TanStack Start RC Stability
**Severity:** MEDIUM  
**Impact:** Breaking API changes, compatibility issues  
**Mitigation:**
- Lock version in `package.json` (no `^` or `~` semver)
- Monitor GitHub issues for RC phase
- Have plan to upgrade or rollback quickly
- Test builds frequently during development

### Risk 2: better-auth OIDC Configuration
**Severity:** MEDIUM  
**Impact:** OIDC logins don't work, or require manual provider setup  
**Mitigation:**
- Research better-auth OIDC implementation early (Wave 1)
- Test with a real OIDC provider (Google or GitHub) during Phase 1
- Document exact steps for user to configure OIDC
- Provide fallback (password-only) if OIDC fails

### Risk 3: Database Schema Evolution
**Severity:** LOW  
**Impact:** Migrations fail, data loss  
**Mitigation:**
- Use drizzle-kit for automated migrations (safer than hand-written SQL)
- Test migrations on sample database before production
- Keep migration history clean and reviewable
- Document any manual data transformations

### Risk 4: Session Cookie Security
**Severity:** MEDIUM  
**Impact:** XSS or CSRF attacks, session hijacking  
**Mitigation:**
- Enforce httpOnly, Secure, SameSite flags (D-06, D-14)
- Verify cookie settings in production (use Security tab in DevTools)
- Rate-limit login attempts to prevent brute force
- Monitor session validation errors

### Risk 5: API Key Secret Exposure
**Severity:** HIGH  
**Impact:** Unauthorized API access, data leak  
**Mitigation:**
- Never log plaintext secrets
- Hash secrets before storage (Task 3-01)
- Display secret only once (Task 3-02)
- Revoke immediately invalidates (Task 3-02)
- Enforce secret rotation practices in documentation (Task 5-02)

### Risk 6: OIDC Callback Validation
**Severity:** MEDIUM  
**Impact:** Impersonation if state validation fails  
**Mitigation:**
- Verify state parameter in callback (better-auth should handle)
- Verify OIDC token signature
- Use HTTPS in production (D-15)
- Test OIDC flow with malicious inputs

---

## Success Criteria Checklist

Phase 1 is **COMPLETE** when:

- [ ] ✅ User can sign up with email + password (new account creation)
- [ ] ✅ User can sign in with email + password → dashboard loads
- [ ] ✅ User can sign in with OIDC (if configured) → dashboard loads
- [ ] ✅ Invalid credentials show error message
- [ ] ✅ Sessions persist 30 days (D-08)
- [ ] ✅ Multiple devices have independent sessions (D-09)
- [ ] ✅ Logout on one device doesn't affect others (D-10)
- [ ] ✅ User can create API key → secret shown once (D-22)
- [ ] ✅ User can list API keys → shows name, created, expires, last-used, scopes, permission (D-23)
- [ ] ✅ User can regenerate API key → new secret provided (D-21)
- [ ] ✅ User can revoke API key → requires confirmation (D-26)
- [ ] ✅ API key validation works (POST /api/validate)
- [ ] ✅ Unauthenticated visitor cannot access `/dashboard` → redirected to login
- [ ] ✅ Unauthenticated visitor cannot access `/settings/api-keys` → redirected to login
- [ ] ✅ Session cookie is httpOnly, Secure (prod), SameSite=Strict (D-06, D-14)
- [ ] ✅ HTTPS enforced in production (D-15)
- [ ] ✅ CORS disabled (D-14)
- [ ] ✅ No monitor creation UI (deferred to Phase 2)
- [ ] ✅ No monitoring/alert logic (deferred to Phases 3+)
- [ ] ✅ No public status pages (deferred to Phase 5)
- [ ] ✅ All 30 decisions implemented (D-01 through D-30)
- [ ] ✅ Auth tests pass (Task 4-03)
- [ ] ✅ API key tests pass (Task 4-04)
- [ ] ✅ End-to-end tests pass (Task 5-01)
- [ ] ✅ Security hardening complete (Task 5-03)
- [ ] ✅ Documentation complete (Task 5-02)

---

## Execution Timeline

**Total Execution Time:** ~33 hours (including testing & documentation)

| Wave | Tasks | Estimated Hours | Dependencies |
|------|-------|-----------------|--------------|
| 1 | Setup (3 tasks) | 5-6 | None |
| 2 | Backend (3) + Frontend (3) | 6-7 | Wave 1 |
| 3 | API Keys (3) | 8-9 | Wave 2 |
| 4 | Testing (2) + Integration (2) | 7-8 | Wave 3 |
| 5 | E2E + Docs + Security (3) | 4-5 | Wave 4 |

**Critical Path:** Database schema → better-auth → API key system → Testing  
**Bottleneck:** Testing (Wave 4) — most time-consuming phase

---

## Next Steps

1. **Review this plan** with team/stakeholder (30 min)
2. **Execute Wave 1** (Project setup, database schema, env config) — 5-6 hours
3. **Execute Wave 2** (Backend auth, frontend structure) — 6-7 hours
4. **Execute Wave 3** (API key system) — 8-9 hours
5. **Execute Wave 4** (Testing, integration) — 7-8 hours
6. **Execute Wave 5** (E2E testing, documentation, security review) — 4-5 hours
7. **Deploy to staging** and verify all requirements met
8. **Move to Phase 2:** Monitor Setup and Organization

---

**Plan Version:** 1.0  
**Last Updated:** 2026-03-27  
**Status:** Ready for Execution  
**Confidence:** HIGH  

**Questions or issues?** Reference this plan document, review the research summaries, or check the decision mappings above.
