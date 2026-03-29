# Architecture

**Analysis Date:** 2026-03-30

## Pattern Overview

**Overall:** Full-stack isomorphic React application using TanStack ecosystem with server-side rendering and API capabilities

**Key Characteristics:**
- Isomorphic codebase - code runs on both server and client
- File-based routing system using TanStack Router
- Server-side API layer built with Elysia
- Client-side state management via React Query
- Authentication integrated via Better Auth
- Database abstraction using Drizzle ORM

## Layers

**Server API Layer:**
- Purpose: Provide HTTP API endpoints and authentication handlers
- Location: `src/index.ts` (Elysia app), `src/routes/api/` (route handlers)
- Contains: API endpoint definitions, authentication middleware, request handlers
- Depends on: `src/lib/auth.ts` for auth logic, `src/db/` for database access
- Used by: Client layer via treaty (Elysia client) and fetch requests

**Authentication Layer:**
- Purpose: Handle user authentication, session management, and credential validation
- Location: `src/lib/auth.ts` (server), `src/lib/auth-client.ts` (client)
- Contains: Better Auth configuration with Drizzle adapter, email/password plugin
- Depends on: `src/db/` for user persistence, Better Auth framework
- Used by: API routes (`src/routes/api/auth/$`), client providers, UI components

**Database Layer:**
- Purpose: Provide database connection and schema management
- Location: `src/db/index.ts` (client), `src/db/schema.ts` (schema definitions)
- Contains: Drizzle ORM instance, database schema
- Depends on: PostgreSQL (via `DATABASE_URL` env var)
- Used by: Auth layer, any server-side queries

**Routing Layer:**
- Purpose: Define application routes and navigation structure
- Location: `src/router.tsx` (router config), `src/routes/` (route files), `src/routeTree.gen.ts` (generated)
- Contains: File-based routes using TanStack Router file convention
- Depends on: TanStack Router, context providers
- Used by: Root layout, navigation, deeplinks

**Presentation Layer:**
- Purpose: Render UI components and handle user interactions
- Location: `src/routes/` (route components), `src/components/` (shared components)
- Contains: React components, page layouts, UI elements
- Depends on: `src/lib/utils.ts` for utilities, `src/providers.tsx` for context
- Used by: Browser rendering, route displays

**State Management Layer:**
- Purpose: Manage client-side application state and server data
- Location: `src/integrations/tanstack-query/` (React Query setup)
- Contains: QueryClient configuration, provider setup
- Depends on: React Query, React Router context
- Used by: All client components via useQuery hooks

**Provider/Context Layer:**
- Purpose: Wire up global providers and context
- Location: `src/providers.tsx` (main provider), `src/__root.tsx` (root layout)
- Contains: TanStack Query provider, auth provider, theme setup
- Depends on: Auth client, Query client, UI frameworks
- Used by: Root document wrapper

## Data Flow

**Server-to-Client API Flow:**

1. Client initiates request via `getTreaty()` hook (uses Elysia Eden client)
2. Treaty translates call to HTTP request to `/api/*` route
3. TanStack Router handler in `src/routes/api/$.ts` receives request
4. Handler invokes Elysia app.fetch() to process with Elysia middleware
5. Elysia routes API logic and returns response
6. Response serialized and sent back to client
7. Client receives response and updates state

**Route Loading Flow:**

1. Route component loads via TanStack Router file-based routing
2. Route loader executes on server before client hydration
3. Loader calls `getTreaty().get()` to fetch data server-side
4. Data serialized and injected into initial HTML
5. Client hydrates with loader data via `Route.useLoaderData()`
6. Additional data fetched via React Query for interactive updates
7. UI re-renders when query cache updates

**Authentication Flow:**

1. User navigates to `/auth/$authView`
2. `src/routes/auth/$authView.tsx` renders auth UI from @daveyplate/better-auth-ui
3. Auth UI submission posts to `/api/auth/*` route
4. TanStack Router handler at `src/routes/api/auth/$.ts` processes request
5. Handler calls `auth.handler(request)` from Better Auth instance
6. Better Auth validates credentials against database via Drizzle adapter
7. Session cookie set in response
8. Client redirected to authenticated area (e.g., `/account`)

**Account Management Flow:**

1. User navigates to `/account/$accountView`
2. `src/routes/account/$accountView.tsx` renders AccountView component
3. AccountView displays user profile and settings from better-auth-ui
4. Form submission triggers Better Auth client methods
5. Requests proxied through `/api/auth/*` endpoints
6. Server updates user data in database
7. Session cookie maintained across requests
8. Client re-fetches account data via React Query

**State Management:**

- **Server State:** Persisted in PostgreSQL database via Drizzle ORM
- **Session State:** HTTP cookies managed by Better Auth
- **Client Cache:** React Query QueryClient maintains server data cache
- **UI State:** React component state (form inputs, modals, etc.)
- **Router State:** TanStack Router manages active route and params
- **Theme State:** Theme preference stored in localStorage, applied at root

## Key Abstractions

**Treaty Service:**
- Purpose: Isomorphic RPC-like client for calling server API
- Examples: `src/server/get-treaty.ts`
- Pattern: Uses `createIsomorphicFn()` to provide server and client implementations
  - Server side: Direct treaty object from Elysia app
  - Client side: Treaty HTTP client pointed at same origin
  - Allows calling API as if it's local function from routes and components

**Auth Client Wrapper:**
- Purpose: Provide type-safe authentication hooks and methods
- Examples: `src/lib/auth-client.ts`
- Pattern: Creates single `authClient` instance from Better Auth client factory
  - Used by auth UI provider and components
  - Handles session management, login, signup, logout
  - Integrated with TanStack Router for redirects

**Query Client Context:**
- Purpose: Provide singleton QueryClient to all components
- Examples: `src/integrations/tanstack-query/root-provider.tsx`
- Pattern: Lazy initialization of QueryClient in getContext()
  - Ensures same instance across server and client
  - Provided via QueryClientProvider to component tree
  - Accessed via useQuery hooks in components

## Entry Points

**Server Entry:**
- Location: `src/index.ts`
- Triggers: Application start (via Vite/Nitro)
- Responsibilities: Create Elysia app, define base API route, export app type

**Client Entry:**
- Location: `src/routes/__root.tsx`
- Triggers: Browser page load
- Responsibilities: Render root HTML document, setup providers, hydrate theme, include devtools

**Router Entry:**
- Location: `src/router.tsx`
- Triggers: Route initialization
- Responsibilities: Create TanStack Router instance, register context, configure scroll behavior

**Home Route:**
- Location: `src/routes/index.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Load initial data via treaty, display home page content

## Error Handling

**Strategy:** Rely on framework defaults with provider integration

**Patterns:**
- Route handlers in `src/routes/api/$.ts` catch all HTTP errors via Elysia
- Better Auth handles authentication errors via built-in validation
- React Query handles network errors with automatic retry logic
- Components can catch and display errors via React error boundaries
- Toast notifications via Sonner for user-facing error display (Toaster in root)

## Cross-Cutting Concerns

**Logging:** No explicit logging framework detected; uses console (development only)

**Validation:** 
- Server-side: Elysia request validation, Zod in env validation
- Client-side: Better Auth form validation, React Query error states
- Database schema validation via Drizzle ORM type system

**Authentication:** 
- Better Auth library handles full auth flow
- Sessions via HTTP cookies managed by Better Auth tanstack-start plugin
- Protected routes enforced by auth middleware in route handlers
- Client-side guards via auth client useSession hook pattern

**Styling:**
- Tailwind CSS v4 for utility styling
- Class variance authority for component variant management
- Theme management via next-themes with localStorage persistence
- Dark mode support with automatic preference detection

---

*Architecture analysis: 2026-03-30*
