# Architecture

**Analysis Date:** 2026-03-30

## Pattern Overview

**Overall:** Full-stack React/TypeScript application built with TanStack Start (meta-framework combining TanStack Router + React Start SSR) and Nitro server runtime.

**Key Characteristics:**
- Full-stack type-safe development with shared TypeScript across client/server boundaries
- File-based routing with automatic route tree generation
- Server-side rendering (SSR) with hydration
- Client-side data fetching through TanStack Query (React Query)
- Authentication system using Better Auth with Drizzle ORM database adapter
- Modular integration layer for external libraries (TanStack Query provider, Auth client)

## Layers

**Router Layer:**
- Purpose: Manages client-side navigation, route definitions, and SSR rendering
- Location: `src/router.tsx`, `src/routes/`, `src/routeTree.gen.ts`
- Contains: Route definitions, route parameters, server handlers
- Depends on: TanStack React Router, Context (QueryClient via getContext)
- Used by: Application root, all pages

**Provider Layer:**
- Purpose: Wraps application with necessary context providers for state management
- Location: `src/providers.tsx`, `src/integrations/tanstack-query/`
- Contains: TanStack Query provider, Auth UI provider, context initialization
- Depends on: React Context, TanStack Query, Better Auth UI, Router
- Used by: Root document shell

**Root Layout:**
- Purpose: HTML shell and global layout setup
- Location: `src/routes/__root.tsx`
- Contains: HTML structure, theme initialization script, head metadata, devtools
- Depends on: Providers, Router context, styles
- Used by: All routes (wraps all page content)

**Pages/Routes:**
- Purpose: Individual page components corresponding to URL paths
- Location: `src/routes/*.tsx`, `src/routes/auth/*.tsx`, `src/routes/account/*.tsx`, `src/routes/api/auth/*.ts`
- Contains: Page-level components, route parameters, server handlers
- Depends on: Router, utilities, UI components
- Used by: Router layer for rendering

**Auth Layer:**
- Purpose: Authentication system and session management
- Location: `src/lib/auth.ts`, `src/lib/auth-client.ts`
- Contains: Better Auth instance (server), auth client (client)
- Depends on: Better Auth, Drizzle adapter, PostgreSQL database
- Used by: Auth UI provider, API routes

**Database Layer:**
- Purpose: Database connection and schema definitions
- Location: `src/db/index.ts`, `src/db/schema.ts`
- Contains: Drizzle ORM instance, database schema
- Depends on: Drizzle ORM, node-postgres, environment variables
- Used by: Auth system, future data access logic

**UI Component Layer:**
- Purpose: Reusable styled components
- Location: `src/components/ui/`
- Contains: Button, Toaster, and other primitive UI components
- Depends on: Base UI React primitives, Tailwind CSS, lucide-react icons
- Used by: Route components, pages

**Utils Layer:**
- Purpose: Shared utility functions
- Location: `src/lib/utils.ts`
- Contains: Class name merging utility (cn)
- Depends on: clsx, tailwind-merge
- Used by: Components, routes

## Data Flow

**Page Load (SSR -> Client Hydration):**

1. User requests route from server
2. TanStack Router matches route pattern in `src/routeTree.gen.ts`
3. Root route handler in `src/routes/__root.tsx` executes, initializes providers
4. TanStack Query context created via `getContext()` in integration layer
5. Page component renders with server-side data from QueryClient
6. HTML with initial state serialized to client
7. Client hydrates React app with same context (QueryClient reused)
8. Theme initialization script runs inline to prevent flash (THEME_INIT_SCRIPT)

**Data Fetching (Client-side with TanStack Query):**

1. Component/page calls useQuery or similar hook from TanStack Query
2. QueryClient (from context) manages request caching and stale data
3. Data cached in QueryClient state, persisted across navigations
4. Devtools panel (if enabled) shows query state: `src/integrations/tanstack-query/devtools.tsx`

**Authentication Flow:**

1. User navigates to `/auth/$authView` route
2. Route component (`src/routes/auth/$authView.tsx`) renders AuthView from better-auth-ui
3. AuthView component handles form submission via authClient
4. authClient (`src/lib/auth-client.ts`) sends request to `/api/auth/$` endpoint
5. Server handler in `src/routes/api/auth/$.ts` delegates to `auth.handler()` from `src/lib/auth.ts`
6. Better Auth processes authentication, updates session via database
7. Cookies set via tanstackStartCookies plugin for session persistence
8. Client state syncs via Auth UI provider after callback

**Account Management Flow:**

1. User navigates to `/account/$accountView`
2. Route component (`src/routes/account/$accountView.tsx`) renders AccountView from better-auth-ui
3. AccountView manages user profile, settings, and other account operations
4. Operations delegated through auth system and database

**State Management:**

- **Query State:** TanStack Query (React Query) manages server state via QueryClient
- **Auth State:** Better Auth manages session state, exposed through auth context and auth client
- **UI State:** Component-level React state via useState hooks
- **Theme State:** next-themes manages color scheme preference (light/dark/auto)
- **Router State:** TanStack Router manages navigation and URL parameters
- **Global Context:** All providers initialized in `src/providers.tsx` and root route

## Key Abstractions

**Route Definition:**
- Purpose: Declarative route configuration with type safety
- Examples: `src/routes/index.tsx`, `src/routes/auth/$authView.tsx`, `src/routes/api/auth/$.ts`
- Pattern: Using `createFileRoute()` and `createRootRouteWithContext()` from TanStack Router
- File naming: `$` prefix for dynamic segments (e.g., `$authView` = parameter `authView`)
- Exported as `export const Route = createFileRoute('...')({...})`

**Server Handler:**
- Purpose: Handle server-side operations (API endpoints, SSR data)
- Examples: `src/routes/api/auth/$.ts`
- Pattern: Define `server: { handlers: { GET, POST } }` in route config
- Server handlers receive request and can access auth, database, etc.

**Provider Composition:**
- Purpose: Nest multiple context providers cleanly
- Example: `src/providers.tsx` wraps TanStackQueryProvider and AuthUIProviderTanstack
- Pattern: Create provider component that returns nested JSX with children passed through

**Context Setup Pattern:**
- Purpose: Initialize and reuse singleton context across SSR and client
- Example: `src/integrations/tanstack-query/root-provider.tsx` with getContext() function
- Pattern: Create context at module level if not exists, return cached instance
- Ensures single QueryClient instance shared between server and client

## Entry Points

**Application Entry:**
- Location: `src/routes/__root.tsx`
- Triggers: Application startup, browser requests any route
- Responsibilities: Render HTML shell, initialize providers, set up theme, render devtools

**Router Entry:**
- Location: `src/router.tsx`
- Triggers: Application initialization, client hydration
- Responsibilities: Create TanStack Router instance with route tree and context

**First Page Route:**
- Location: `src/routes/index.tsx`
- Triggers: User visits `/` (root path)
- Responsibilities: Render welcome page

**Auth Route:**
- Location: `src/routes/auth/$authView.tsx`
- Triggers: User visits `/auth/{view}` (e.g., `/auth/sign-in`, `/auth/sign-up`)
- Responsibilities: Render authentication UI (login, signup, etc.)

**Auth API Route:**
- Location: `src/routes/api/auth/$.ts`
- Triggers: POST/GET requests to `/api/auth/*` (all auth endpoints)
- Responsibilities: Delegate to Better Auth handler for session management

**Account Route:**
- Location: `src/routes/account/$accountView.tsx`
- Triggers: User visits `/account/{view}` (e.g., `/account/profile`, `/account/settings`)
- Responsibilities: Render account management UI

## Error Handling

**Strategy:** Defer to framework defaults and specific library implementations

**Patterns:**
- Authentication errors: Better Auth automatically handles invalid sessions, redirects managed by AuthUIProviderTanstack
- Network errors: TanStack Query handles failed requests with retry logic, errors propagate to useQuery hooks
- Validation errors: Zod validates environment configuration at runtime in `src/env.ts`
- UI notifications: Sonner toast system (`src/components/ui/sonner.tsx`) used for user feedback
- Page errors: TanStack Router has built-in error boundary support (can extend with errorComponent)

## Cross-Cutting Concerns

**Logging:** Console-based logging (Sonner for toast notifications), no external logging service configured

**Validation:** 
- Environment variables validated with Zod via `@t3-oss/env-core` in `src/env.ts`
- Client prefix enforcement: VITE_ prefix required for client-side env vars
- Database schema validation handled by Drizzle ORM type system

**Authentication:**
- Handled by Better Auth system (OAuth-like patterns supported, email/password enabled)
- Session management via cookies (tanstackStartCookies plugin)
- Client-side session access via authClient and Auth context
- Protected routes can be implemented by checking session in route handlers or components

**Styling:** Tailwind CSS with theme support (light/dark/auto modes) managed by next-themes

**Type Safety:** End-to-end TypeScript, no JavaScript files, shared types across client/server

---

*Architecture analysis: 2026-03-30*
