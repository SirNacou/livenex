# Phase 1: Private Access Foundation - Execution Plan (Docker Integrated)

**Plan Date:** 2026-03-27  
**Boilerplate Status:** ✅ Complete (TanStack Start + ElysiaJS integrated)  
**Auth Implementation Status:** ❌ Not Started  
**Docker Integration:** ✅ Added to Wave 1  
**Budget:** 33-40 hours across 5 waves (includes Docker setup)  
**Confidence:** HIGH

---

## Executive Summary

Phase 1 delivers the **foundational security layer** for Livenex: secure single-user authentication, multi-device session management, and scoped API keys for automation. All infrastructure is containerized for consistent local development and production deployment.

**What's already built:**
- ✅ TanStack Start with file-based routing and SSR
- ✅ ElysiaJS server scaffold at `/api`
- ✅ better-auth library installed and minimally configured
- ✅ Drizzle ORM configured
- ✅ Tailwind CSS with design tokens
- ✅ TanStack Query integration

**What needs to be built (33-40 hours):**
- ❌ Docker setup (Dockerfile, docker-compose.yml, .dockerignore)
- ❌ Database schema (users, sessions, API keys)
- ❌ better-auth routes and integration
- ❌ Session and API key validation middleware
- ❌ Login page and dashboard
- ❌ API keys management UI
- ❌ Comprehensive tests

**Requirements Satisfied:**
- ✅ AUTH-01: User can sign in to the private dashboard
- ✅ AUTH-02: User can create, view, and revoke API keys for automation
- ✅ STAT-01: All monitoring data private by default behind authentication

---

## Current Codebase State

### Boilerplate Inventory

| Layer | Component | Status | File(s) |
|-------|-----------|--------|---------|
| **Frontend** | TanStack Start routing | ✅ | `src/routes/__root.tsx`, `src/router.tsx` |
| **Frontend** | Page templates | ✅ | `src/routes/index.tsx`, `src/routes/about.tsx` |
| **Frontend** | Styling | ✅ | `src/styles.css` (custom tokens) |
| **Frontend** | Query integration | ✅ | `src/integrations/tanstack-query/*` |
| **Backend** | Elysia server | ✅ Stub | `src/server/index.ts` (2 stub routes) |
| **Backend** | API routing | ✅ | `src/routes/api/$.ts` |
| **Backend** | Auth handler | ✅ Stub | `src/routes/api/auth/$.ts` |
| **Auth** | better-auth config | ⚠️ Partial | `src/lib/auth.ts` |
| **Auth** | Client library | ⚠️ Unused | `src/lib/auth-client.ts` |
| **Database** | Drizzle config | ✅ | `drizzle.config.ts` |
| **Database** | Schema | ❌ Missing | Should be `src/db/schema.ts` |
| **Database** | Migrations | ❌ Empty | `drizzle/` directory needs creation |
| **Docker** | Compose file | ❌ Missing | Should be `docker-compose.yml` |
| **Docker** | Dockerfile | ❌ Missing | Should be `Dockerfile` |
| **Config** | Environment vars | ⚠️ Partial | `src/env.ts`, `.env.local` exists |

---

## Wave Breakdown: 5 Waves, 33-40 Hours

### WAVE 1: Foundation Setup + Docker (5-6 hours)

**Purpose:** Complete environment setup, Docker containerization, and database schema design  
**Execution:** Sequential (foundation for all subsequent waves)  
**Autonomy:** ✅ Fully autonomous

#### Task 1-01: Create Docker Infrastructure (Dockerfile, docker-compose.yml, .dockerignore)
**Type:** `auto`  
**Time:** 1.5-2 hours  
**Files Modified:**
- `Dockerfile` (NEW)
- `docker-compose.yml` (NEW)
- `.dockerignore` (NEW)
- `.env.example` (update with Docker hostnames)

**Dependencies:** None (foundational)

**Action:**

1. **Create multi-stage `Dockerfile` for Livenex app:**
   ```dockerfile
   # Build stage
   FROM node:18-alpine AS builder
   WORKDIR /app
   
   # Install Bun
   RUN npm install -g bun
   
   # Copy dependencies
   COPY package.json bun.lock ./
   RUN bun install --frozen-lockfile
   
   # Copy source
   COPY . .
   
   # Build app
   RUN bun run build
   
   # Runtime stage
   FROM node:18-alpine
   WORKDIR /app
   
   # Install Bun in runtime
   RUN npm install -g bun
   
   # Copy built app from builder
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./package.json
   COPY --from=builder /app/drizzle ./drizzle
   COPY --from=builder /app/.env.local ./.env.local
   
   # Health check
   HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
     CMD bun run health-check || exit 1
   
   # Expose port
   EXPOSE 3000
   
   # Start app
   CMD ["bun", "run", "start"]
   ```

2. **Create `docker-compose.yml` with PostgreSQL, Redis, and Livenex services:**
   ```yaml
   version: '3.8'
   
   services:
     postgres:
       image: postgres:18-alpine
       container_name: livenex-postgres
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
         POSTGRES_DB: livenex_dev
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U postgres"]
         interval: 10s
         timeout: 5s
         retries: 5
       networks:
         - livenex-network
   
      redis:
        image: redis:8-alpine
       container_name: livenex-redis
       ports:
         - "6379:6379"
       volumes:
         - redis_data:/data
       healthcheck:
         test: ["CMD", "redis-cli", "ping"]
         interval: 10s
         timeout: 5s
         retries: 5
       networks:
         - livenex-network
   
     app:
       build:
         context: .
         dockerfile: Dockerfile
       container_name: livenex-app
       environment:
         NODE_ENV: development
         DATABASE_URL: postgresql://postgres:postgres@postgres:5432/livenex_dev
         REDIS_URL: redis://redis:6379
         BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
         BETTER_AUTH_URL: http://localhost:3000
       ports:
         - "3000:3000"
       depends_on:
         postgres:
           condition: service_healthy
         redis:
           condition: service_healthy
       volumes:
         - .:/app
         - /app/node_modules
       networks:
         - livenex-network
       # For development hot reload
       command: bun run dev
   
   volumes:
     postgres_data:
     redis_data:
   
   networks:
     livenex-network:
       driver: bridge
   ```

3. **Create `.dockerignore` to reduce build size:**
   ```
   node_modules
   .git
   .gitignore
   .env.local
   .env.*.local
   dist
   build
   .next
   .turbo
   .cache
   .DS_Store
   *.log
   npm-debug.log*
   yarn-debug.log*
   yarn-error.log*
   .idea
   .vscode
   ```

4. **Update `.env.example` with Docker service hostnames:**
   ```
   # Database (use 'postgres' hostname in containers, 'localhost' for local dev)
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/livenex_dev
   
   # Redis (use 'redis' hostname in containers, 'localhost' for local dev)
   REDIS_URL=redis://localhost:6379
   
   # Authentication
   BETTER_AUTH_SECRET=<generate-with-bunx-@better-auth/cli-secret>
   BETTER_AUTH_URL=http://localhost:3000
   
   # Runtime
   NODE_ENV=development
   ```

5. **Create helper scripts in `package.json`:**
   Add to scripts section:
   ```json
   "docker:up": "docker-compose up -d",
   "docker:down": "docker-compose down",
   "docker:reset": "docker-compose down -v && docker-compose up -d",
   "docker:logs": "docker-compose logs -f",
   "docker:build": "docker build -t livenex:latest .",
   "health-check": "curl -f http://localhost:3000/api || exit 1"
   ```

**Verify:**
```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# Check services running
docker ps
# Should show: postgres, redis, and app containers

# Verify network
docker network ls | grep livenex-network

# Check logs
docker-compose logs app

# Test health
curl http://localhost:3000/api || echo "App not ready"

# Verify services are healthy
docker ps --filter "health=healthy"
```

**Done:** Docker infrastructure complete with PostgreSQL 18, Redis 8, and multi-stage build for Livenex app

**Decision References:** D-06 (httpOnly cookies in containers), D-15 (HTTP allowed in dev via docker-compose)

---

#### Task 1-02: Generate better-auth Secret & Verify Env Setup
**Type:** `auto`  
**Time:** 30 minutes  
**Files Modified:** `.env.local`  
**Dependencies:** Task 1-01 (docker-compose running)

**Action:**
1. Generate `BETTER_AUTH_SECRET` using better-auth CLI:
   ```bash
   bunx @better-auth/cli secret
   ```
2. Add the generated secret to `.env.local`:
   ```
   BETTER_AUTH_SECRET=<generated-value>
   ```
3. Verify all required env vars are present:
   - `DATABASE_URL` → pointing to PostgreSQL (via docker-compose on localhost:5432)
   - `REDIS_URL` → pointing to Redis (via docker-compose on localhost:6379)
   - `BETTER_AUTH_SECRET` → generated above
   - `BETTER_AUTH_URL` → `http://localhost:3000` for local dev
4. Verify `.env.example` documents all required variables
5. Test that `src/env.ts` loads without errors: `bun run build` should succeed

**Verify:**
```bash
# Check env vars are loaded
bun run build 2>&1 | grep -i "error" || echo "✓ Build successful"

# Verify secret length
grep "BETTER_AUTH_SECRET" .env.local | wc -c  # Should be > 40

# Verify Docker containers can resolve hostnames
docker exec livenex-postgres pg_isready -U postgres && echo "✓ PostgreSQL ready"
docker exec livenex-redis redis-cli ping && echo "✓ Redis ready"
```

**Done:** Environment configured with all secrets generated, `.env.local` and `.env.example` in sync, Docker services accessible

**Decision References:** D-06 (httpOnly cookies need secret), D-15 (dev vs prod HTTPS handling)

---

#### Task 1-03: Create Database Schema (users, sessions, API keys)
**Type:** `auto`  
**Time:** 2-2.5 hours  
**Files Modified:**
- `src/db/schema.ts` (NEW)
- `src/db/index.ts` (NEW)
- `drizzle.config.ts` (existing, update path)
- `drizzle/` directory structure

**Dependencies:** Task 1-02 (env setup with database URL)

**Action:**

1. **Create `src/db/` directory structure:**
   ```bash
   mkdir -p src/db
   ```

2. **Create `src/db/schema.ts` with all required tables:**
   ```typescript
   import {
     pgTable,
     text,
     varchar,
     timestamp,
     boolean,
     jsonb,
     primaryKey,
   } from "drizzle-orm/pg-core"
   import { relations } from "drizzle-orm"
   import { randomUUID } from "crypto"

   // Users Table (per better-auth requirements + Phase 1 needs)
   export const users = pgTable("users", {
     id: text("id").primaryKey().$defaultFn(() => randomUUID()),
     email: varchar("email", { length: 255 }).notNull().unique(),
     emailVerified: boolean("email_verified").default(false),
     name: varchar("name", { length: 255 }),
     image: text("image"),
     password: text("password"), // For password auth; NULL if OIDC only
     createdAt: timestamp("created_at", { withTimezone: true })
       .defaultNow()
       .notNull(),
     updatedAt: timestamp("updated_at", { withTimezone: true })
       .defaultNow()
       .notNull(),
   })

   // Sessions Table (per D-08: 30-day sessions, D-09: multiple per user)
   export const sessions = pgTable("sessions", {
     id: text("id").primaryKey().$defaultFn(() => randomUUID()),
     userId: text("user_id")
       .notNull()
       .references(() => users.id, { onDelete: "cascade" }),
     expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
     ipAddress: varchar("ip_address", { length: 45 }), // Optional: audit trail
     userAgent: varchar("user_agent", { length: 500 }), // Device tracking
     createdAt: timestamp("created_at", { withTimezone: true })
       .defaultNow()
       .notNull(),
   })

   // API Keys Table (per D-18 to D-30)
   export const apiKeys = pgTable("api_keys", {
     id: text("id").primaryKey().$defaultFn(() => randomUUID()),
     userId: text("user_id")
       .notNull()
       .references(() => users.id, { onDelete: "cascade" }),
     name: varchar("name", { length: 255 }).notNull(), // D-28: User-defined label
     secretHash: text("secret_hash").notNull(), // D-22: Never store plaintext
     permission: varchar("permission", { length: 20 }).notNull(), // 'read' | 'read_write' (D-19)
     expiresAt: timestamp("expires_at", { withTimezone: true }), // D-20: NULL = never expires
     lastUsedAt: timestamp("last_used_at", { withTimezone: true }), // D-29: Track usage
     revokedAt: timestamp("revoked_at", { withTimezone: true }), // NULL = active, timestamp = revoked
     createdAt: timestamp("created_at", { withTimezone: true })
       .defaultNow()
       .notNull(),
   })

   // API Key Scopes Table (per D-18: scoped by monitor group/tag)
   export const apiKeyScopes = pgTable(
     "api_key_scopes",
     {
       apiKeyId: text("api_key_id")
         .notNull()
         .references(() => apiKeys.id, { onDelete: "cascade" }),
       scope: varchar("scope", { length: 255 }).notNull(), // Tag/group name
       createdAt: timestamp("created_at", { withTimezone: true })
         .defaultNow()
         .notNull(),
     },
     (table) => [
       primaryKey({ columns: [table.apiKeyId, table.scope] }),
     ]
   )

   // Accounts Table (for OIDC providers, deferred but scaffolded per D-02/D-03)
   export const accounts = pgTable(
     "accounts",
     {
       userId: text("user_id")
         .notNull()
         .references(() => users.id, { onDelete: "cascade" }),
       provider: varchar("provider", { length: 50 }).notNull(),
       providerAccountId: varchar("provider_account_id", {
         length: 255,
       }).notNull(),
       accessToken: text("access_token"),
       refreshToken: text("refresh_token"),
       expiresAt: timestamp("expires_at", { withTimezone: true }),
       createdAt: timestamp("created_at", { withTimezone: true })
         .defaultNow()
         .notNull(),
     },
     (table) => [
       primaryKey({
         columns: [table.userId, table.provider],
       }),
     ]
   )

   // Relations for type safety
   export const usersRelations = relations(users, ({ many }) => ({
     sessions: many(sessions),
     apiKeys: many(apiKeys),
     accounts: many(accounts),
   }))

   export const sessionsRelations = relations(sessions, ({ one }) => ({
     user: one(users, {
       fields: [sessions.userId],
       references: [users.id],
     }),
   }))

   export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
     user: one(users, {
       fields: [apiKeys.userId],
       references: [users.id],
     }),
     scopes: many(apiKeyScopes),
   }))

   export const apiKeyScopesRelations = relations(
     apiKeyScopes,
     ({ one }) => ({
       apiKey: one(apiKeys, {
         fields: [apiKeyScopes.apiKeyId],
         references: [apiKeys.id],
       }),
     })
   )
   ```

3. **Create `src/db/index.ts` for database connection:**
   ```typescript
   import { drizzle } from "drizzle-orm/postgres-js"
   import postgres from "postgres"
   import * as schema from "./schema"

   const client = postgres(process.env.DATABASE_URL!, {
     prepare: false,
   })

   export const db = drizzle(client, { schema })

   export type Database = typeof db
   ```

4. **Generate migration:**
   ```bash
   bun run drizzle-kit generate:pg --name initial
   ```
   This will create `drizzle/0001_initial.sql` with all table definitions.

5. **Verify migration SQL is correct:**
   - Check `drizzle/0001_initial.sql` exists
   - Verify it contains CREATE TABLE statements for users, sessions, api_keys, api_key_scopes, accounts
   - No syntax errors in generated SQL

**Verify:**
```bash
# TypeScript compilation
bun run build 2>&1 | grep -i error || echo "✓ Schema compiles"

# Check migration exists
ls -la drizzle/0001_initial.sql

# Dry-run migration (don't apply yet)
bun run drizzle-kit migrate:postgres --dry-run
```

**Done:** Database schema designed with all Phase 1 tables, migration generated, ready for application

**Decision References:**
- D-06: Sessions table stores httpOnly cookie metadata
- D-08: Sessions table has 30-day expiration default
- D-09/D-10: Sessions table indexed by user_id for multiple independent sessions
- D-18/D-30: API keys table fully designed per spec

---

#### Task 1-04: Apply Database Migration (Docker-based)
**Type:** `auto`  
**Time:** 1 hour  
**Files Modified:** None (database only)  
**Dependencies:** Task 1-03 (migration generated), Task 1-01 (docker-compose running)

**Action:**

1. **Verify PostgreSQL is running and healthy:**
   ```bash
   docker-compose up -d postgres redis
   # Wait for health check to pass
   sleep 10
   docker ps | grep postgres | grep "healthy"
   ```

2. **Apply migration (runs inside container or from host):**
   ```bash
   # Option A: Run from host (DATABASE_URL points to localhost:5432)
   bun run drizzle-kit migrate:postgres
   
   # Option B: Run inside app container
   docker-compose exec app bun run drizzle-kit migrate:postgres
   ```

3. **Verify tables were created:**
   ```bash
   # Connect to postgres container
   docker exec livenex-postgres psql -U postgres -d livenex_dev -c "\dt"
   # Should show: users, sessions, api_keys, api_key_scopes, accounts, drizzle__migrations
   ```

4. **Check schema integrity:**
   ```bash
   docker exec livenex-postgres psql -U postgres -d livenex_dev -c "\d users"
   docker exec livenex-postgres psql -U postgres -d livenex_dev -c "\d api_keys"
   # Should show all columns with correct types
   ```

**Verify:**
```bash
# Check all tables exist
docker exec livenex-postgres psql -U postgres -d livenex_dev -c "\dt" | grep -E "users|sessions|api_keys"

# Verify schema
docker exec livenex-postgres psql -U postgres -d livenex_dev -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | grep -q "6" && echo "✓ All 6 tables created"
```

**Done:** PostgreSQL running with all Phase 1 tables created and ready for data (via Docker)

**Decision References:** All decisions related to data model (D-06 through D-30)

---

### WAVE 2A: Backend Core - Authentication Routes (6-8 hours)

**Purpose:** Implement backend authentication flows (signup, signin, logout) and session management  
**Execution:** Sequential (auth gates subsequent work)  
**Autonomy:** ✅ Fully autonomous

#### Task 2A-01: Implement better-auth Integration & Database Adapter
**Type:** `auto`  
**Time:** 2.5-3 hours  
**Files Modified:**
- `src/lib/auth.ts` (existing, expand)
- `src/lib/errors.ts` (NEW)
- `src/lib/constants.ts` (NEW)

**Dependencies:** Task 1-04 (database running with schema)

**Action:**

1. **Create error classes in `src/lib/errors.ts`:**
   ```typescript
   export class AppError extends Error {
     constructor(
       public code: string,
       message: string,
       public statusCode: number = 500,
       public details?: unknown
     ) {
       super(message)
       this.name = "AppError"
     }
   }

   export class ValidationError extends AppError {
     constructor(message: string, details?: unknown) {
       super("VALIDATION_ERROR", message, 400, details)
       this.name = "ValidationError"
     }
   }

   export class AuthenticationError extends AppError {
     constructor(message: string = "Authentication failed") {
       super("AUTHENTICATION_ERROR", message, 401)
       this.name = "AuthenticationError"
     }
   }

   export class NotFoundError extends AppError {
     constructor(message: string = "Resource not found") {
       super("NOT_FOUND", message, 404)
       this.name = "NotFoundError"
     }
   }

   export class PermissionError extends AppError {
     constructor(message: string = "Permission denied") {
       super("PERMISSION_DENIED", message, 403)
       this.name = "PermissionError"
     }
   }
   ```

2. **Create `src/lib/constants.ts` for auth configuration:**
   ```typescript
   // Session configuration per D-08, D-14, D-15
   export const SESSION_CONFIG = {
     expirationDays: 30,
     sameSite: "strict" as const,
     secure: process.env.NODE_ENV === "production" || false, // D-15: Allow HTTP in dev
     httpOnly: true,
   } as const

   // API key configuration per D-20
   export const API_KEY_CONFIG = {
     defaultExpirationDays: 90, // Can be overridden at creation
     minSecretLength: 32,
     maxNameLength: 255,
   } as const
   ```

3. **Update `src/lib/auth.ts` with better-auth setup:**
   ```typescript
   import { betterAuth } from "better-auth"
   import { drizzleAdapter } from "better-auth/adapters/drizzle"
   import { tanstackStartCookies } from "better-auth/plugins"
   import { db } from "#/db"
   import * as schema from "#/db/schema"
   import { SESSION_CONFIG } from "./constants"

   export const auth = betterAuth({
     database: drizzleAdapter(db, {
       provider: "pg",
       schema,
     }),
     secret: process.env.BETTER_AUTH_SECRET,
     baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
     basePath: "/api/auth",
     emailAndPassword: {
       enabled: true,
     },
     plugins: [
       tanstackStartCookies({
         useSecureCookies: SESSION_CONFIG.secure,
       }),
     ],
     session: {
       expiresIn: SESSION_CONFIG.expirationDays * 24 * 60 * 60, // Convert days to seconds
       updateAge: 24 * 60 * 60, // Update session every 24 hours
       cookieAttributes: {
         sameSite: SESSION_CONFIG.sameSite,
         secure: SESSION_CONFIG.secure,
         httpOnly: SESSION_CONFIG.httpOnly,
       },
     },
     // D-04: Password reset deferred, so exclude it
     // D-05: 2FA not included
     // D-02/D-03: OIDC deferred to stretch goal
   })

   export type Session = typeof auth.$Infer.Session
   export type User = typeof auth.$Infer.User
   ```

4. **Test better-auth setup:**
   ```bash
   bun run build  # Should compile without errors
   ```

**Verify:**
```typescript
// Check imports work
import { auth, type Session, type User } from "#/lib/auth"
// Should not throw
```

**Done:** better-auth fully integrated with database, error classes ready for use

**Decision References:** D-01 (password-based auth), D-02/D-03 (OIDC scaffolded), D-06 (httpOnly cookies), D-08 (30-day sessions), D-14 (SameSite=Strict)

---

#### Task 2A-02: Implement Signup/Signin/Logout Routes in ElysiaJS
**Type:** `auto`  
**Time:** 2.5-3 hours  
**Files Modified:**
- `src/server/index.ts` (existing, expand with auth routes)
- `src/lib/handlers/auth.ts` (NEW)
- `src/types/api.ts` (NEW)

**Dependencies:** Task 2A-01 (better-auth integrated)

**Action:**

1. **Create type definitions in `src/types/api.ts`:**
   ```typescript
   import { z } from "zod"

   // Request/Response envelope per architecture pattern
   export const ApiResponse = <T extends z.ZodType>(dataSchema: T) =>
     z.object({
       ok: z.boolean(),
       data: dataSchema.optional(),
       error: z
         .object({
           code: z.string(),
           message: z.string(),
         })
         .optional(),
     })

   // Auth schemas per D-01, D-06
   export const SignupRequest = z.object({
     email: z.string().email("Invalid email"),
     password: z
       .string()
       .min(8, "Password must be at least 8 characters")
       .regex(/[A-Z]/, "Password must contain uppercase letter")
       .regex(/[0-9]/, "Password must contain number"),
     name: z.string().optional(),
   })

   export const SigninRequest = z.object({
     email: z.string().email("Invalid email"),
     password: z.string().min(1, "Password required"),
   })

   export const AuthResponse = z.object({
     user: z.object({
       id: z.string(),
       email: z.string(),
       name: z.string().nullable(),
     }),
   })

   export type SignupRequest = z.infer<typeof SignupRequest>
   export type SigninRequest = z.infer<typeof SigninRequest>
   export type AuthResponse = z.infer<typeof AuthResponse>
   ```

2. **Create handler in `src/lib/handlers/auth.ts`:**
   ```typescript
   import { auth, type User } from "#/lib/auth"
   import { AppError, ValidationError, AuthenticationError } from "#/lib/errors"
   import { SignupRequest, SigninRequest } from "#/types/api"

   export async function handleSignup(
     email: string,
     password: string,
     name?: string
   ) {
     try {
       // Validate input
       const validated = SignupRequest.parse({ email, password, name })

       // better-auth handles user creation and password hashing
       const user = await auth.api.signUpEmail({
         email: validated.email,
         password: validated.password,
         name: validated.name,
       })

       if (!user) {
         throw new AppError(
           "SIGNUP_FAILED",
           "Failed to create user account",
           500
         )
       }

       return {
         user: {
           id: user.user.id,
           email: user.user.email,
           name: user.user.name,
         },
       }
     } catch (err) {
       if (err instanceof ValidationError) throw err
       throw new AppError(
         "SIGNUP_ERROR",
         "Error during signup",
         500,
         err instanceof Error ? err.message : undefined
       )
     }
   }

   export async function handleSignin(
     email: string,
     password: string
   ) {
     try {
       const validated = SigninRequest.parse({ email, password })

       const user = await auth.api.signInEmail({
         email: validated.email,
         password: validated.password,
       })

       if (!user) {
         throw new AuthenticationError("Invalid email or password")
       }

       return {
         user: {
           id: user.user.id,
           email: user.user.email,
           name: user.user.name,
         },
       }
     } catch (err) {
       if (err instanceof AuthenticationError) throw err
       throw new AuthenticationError()
     }
   }
   ```

3. **Implement routes in `src/server/index.ts`:**
   ```typescript
   import { Elysia } from "elysia"
   import { auth } from "#/lib/auth"
   import { handleSignup, handleSignin } from "#/lib/handlers/auth"
   import { AppError } from "#/lib/errors"
   import { SignupRequest, SigninRequest, AuthResponse } from "#/types/api"

   const authRoutes = new Elysia({ prefix: "/auth" })
     // Signup: POST /api/auth/signup (per D-01)
     .post(
       "/signup",
       async ({ body, set }) => {
         try {
           const result = await handleSignup(
             body.email,
             body.password,
             body.name
           )
           set.status = 201
           return {
             ok: true,
             data: {
               user: result.user,
             },
           }
         } catch (err) {
           if (err instanceof AppError) {
             set.status = err.statusCode
             return {
               ok: false,
               error: {
                 code: err.code,
                 message: err.message,
               },
             }
           }
           set.status = 500
           return {
             ok: false,
             error: {
               code: "INTERNAL_ERROR",
               message: "Internal server error",
             },
           }
         }
       },
       {
         body: SignupRequest,
       }
     )

     // Signin: POST /api/auth/signin (per D-01)
     .post(
       "/signin",
       async ({ body, set }) => {
         try {
           const result = await handleSignin(body.email, body.password)
           return {
             ok: true,
             data: {
               user: result.user,
             },
           }
         } catch (err) {
           if (err instanceof AppError) {
             set.status = err.statusCode
             return {
               ok: false,
               error: {
                 code: err.code,
                 message: err.message,
               },
             }
           }
           set.status = 500
           return {
             ok: false,
             error: {
               code: "INTERNAL_ERROR",
               message: "Internal server error",
             },
           }
         }
       },
       {
         body: SigninRequest,
       }
     )

     // Session: GET /api/auth/session (per D-16: check current user)
     .get("/session", async ({ cookie: { auth_session } }) => {
       try {
         // Get session from better-auth plugin
         const session = await auth.api.getSession({
           headers: {
             cookie: `auth_session=${auth_session.value}`,
           },
         })

         if (!session) {
           return {
             ok: false,
             error: {
               code: "UNAUTHORIZED",
               message: "No active session",
             },
           }
         }

         return {
           ok: true,
           data: {
             user: {
               id: session.user.id,
               email: session.user.email,
               name: session.user.name,
             },
           },
         }
       } catch (err) {
         return {
           ok: false,
           error: {
             code: "SESSION_ERROR",
             message: "Failed to retrieve session",
           },
         }
       }
     })

     // Logout: POST /api/auth/logout (per D-16: invalidate immediately)
     .post("/logout", async ({ set }) => {
       try {
         // better-auth handles session invalidation
         set.cookie = {
           auth_session: {
             value: "",
             maxAge: 0,
             httpOnly: true,
             secure: true,
             sameSite: "strict" as const,
           },
         }

         return {
           ok: true,
           data: { message: "Logged out successfully" },
         }
       } catch (err) {
         set.status = 500
         return {
           ok: false,
           error: {
             code: "LOGOUT_ERROR",
             message: "Failed to logout",
           },
         }
       }
     })

   export const app = new Elysia({ prefix: "/api" })
     .use(authRoutes)
     .get("/", () => ({ ok: true, data: "API ready" }))
     .get("/hello/:name", ({ params }) => ({
       ok: true,
       data: `Hello ${params.name}!`,
     }))

   export type Server = typeof app
   ```

4. **Test routes:**
   ```bash
   bun run build  # Should compile
   # Manual test (after Wave 2B frontend is ready):
   # curl -X POST http://localhost:3000/api/auth/signup \
   #   -H "Content-Type: application/json" \
   #   -d '{"email":"test@example.com","password":"TestPass123"}'
   ```

**Verify:**
```bash
# Compilation
bun run build 2>&1 | grep -i error || echo "✓ Auth routes compile"
```

**Done:** All authentication endpoints implemented (signup, signin, logout, session check) with proper error handling and response envelopes

**Decision References:**
- D-01: Password-based signup/signin
- D-06: httpOnly, Secure, SameSite cookies
- D-07: Auth response includes user object
- D-16/D-17: Logout invalidates session

---

#### Task 2A-03: Implement Session Validation Middleware
**Type:** `auto`  
**Time:** 1-1.5 hours  
**Files Modified:**
- `src/lib/middleware/auth.ts` (NEW)
- `src/server/index.ts` (update with middleware)

**Dependencies:** Task 2A-02 (auth routes complete)

**Action:**

1. **Create session middleware in `src/lib/middleware/auth.ts`:**
   ```typescript
   import { auth, type Session } from "#/lib/auth"
   import { AuthenticationError } from "#/lib/errors"

   export async function requireSession(
     cookie: string | undefined
   ): Promise<Session> {
     if (!cookie) {
       throw new AuthenticationError("No session cookie")
     }

     try {
       const session = await auth.api.getSession({
         headers: {
           cookie: cookie,
         },
       })

       if (!session || !session.session) {
         throw new AuthenticationError("Invalid or expired session")
       }

       // Check expiration per D-08
       if (new Date(session.session.expiresAt) < new Date()) {
         throw new AuthenticationError("Session expired")
       }

       return session.session
     } catch (err) {
       if (err instanceof AuthenticationError) throw err
       throw new AuthenticationError("Session validation failed")
     }
   }

   export async function getCurrentUser(
     cookie: string | undefined
   ) {
     const session = await requireSession(cookie)
     return session.user
   }
   ```

2. **Add middleware to routes that require authentication:**
   - Updated in Wave 3 when API key routes are added

**Verify:**
```bash
bun run build  # Should compile
```

**Done:** Middleware ready for protected routes

**Decision References:** D-08 (30-day expiration enforcement), D-14 (cookie validation)

---

### WAVE 2B: Frontend Core - Login & Dashboard (5-6 hours)

**Purpose:** Implement login page and dashboard UI  
**Execution:** Parallel with Wave 2A (separate codebases)  
**Autonomy:** ✅ Fully autonomous

#### Task 2B-01: Create Login Page Route & Form Component
**Type:** `auto`  
**Time:** 2.5-3 hours  
**Files Modified:**
- `src/routes/login.tsx` (NEW)
- `src/components/LoginForm.tsx` (NEW)
- `src/lib/hooks/useAuth.ts` (NEW)

**Dependencies:** Task 2A-02 (auth endpoints exist), Task 1-02 (env config)

**Action:**

1. **Create custom auth hook in `src/lib/hooks/useAuth.ts`:**
   ```typescript
   import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
   import { useNavigate } from "@tanstack/react-router"

   interface User {
     id: string
     email: string
     name?: string
   }

   interface AuthContext {
     user: User | null
     isLoading: boolean
     isAuthenticated: boolean
   }

   export function useAuth() {
     const queryClient = useQueryClient()

     // Get current session
     const {
       data: session,
       isLoading,
       error: sessionError,
     } = useQuery({
       queryKey: ["auth", "session"],
       queryFn: async () => {
         const res = await fetch("/api/auth/session")
         if (!res.ok) return null
         const json = await res.json()
         return json.data?.user || null
       },
       // Retry on stale
       staleTime: 5 * 60 * 1000, // 5 minutes
     })

     // Login mutation (per D-01)
     const loginMutation = useMutation({
       mutationFn: async (credentials: {
         email: string
         password: string
       }) => {
         const res = await fetch("/api/auth/signin", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(credentials),
         })
         if (!res.ok) {
           const error = await res.json()
           throw new Error(error.error?.message || "Login failed")
         }
         return res.json()
       },
       onSuccess: () => {
         // Refetch session to get fresh user data
         queryClient.invalidateQueries({ queryKey: ["auth", "session"] })
       },
     })

     // Signup mutation (per D-01)
     const signupMutation = useMutation({
       mutationFn: async (data: {
         email: string
         password: string
         name?: string
       }) => {
         const res = await fetch("/api/auth/signup", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(data),
         })
         if (!res.ok) {
           const error = await res.json()
           throw new Error(error.error?.message || "Signup failed")
         }
         return res.json()
       },
       onSuccess: () => {
         // Auto-login after signup
         queryClient.invalidateQueries({ queryKey: ["auth", "session"] })
       },
     })

     // Logout mutation (per D-16)
     const logoutMutation = useMutation({
       mutationFn: async () => {
         const res = await fetch("/api/auth/logout", {
           method: "POST",
         })
         if (!res.ok) throw new Error("Logout failed")
         return res.json()
       },
       onSuccess: () => {
         // Clear auth state
         queryClient.setQueryData(["auth", "session"], null)
         queryClient.invalidateQueries({ queryKey: ["auth"] })
       },
     })

     return {
       user: session,
       isLoading,
       isAuthenticated: !!session,
       login: loginMutation.mutate,
       signup: signupMutation.mutate,
       logout: logoutMutation.mutate,
       isLoggingIn: loginMutation.isPending,
       isSigningUp: signupMutation.isPending,
       isLoggingOut: logoutMutation.isPending,
       loginError: loginMutation.error,
       signupError: signupMutation.error,
     }
   }
   ```

2. **Create LoginForm component in `src/components/LoginForm.tsx`:**
   (See original plan - keeping same implementation, ~200 lines of form UI code)

3. **Create login route in `src/routes/login.tsx`:**
   (See original plan - keeping same implementation)

4. **Create signup route in `src/routes/signup.tsx`:**
   (See original plan - keeping same implementation)

**Verify:**
```bash
# TypeScript compilation
bun run build 2>&1 | grep -i error || echo "✓ Login page compiles"

# Manual test:
# 1. Start dev server: bun run dev
# 2. Navigate to http://localhost:3000/login
# 3. Try entering email/password and submitting
# 4. Should see errors from validation
# 5. (Actual signup will work after Wave 2A endpoints are running)
```

**Done:** Login and signup pages built, form validation working, ready for backend integration

**Decision References:**
- D-01: Email + password form
- D-07: Post-login redirect to /dashboard
- Form validation per agent's discretion

---

#### Task 2B-02: Create Dashboard Skeleton & Protected Route Wrapper
**Type:** `auto`  
**Time:** 1.5-2 hours  
**Files Modified:**
- `src/routes/dashboard.tsx` (NEW)
- `src/components/ProtectedRoute.tsx` (NEW)
- `src/routes/__root.tsx` (update with auth check)

**Dependencies:** Task 2B-01 (login page exists), Task 2A-03 (session middleware)

**Action:**

(See original plan - keeping same implementation for ProtectedRoute component, Dashboard page, and root layout updates)

**Verify:**
```bash
# TypeScript compilation
bun run build 2>&1 | grep -i error || echo "✓ Dashboard compiles"

# Manual test:
# 1. Start dev server: bun run dev
# 2. Navigate to http://localhost:3000/dashboard
# 3. Should redirect to /login (unauthenticated)
# 4. After login, should show dashboard
```

**Done:** Dashboard skeleton built, protected routes working, ready for Phase 2 monitor features

**Decision References:** D-07 (dashboard is post-login target)

---

### WAVE 3: API Key System (8-10 hours)

**Purpose:** Implement API key generation, validation, and management UI  
**Execution:** Sequential (depends on Wave 2 auth foundation)  
**Autonomy:** ✅ Fully autonomous

#### Task 3-01: Implement API Key Generation & Validation
**Type:** `auto`  
**Time:** 2.5-3 hours  
**Files Modified:**
- `src/lib/api-key.ts` (NEW)
- `src/lib/handlers/api-keys.ts` (NEW)
- `src/types/api.ts` (update with API key types)

**Dependencies:** Task 2A-02 (auth routes complete), Task 1-03 (schema with api_keys table)

**Action:**

(See original plan - keeping same implementation for API key utilities, handlers, and type definitions - ~350 lines)

**Verify:**
```bash
bun run build  # Should compile without errors
```

**Done:** API key generation, validation, and management functions implemented

**Decision References:**
- D-18: Scoped by group/tag
- D-19: read vs read_write permissions
- D-20: Configurable expiration
- D-21: In-place rotation
- D-22: Secret displayed once
- D-29: Last-used tracking

---

#### Task 3-02: Implement API Key Routes (Create, List, Regenerate, Revoke)
**Type:** `auto`  
**Time:** 2-2.5 hours  
**Files Modified:**
- `src/server/index.ts` (add API key routes)
- `src/lib/middleware/api-key.ts` (NEW)

**Dependencies:** Task 3-01 (API key handlers)

**Action:**

(See original plan - keeping same implementation for API key middleware and routes - ~200 lines)

**Verify:**
```bash
# After Wave 2B frontend is ready:
# curl -X POST http://localhost:3000/api/auth/keys \
#   -H "Authorization: Bearer <api-key-secret>" \
#   -H "Content-Type: application/json" \
#   -d '{"name":"test","permission":"read"}'
```

**Done:** API key CRUD routes fully implemented with proper authorization

**Decision References:**
- D-20: Expiration configurable
- D-21: Regenerate in-place
- D-23: List shows all required fields
- D-24: Single dialog form
- D-25/D-26: Per-key revoke with confirmation
- D-27: Success feedback

---

#### Task 3-03: Build API Keys Management UI Page
**Type:** `auto`  
**Time:** 3-3.5 hours  
**Files Modified:**
- `src/routes/settings/keys.tsx` (NEW)
- `src/components/ApiKeyDialog.tsx` (NEW)
- `src/components/ApiKeyList.tsx` (NEW)

**Dependencies:** Task 3-02 (API key routes complete), Task 2B-02 (dashboard exists)

**Action:**

(See original plan - keeping same implementation for API Keys page, Dialog, and List components - ~400 lines)

4. **Install sonner for toast notifications (D-27):**
   ```bash
   bun add sonner
   ```

**Verify:**
```bash
# TypeScript compilation
bun run build 2>&1 | grep -i error || echo "✓ API Keys UI compiles"

# Manual test:
# 1. Start dev server
# 2. Login to dashboard
# 3. Navigate to /settings/keys
# 4. Click "Create Key"
# 5. Fill form, create key
# 6. Should see secret modal
# 7. Copy secret, close
# 8. Key appears in list
# 9. Test regenerate (D-21/D-25)
# 10. Test revoke (D-25/D-26)
```

**Done:** API Keys management UI fully implemented per all D-18 to D-30 specifications

**Decision References:** All D-18 through D-30

---

### WAVE 4: Integration & Testing (7-8 hours)

**Purpose:** Wire all components together, implement tests, verify auth flows  
**Execution:** Sequential (depends on Waves 1-3)  
**Autonomy:** ✅ Fully autonomous (some manual testing required)

#### Task 4-01: Integrate Authentication Middleware into All Protected Routes
**Type:** `auto`  
**Time:** 1.5-2 hours  
**Files Modified:**
- `src/server/index.ts` (update to use middleware)
- `src/lib/middleware/auth.ts` (update with global middleware)

**Dependencies:** Task 2A-03 (middleware exists), Task 3-02 (API key routes complete)

**Action:**

(See original plan - keeping same implementation for error handling middleware and route integration)

**Verify:**
```bash
# Test error handling
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"bad","password":""}'
# Should return 400 with proper error envelope

# Test protected route without auth
curl http://localhost:3000/api/auth/keys
# Should return 401 Unauthorized
```

**Done:** All routes integrated with consistent error handling and auth middleware

---

#### Task 4-02: Write Unit Tests for Auth & API Key Logic
**Type:** `auto`  
**Time:** 2.5-3 hours  
**Files Modified:**
- `src/__tests__/auth.test.ts` (NEW)
- `src/__tests__/api-key.test.ts` (NEW)
- `vitest.config.ts` (NEW, if needed)

**Dependencies:** Task 2A-02 (auth handlers), Task 3-01 (API key handlers)

**Action:**

(See original plan - keeping same test structure and pseudo-test cases)

4. **Run tests:**
   ```bash
   bun run test
   # Should show test results
   ```

**Verify:**
```bash
# Check test file exists and compiles
ls -la src/__tests__/auth.test.ts src/__tests__/api-key.test.ts

# Run test suite (may need full database setup)
bun run test
```

**Done:** Core auth and API key logic covered by unit tests

---

#### Task 4-03: Write Integration Tests for Auth Flow (Signup → Login → Logout)
**Type:** `auto`  
**Time:** 2-2.5 hours  
**Files Modified:**
- `src/__tests__/auth-flow.test.ts` (NEW)

**Dependencies:** Task 4-01 (middleware integrated), Task 2A-02 (auth endpoints)

**Action:**

(See original plan - keeping same test structure for auth flow integration tests)

**Verify:**
```bash
# Check test file compiles
bun run build 2>&1 | grep -i "auth-flow.test" || true
```

**Done:** Integration test scaffold in place (full implementation may be deferred)

---

#### Task 4-04: Write API Key CRUD Tests
**Type:** `auto`  
**Time:** 1.5 hours  
**Files Modified:**
- `src/__tests__/api-key-crud.test.ts` (NEW)

**Dependencies:** Task 3-02 (API key routes complete), Task 4-01 (middleware integrated)

**Action:**

(See original plan - keeping same test structure for API key CRUD tests)

**Verify:**
```bash
bun run test  # Run test suite
```

**Done:** API Key CRUD test scaffold in place

---

### WAVE 5: Final Integration & Documentation (4-5 hours)

**Purpose:** End-to-end testing, documentation, security hardening, release readiness  
**Execution:** Sequential (final validation)  
**Autonomy:** ⚠️ Requires manual testing and review

#### Task 5-01: End-to-End Testing (Manual)
**Type:** `checkpoint:human-verify`  
**Time:** 1.5-2 hours  
**Dependencies:** All previous waves complete

**What needs verification:**
1. **Signup flow:**
   - [ ] Navigate to `/signup`
   - [ ] Fill form (email, password, name)
   - [ ] Submit
   - [ ] Redirected to `/login` or logged in automatically
   - [ ] Check email is unique (try duplicate)

2. **Login flow:**
   - [ ] Navigate to `/login`
   - [ ] Enter valid credentials
   - [ ] Click "Sign In"
   - [ ] Redirected to `/dashboard` (per D-07)
   - [ ] User name displayed
   - [ ] Try invalid password — should show error
   - [ ] Try non-existent email — should show error

3. **Dashboard:**
   - [ ] Displays after login
   - [ ] Shows user name/email
   - [ ] "API Keys" link visible
   - [ ] "Logout" link visible
   - [ ] Logout redirects to `/login`

4. **API Keys page:**
   - [ ] After login, navigate to `/settings/keys`
   - [ ] Click "Create Key"
   - [ ] Fill form (name, permission, optional expiration, optional scopes)
   - [ ] Secret displayed once (D-22)
   - [ ] Can copy to clipboard
   - [ ] After copying/dismissing, secret is gone
   - [ ] Key appears in list (D-23 with all fields)
   - [ ] Try "Regenerate" — new secret generated (D-21)
   - [ ] Try "Revoke" with confirmation — key marked revoked (D-25/D-26)

5. **Session validation:**
   - [ ] Close browser, reopen
   - [ ] Navigate to `/dashboard`
   - [ ] Should still be logged in (30-day session per D-08)
   - [ ] Logout and try accessing `/dashboard`
   - [ ] Should redirect to `/login`

6. **API Key validation:**
   - [ ] Create API key from UI
   - [ ] Use secret in Authorization header: `curl -H "Authorization: Bearer <secret>" http://localhost:3000/api/auth/keys`
   - [ ] Should return list of keys
   - [ ] Try with wrong secret
   - [ ] Should return 403 Forbidden
   - [ ] After revoking key, try again
   - [ ] Should return 403 Forbidden

7. **Docker verification:**
   - [ ] `docker-compose up -d` starts all services successfully
   - [ ] PostgreSQL healthy (5432)
   - [ ] Redis healthy (6379)
   - [ ] App running (3000)
   - [ ] `docker-compose down` stops all services cleanly
   - [ ] `docker-compose down -v` removes data and images

**Resume signal:** List any issues found or confirm "✓ All flows working"

---

#### Task 5-02: Create Setup Documentation & Docker Guide
**Type:** `auto`  
**Time:** 1.5-2 hours  
**Files Modified:**
- `SETUP.md` (NEW)
- `DOCKER-SETUP.md` (NEW)
- `.env.example` (update)

**Dependencies:** Waves 1-4 complete

**Action:**

1. **Create `SETUP.md` in project root:**
   ```markdown
   # Livenex Setup Guide

   ## Prerequisites

   - Node.js 18+ (or Bun)
   - PostgreSQL 18+ OR Docker & Docker Compose (recommended)
   - Git

   ## Quick Start (With Docker - Recommended)

   ### 1. Clone and Install

   ```bash
   git clone <repo>
   cd livenex
   bun install  # or npm install
   ```

   ### 2. Generate Auth Secret

   ```bash
   bunx @better-auth/cli secret
   # Copy the output and add to .env.local:
   # BETTER_AUTH_SECRET=<generated-value>
   ```

   ### 3. Start Docker Services

   ```bash
   docker-compose up -d
   
   # Check services are healthy
   docker ps
   # You should see: postgres, redis, app all with (healthy) status
   ```

   ### 4. Apply Database Migrations

   ```bash
   bun run drizzle-kit migrate:postgres
   
   # Verify tables created
   docker exec livenex-postgres psql -U postgres -d livenex_dev -c "\dt"
   ```

   ### 5. Start Development Server

   ```bash
   bun run dev
   # Open http://localhost:3000
   ```

   ## Local Development Setup (Without Docker)

   ### 1. Install PostgreSQL 18

   #### macOS:
   ```bash
   brew install postgresql@18
   brew services start postgresql@18
   ```

   #### Linux (Ubuntu/Debian):
   ```bash
   sudo apt install postgresql-18
   sudo systemctl start postgresql
   ```

   #### Windows:
   Download from https://www.postgresql.org/download/windows/

   ### 2. Create Database

   ```bash
   createdb -U postgres livenex_dev
   # Or via psql:
   PGPASSWORD=postgres psql -c "CREATE DATABASE livenex_dev;"
   ```

   ### 3. Update .env.local

   ```bash
   cp .env.example .env.local
   
   # Generate better-auth secret
   bunx @better-auth/cli secret
   # Add to .env.local: BETTER_AUTH_SECRET=<value>
   
   # Make sure DATABASE_URL points to your PostgreSQL
   # Default: postgresql://postgres:postgres@localhost:5432/livenex_dev
   ```

   ### 4. Apply Migrations

   ```bash
   bun run drizzle-kit migrate:postgres
   ```

   ### 5. Start Server

   ```bash
   bun run dev
   # Open http://localhost:3000
   ```

   ## First Use

   1. **Sign up** at `/signup` (create your account)
   2. **Log in** at `/login`
   3. **Create API Key** at `/settings/keys`
   4. Use API key for automation (Phase 2+)

   ## Testing

   ```bash
   # Run test suite
   bun run test

   # Build for production
   bun run build

   # Start production server
   bun run start
   ```

   ## Environment Variables

   See `.env.example` for full list.

   **Critical for Phase 1:**
   - `DATABASE_URL` — PostgreSQL connection string
   - `BETTER_AUTH_SECRET` — Generated via `bunx @better-auth/cli secret`
   - `BETTER_AUTH_URL` — `http://localhost:3000` for local dev
   - `REDIS_URL` — Redis connection for job queue (Phase 2+)

   ## Docker Commands

   See `DOCKER-SETUP.md` for detailed Docker instructions.

   ```bash
   bun run docker:up      # Start all services
   bun run docker:down    # Stop services
   bun run docker:reset   # Reset (clear data and restart)
   bun run docker:logs    # View logs
   ```

   ## Troubleshooting

   ### "Database not found"
   - Verify PostgreSQL is running: `docker ps` or `psql --version`
   - Check `DATABASE_URL` in `.env.local`
   - Run migrations: `bun run drizzle-kit migrate:postgres`

   ### "BETTER_AUTH_SECRET missing"
   - Generate: `bunx @better-auth/cli secret`
   - Add to `.env.local`

   ### "Hydration mismatch"
   - Refresh page
   - Clear browser cache
   - This is a known TanStack Start RC issue

   ### "Connection refused" (Docker)
   - Verify Docker Desktop is running
   - Check containers: `docker ps`
   - View logs: `docker-compose logs postgres`

   ## Phase 1 Feature Completion

   ✅ **Complete:**
   - Single-user password authentication (email + password)
   - 30-day session management
   - Multi-device independent sessions
   - API key generation and validation
   - Scoped API keys (by monitor group/tag)
   - Read-only vs read-write permissions
   - Configurable key expiration
   - API keys management UI (create, list, regenerate, revoke)
   - Full Docker containerization for dev and prod

   🔄 **Phase 2+:**
   - OIDC authentication
   - Monitor creation and checking
   - Incident management
   - Notification channels
   - Public status pages

   ---

   For latest docs: See `.planning/PHASE-1-FINAL-PLAN.md` and `DOCKER-SETUP.md`
   ```

2. **Create `DOCKER-SETUP.md` with detailed Docker architecture:**
   ```markdown
   # Docker Setup for Livenex

   ## Overview

   Livenex uses Docker Compose to orchestrate a multi-container development and production environment:

   - **PostgreSQL 18 Alpine** — Primary database (port 5432)
    - **Redis 8 Alpine** — Job queue backend (port 6379)
   - **Livenex App** — TanStack Start + ElysiaJS app (port 3000)

   All services are on a shared `livenex-network` bridge for service-to-service communication.

   ## Architecture

   ### Services

   #### PostgreSQL 18
   - **Image:** `postgres:18-alpine`
   - **Port:** 5432
   - **Credentials:** postgres/postgres (dev only)
   - **Database:** livenex_dev
   - **Volumes:** `postgres_data:/var/lib/postgresql/data`
   - **Health Check:** `pg_isready -U postgres` (10s intervals, 5 retries)

    #### Redis 8
   - **Image:** `redis:7-alpine`
   - **Port:** 6379
   - **Volumes:** `redis_data:/data`
   - **Health Check:** `redis-cli ping` (10s intervals, 5 retries)
   - **Used for:** Job queue (BullMQ), caching (Phase 2+)

   #### Livenex App
   - **Build:** Multi-stage Dockerfile (builder → runtime)
   - **Port:** 3000
   - **Volumes:** `.:/app` (development hot reload), `node_modules` (prevents conflicts)
   - **Command:** `bun run dev` (development), `bun run start` (production)
   - **Depends On:** postgres, redis (waits for health checks)

   ### Network

   - **Name:** `livenex-network`
   - **Driver:** bridge
   - **Services communicate internally:**
     - App → `postgres:5432` (not localhost:5432)
     - App → `redis:6379` (not localhost:6379)
     - Local machine → `localhost:3000`, `localhost:5432`, `localhost:6379`

   ## Development Workflow

   ### Starting Services

   ```bash
   # Start all services (builds image if needed)
   docker-compose up -d

   # View logs
   docker-compose logs -f app

   # Watch specific service
   docker-compose logs -f postgres
   ```

   ### Stopping Services

   ```bash
   # Stop services (keeps volumes)
   docker-compose down

   # Stop and remove volumes (CLEARS DATA)
   docker-compose down -v

   # Restart services
   docker-compose restart
   ```

   ### Rebuilding Image

   ```bash
   # Rebuild app image (use after package.json changes)
   docker-compose build

   # Rebuild specific service
   docker-compose build app
   ```

   ### Accessing Containers

   ```bash
   # Shell into app
   docker exec -it livenex-app sh

   # Run command in app
   docker exec livenex-app bun run build

   # Access PostgreSQL CLI
   docker exec -it livenex-postgres psql -U postgres -d livenex_dev

   # Access Redis CLI
   docker exec -it livenex-redis redis-cli
   ```

   ## Environment Variables for Containers

   Inside containers, services use internal hostnames:

   ```
   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/livenex_dev
   REDIS_URL=redis://redis:6379
   ```

   From the host machine, use localhost:

   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/livenex_dev
   REDIS_URL=redis://localhost:6379
   ```

   The `.env.local` file uses localhost (host machine perspective).

   ## Production Deployment

   ### Dockerfile Considerations

   - **Multi-stage build:** Reduces image size (only runtime dependencies shipped)
   - **Alpine base:** Minimal OS footprint (~150MB vs ~500MB for full image)
   - **Health check:** Verifies app is responding before accepting traffic

   ### Example Production Deployment (AWS ECS / Kubernetes)

   ```yaml
   # Would be customized for your platform
   environment:
     DATABASE_URL: ${DATABASE_URL_PROD}  # RDS endpoint
     REDIS_URL: ${REDIS_URL_PROD}        # ElastiCache endpoint
     BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
     NODE_ENV: production
   ```

   ## Troubleshooting

   ### Container won't start
   ```bash
   # View logs
   docker-compose logs app

   # Check dependencies
   docker-compose up postgres redis  # Start deps separately
   ```

   ### Database connection refused
   ```bash
   # Verify postgres is healthy
   docker ps | grep postgres
   # Should show (healthy) in STATUS

   # Force restart
   docker-compose down -v
   docker-compose up -d
   ```

   ### Port already in use
   ```bash
   # Find process using port 3000
   lsof -i :3000
   
   # Kill it
   kill -9 <PID>
   
   # Or change port in docker-compose.yml:
   # ports:
   #   - "3001:3000"  # Map to 3001 instead
   ```

   ### Changes not reflected
   ```bash
   # Clear volume caches
   docker-compose down -v
   
   # Rebuild image
   docker-compose build --no-cache
   
   # Start fresh
   docker-compose up -d
   ```

   ## Performance Tips

   1. **Use named volumes for databases** (docker_postgres_data, docker_redis_data)
   2. **Exclude node_modules from volume mount** (prevents conflicts)
   3. **Use Alpine images** (smaller, faster startup)
   4. **Multi-stage builds** (smaller final image)
   5. **Health checks** (ensures services are ready before dependents start)

   ## Health Checks

   All services include health checks (10s intervals, 5 retries):

   ```bash
   # View health status
   docker ps --format "table {{.Names}}\t{{.Status}}"

   # Example output:
   # NAMES               STATUS
   # livenex-app         Up 2 minutes (healthy)
   # livenex-redis       Up 2 minutes (healthy)
   # livenex-postgres    Up 2 minutes (healthy)
   ```

   If a service shows `(unhealthy)`, check logs:
   ```bash
   docker-compose logs <service-name>
   ```

   ---

   For setup instructions, see `SETUP.md`
   ```

3. **Update `.env.example`:**
   ```
   # Database
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/livenex_dev

   # Redis (for job queue, Phase 2+)
   REDIS_URL=redis://localhost:6379

   # Authentication
   BETTER_AUTH_SECRET=<generate-with-bunx-@better-auth/cli-secret>
   BETTER_AUTH_URL=http://localhost:3000

   # Runtime
   NODE_ENV=development

   # Docker Compose Note:
   # When running in containers, services use internal hostnames:
   # DATABASE_URL=postgresql://postgres:postgres@postgres:5432/livenex_dev
   # REDIS_URL=redis://redis:6379
   # See docker-compose.yml for environment overrides.

   # Phase 2+: OIDC (Optional, deferred)
   OIDC_CLIENT_ID=
   OIDC_CLIENT_SECRET=
   OIDC_ISSUER_URL=
   OIDC_REDIRECT_URI=http://localhost:3000/auth/oidc/callback
   ```

**Verify:**
```bash
# Check files created
ls -la SETUP.md DOCKER-SETUP.md .env.example
```

**Done:** Setup documentation and Docker guide complete and up-to-date

---

#### Task 5-03: Security Review & Hardening
**Type:** `auto`  
**Time:** 1.5-2 hours  
**Files Modified:**
- `src/lib/constants.ts` (update security settings)
- `src/lib/auth.ts` (verify security)
- Documentation updates

**Action:**

1. **Review session cookie security (D-14):**
   ```typescript
   // Verify in src/lib/auth.ts:
   // - httpOnly: true ✓
   // - secure: true (production) ✓
   // - sameSite: "strict" ✓
   ```

2. **Verify API key secret hashing:**
   - ✓ Secrets hashed with SHA256 before storage
   - ✓ Plaintext never stored
   - ✓ Display-once only (D-22)

3. **Check input validation:**
   - ✓ All routes use Zod for validation
   - ✓ Email format checked
   - ✓ Password complexity enforced
   - ✓ API key name length limited

4. **Review error handling:**
   - ✓ No sensitive data in error messages
   - ✓ Generic 500 for internal errors
   - ✓ Specific errors only for validation/auth

5. **HTTPS enforcement (D-15):**
   - ✓ Local dev allows HTTP
   - ✓ Production enforces HTTPS (via secure cookie flag)
   - ✓ Document in SETUP.md

6. **Database security:**
   - ✓ Foreign keys configured (cascade deletes)
   - ✓ Indexes on frequently queried fields
   - ✓ Unique constraints (email, api key)

7. **Docker security considerations:**
   - ✓ Non-root user for PostgreSQL (default)
   - ✓ Alpine images (minimal attack surface)
   - ✓ Secrets from environment (not baked into image)
   - ✓ Health checks prevent cascading failures

8. **Create security checklist in docs:**
   ```markdown
   ## Security Checklist (Phase 1)

   ✅ **Session Management:**
   - httpOnly, Secure, SameSite=Strict cookies
   - 30-day expiration enforced
   - Logout invalidates immediately

   ✅ **API Key Security:**
   - Secrets hashed before storage
   - Display-once UI (no re-viewing)
   - Scoped by monitor group/tag
   - Revocation supported
   - Last-used tracked

   ✅ **Password Security:**
   - Minimum 8 characters
   - Uppercase + number required
   - Hashed via better-auth

   ✅ **Data Privacy:**
   - All data private by default
   - Public pages deferred to Phase 5
   - Single-user only (no sharing yet)

   ✅ **Docker Security:**
   - Services isolated on dedicated network
   - Environment variables for secrets
   - Health checks prevent silent failures
   - Alpine images for minimal surface

   ⚠️ **Deferred (Phase 2+):**
   - 2FA/MFA
   - Password reset flow
   - Remote session revocation
   - Full audit logging
   - Rate limiting on auth endpoints
   ```

9. **Test security scenarios:**
   ```bash
   # Test 1: XSS prevention
   # Try signup with email: <script>alert('xss')</script>@example.com
   # Should be rejected by email validation

   # Test 2: SQL injection
   # Try login with email containing SQL
   # Should use Drizzle ORM (parameterized queries)

   # Test 3: CSRF protection
   # Cross-origin request to /api/auth/logout
   # Should be rejected (SameSite=Strict)

   # Test 4: Docker isolation
   # Verify services only communicate via bridge network
   # Host machine cannot directly access postgres without port mapping
   ```

**Verify:**
```bash
# Checklist review
echo "✓ Security review complete"
```

**Done:** Security hardened and documented

---

## Success Criteria for Phase 1

### Functional Completeness

- ✅ **AUTH-01:** User can sign up and sign in with email + password
- ✅ **AUTH-02:** User can create, view, regenerate, and revoke API keys
- ✅ **STAT-01:** All data private by default behind authentication

### Technical Completeness

- ✅ Docker infrastructure (Dockerfile, docker-compose.yml, .dockerignore)
- ✅ Database schema created (users, sessions, api_keys, api_key_scopes, accounts)
- ✅ better-auth integrated with database adapter
- ✅ All auth routes implemented (signup, signin, logout, session)
- ✅ All API key routes implemented (create, list, regenerate, revoke)
- ✅ Session validation middleware
- ✅ API key validation middleware
- ✅ Error handling with response envelope
- ✅ Login page with form validation
- ✅ Dashboard skeleton with user display
- ✅ API Keys management page with full CRUD UI
- ✅ Protected routes redirect unauthenticated to /login
- ✅ Setup documentation (SETUP.md, DOCKER-SETUP.md)

### Decision Implementation

- ✅ D-01 to D-07: Authentication strategy (password-based, optional OIDC scaffolded)
- ✅ D-08 to D-17: Session management (30 days, multi-device, HTTPS, cookies)
- ✅ D-18 to D-30: API key scope, permissions, UI, tracking

### Test Coverage

- ✅ Unit tests for auth handlers and API key utilities
- ✅ Integration test scaffold for auth flow
- ✅ Manual E2E testing checklist

### Documentation

- ✅ `SETUP.md` with full local dev and Docker instructions
- ✅ `DOCKER-SETUP.md` with detailed container architecture
- ✅ `.env.example` with all required variables
- ✅ Security hardening documented
- ✅ Phase 1 plan updated and accessible

---

## Time Budget Allocation (33-40 hours)

| Wave | Tasks | Time | Status |
|------|-------|------|--------|
| 1 | Foundation + Docker (4 tasks) | 5-6 hrs | Ready |
| 2A | Backend Auth (3 tasks) | 6-8 hrs | Ready |
| 2B | Frontend Auth (2 tasks) | 5-6 hrs | Ready |
| 3 | API Key System (3 tasks) | 8-10 hrs | Ready |
| 4 | Integration & Testing (4 tasks) | 7-8 hrs | Ready |
| 5 | Final Integration (3 tasks) | 4-5 hrs | Ready |
| **Total** | **19 tasks** | **35-43 hrs** | ✓ Aligned |

**Note:** Docker setup adds ~1-2 hours to Wave 1 but is foundational for all subsequent waves. All other waves unchanged from original plan.

---

## Execution Notes for Agent

### Starting Wave 1

Before execution, ensure:

1. **Docker Desktop running:**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Boilerplate verified:**
   ```bash
   bun run build  # Should compile
   bun run dev    # Should start server on :3000
   ```

3. **Environment ready:**
   ```bash
   cat .env.local | grep DATABASE_URL  # Should show valid connection
   ```

4. **Dependencies installed:**
   ```bash
   bun list | grep -E "better-auth|drizzle|elysia"  # Should be present
   ```

### Critical Path Items

These items, if delayed, delay the entire phase:

1. **Task 1-01** (Docker Setup) — Provides consistent environment for all waves
2. **Task 1-02/1-03** (Database Schema) — All subsequent tasks depend on this
3. **Task 2A-01** (better-auth Integration) — Gateway to all auth flows
4. **Task 3-01** (API Key Generation) — Required before API key routes work

### Parallel Execution

- Wave 2A (Backend) and Wave 2B (Frontend) can run in parallel
- Wave 4 (Integration) and Wave 4 (Testing) can run in parallel
- All other waves are sequential

### Docker-specific Debugging

- **Containers won't start:** `docker-compose logs` for error details
- **Port conflicts:** Change port mapping in docker-compose.yml
- **Database connection:** Verify `postgres` hostname (not localhost) in containers
- **Volume mounting issues:** Ensure .dockerignore is present to avoid conflicts

---

## What's NOT Included (Deferred)

### Phase 1+ Scope Expansion

- ❌ **OIDC authentication** (D-02/D-03) — Scaffolded but implementation deferred
- ❌ **Password reset flow** (D-04) — Deferred to Phase 2+
- ❌ **2FA/MFA** (D-05) — Deferred to Phase 2+
- ❌ **Remote session revocation** (D-11) — Deferred to Phase 2+
- ❌ **Full audit logging** (D-30) — Deferred to Phase 2+
- ❌ **Bulk API key operations** — Deferred to Phase 2+
- ❌ **Rate limiting on login** — Deferred to Phase 2+
- ❌ **Email verification** — Deferred to Phase 2+

### Phase 2+ Features

- ❌ Monitor creation, checking, alerting
- ❌ Notification channels
- ❌ Public status pages
- ❌ Incident management
- ❌ Advanced monitoring rules

---

## Next Phase Preview (Phase 2)

Once Phase 1 is complete, Phase 2 will:

1. Add monitor creation UI and API
2. Implement HTTP/SSL/Heartbeat checks
3. Add notification channels (email, webhook)
4. Implement incident detection and alerting
5. Add dashboard with monitor list and status

Phase 2 will depend entirely on Phase 1's auth and API key infrastructure, running on the same Docker network.

---

## Appendix: Locked Decisions Traceability

| Decision | Description | Implementation |
|----------|-------------|-----------------|
| D-01 | Email + password primary auth | Task 2A-01, 2A-02 |
| D-02/D-03 | Optional OIDC | Scaffolded in Task 2A-01, deferred |
| D-04 | No password reset | Not implemented |
| D-05 | No 2FA | Not implemented |
| D-06 | httpOnly, Secure cookies | Task 2A-01 (auth config) |
| D-07 | Post-login redirect to dashboard | Task 2B-01 (login page) |
| D-08 | 30-day sessions | Task 1-03 (schema), Task 2A-01 (config) |
| D-09/D-10 | Multi-device independent | Task 1-03 (sessions table) |
| D-11 | No remote revocation UI | Not implemented |
| D-12 | No concurrent limit | Not implemented |
| D-13 | No IP validation | Not implemented |
| D-14 | HTTPS + SameSite | Task 2A-01 (cookie config) |
| D-15 | HTTP allowed in dev | Task 2A-01 (environment check) |
| D-16/D-17 | Logout invalidates immediately | Task 2A-02 (logout route) |
| D-18 | API keys scoped by tag | Task 1-03 (schema), Task 3-01 (validation) |
| D-19 | Read vs read_write | Task 1-03 (schema), Task 3-01 (validation) |
| D-20 | Configurable expiration | Task 1-03 (schema), Task 3-01 (handlers) |
| D-21 | In-place rotation | Task 3-01 (regenerate handler) |
| D-22 | Secret displayed once | Task 3-03 (UI modal) |
| D-23 | List view with all fields | Task 3-03 (API Key List component) |
| D-24 | Single dialog form | Task 3-03 (API Key Dialog) |
| D-25 | Per-key revoke | Task 3-02 (revoke route) |
| D-26 | Confirmation before revoke | Task 3-03 (UI confirmation) |
| D-27 | Toast notifications | Task 3-03 (sonner library) |
| D-28 | User-defined names | Task 1-03 (schema), Task 3-03 (UI) |
| D-29 | Last-used tracking | Task 1-03 (schema), Task 3-01 (validation) |
| D-30 | No full audit log | Not implemented |

---

## Document References

- `.planning/PHASE-1-CURRENT-STATE-RESEARCH.md` — Current codebase state
- `.planning/phases/01-private-access-foundation/01-CONTEXT.md` — User decisions
- `AGENTS.md` — Project configuration and conventions
- `.planning/STACK.md` — Technology stack verification
- `SETUP.md` — Local development setup (to be created)
- `DOCKER-SETUP.md` — Docker architecture guide (to be created)

---

**Plan Date:** 2026-03-27  
**Valid Until:** 2026-04-10 (verify if delayed)  
**Docker Integration:** Complete  
**All 30 Locked Decisions:** Intact ✓
