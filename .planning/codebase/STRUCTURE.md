# Codebase Structure

**Analysis Date:** 2026-03-30

## Directory Layout

```
livenex/
├── src/                        # Application source code
│   ├── components/             # Reusable UI components
│   │   └── ui/                 # Primitive UI components
│   ├── db/                     # Database configuration and schema
│   ├── integrations/           # Third-party library integrations
│   │   └── tanstack-query/     # TanStack Query provider setup
│   ├── lib/                    # Shared utilities and configurations
│   ├── routes/                 # File-based route definitions
│   │   ├── api/                # Server-side API routes
│   │   │   └── auth/           # Authentication endpoints
│   │   ├── auth/               # Authentication pages
│   │   ├── account/            # User account pages
│   │   └── __root.tsx          # Root layout (wraps all routes)
│   ├── env.ts                  # Environment variable validation
│   ├── providers.tsx           # Root context providers
│   ├── router.tsx              # TanStack Router initialization
│   ├── routeTree.gen.ts        # Generated route tree (auto-generated)
│   └── styles.css              # Global styles
├── public/                     # Static assets
├── .planning/                  # Planning and analysis documents
├── package.json                # Project dependencies
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration
├── drizzle.config.ts           # Database migrations config
├── biome.json                  # Code formatting/linting rules
└── .env                        # Environment variables (secrets, not committed)
```

## Directory Purposes

**src/components/ui/:**
- Purpose: Reusable UI primitives (buttons, toasts, modals, etc.)
- Contains: Styled React components using Base UI and Tailwind CSS
- Key files: `src/components/ui/button.tsx`, `src/components/ui/sonner.tsx`
- Pattern: Each component exports the component and variant schema (if using CVA)

**src/db/:**
- Purpose: Database access layer and schema definitions
- Contains: Drizzle ORM instance, table schemas
- Key files: `src/db/index.ts` (connection), `src/db/schema.ts` (schema definitions)
- Pattern: Drizzle instance exported from index.ts for use throughout app

**src/integrations/tanstack-query/:**
- Purpose: Provider setup for TanStack Query (React Query)
- Contains: QueryClient initialization, context wrapper component
- Key files: `src/integrations/tanstack-query/root-provider.tsx` (provider), `devtools.tsx` (devtools plugin)
- Pattern: getContext() function ensures singleton QueryClient across SSR and client

**src/lib/:**
- Purpose: Shared utilities and core configurations
- Contains: Auth system setup, utility functions, type definitions
- Key files: `src/lib/auth.ts` (server auth), `src/lib/auth-client.ts` (client auth), `src/lib/utils.ts` (helpers)
- Pattern: Utilities used by routes and components, auth used by API handlers

**src/routes/:**
- Purpose: File-based route definitions matching URL structure
- Contains: Page components, server handlers, API endpoints
- Pattern: Directory structure mirrors URL paths (e.g., src/routes/auth/$authView.tsx → /auth/:authView)
- Route files export `Route` constant created with `createFileRoute()` or `createRootRouteWithContext()`

**src/routes/__root.tsx:**
- Purpose: Root layout component wrapping all pages
- Contains: HTML structure, meta tags, providers, devtools
- Key responsibility: Render `<Providers>{children}</Providers>` for all routes
- Theme initialization script included to prevent flash on load

**src/routes/api/auth/$.ts:**
- Purpose: Authentication API endpoint handler
- Contains: Server-side auth request processing
- Pattern: Catch-all route ($ prefix) handles all `/api/auth/*` requests
- Delegates to Better Auth handler: `auth.handler(request)`

**src/routes/auth/ and src/routes/account/:**
- Purpose: Authentication and account management pages
- Files: `$authView.tsx` (sign-in, sign-up, etc.), `$accountView.tsx` (profile, settings, etc.)
- Contains: Page components rendering AuthView and AccountView from better-auth-ui library
- Pattern: Dynamic segment prefix ($) accepts URL parameters (e.g., authView, accountView)

**src/providers.tsx:**
- Purpose: Compose all context providers needed by application
- Contains: TanStack Query provider, Auth UI provider, router navigation setup
- Pattern: Exported component wraps children with nested providers
- Called from root route to wrap entire application

**src/router.tsx:**
- Purpose: TanStack Router instance creation and configuration
- Contains: getRouter() factory function that creates and configures router
- Exports: getRouter function and Router type registration
- Pattern: Called during app initialization to create router with context

**src/env.ts:**
- Purpose: Environment variable validation and typing
- Contains: Zod schema for server and client (VITE_) env vars
- Pattern: createEnv() from @t3-oss/env-core ensures type-safe env access
- Validated at runtime with emptyStringAsUndefined: true for safety

## Key File Locations

**Entry Points:**
- `src/routes/__root.tsx`: Application root layout and HTML shell
- `src/router.tsx`: Router configuration and initialization
- `src/providers.tsx`: Context provider composition
- `src/routes/index.tsx`: Home page (/)

**Configuration:**
- `vite.config.ts`: Build tool setup (Vite, TanStack Start, Tailwind, Nitro)
- `tsconfig.json`: TypeScript compiler options and path aliases
- `drizzle.config.ts`: Database migration configuration
- `biome.json`: Code formatting and linting rules
- `package.json`: Dependencies and build scripts

**Core Logic:**
- `src/lib/auth.ts`: Server-side authentication system (Better Auth)
- `src/lib/auth-client.ts`: Client-side authentication client
- `src/db/index.ts`: Database connection (Drizzle ORM)
- `src/lib/utils.ts`: Shared utility functions (cn for class merging)

**State Management:**
- `src/integrations/tanstack-query/root-provider.tsx`: Query client setup
- `src/providers.tsx`: Provider composition

**UI Components:**
- `src/components/ui/button.tsx`: Button component with variants
- `src/components/ui/sonner.tsx`: Toast notification component
- `src/routes/auth/$authView.tsx`: Authentication pages (sign-in, sign-up, etc.)
- `src/routes/account/$accountView.tsx`: Account management pages

**Route Handlers:**
- `src/routes/api/auth/$.ts`: Authentication API endpoint (POST/GET)

## Naming Conventions

**Files:**
- **Route files:** Lowercase with `$` for dynamic segments (e.g., `$authView.tsx`, `$accountView.tsx`)
- **Component files:** PascalCase (e.g., `Button.tsx`, `AuthView`)
- **API routes:** Kebab-case with `$` for catch-all (e.g., `$.ts`)
- **Config files:** Lowercase with `.config` extension or conventional names (e.g., `vite.config.ts`, `drizzle.config.ts`)

**Directories:**
- **Feature/domain directories:** Lowercase plural (e.g., `routes`, `components`, `integrations`)
- **Nested routes:** Mirror URL structure in lowercase (e.g., `routes/auth/`, `routes/api/auth/`)
- **Grouped components:** Grouped by type (e.g., `components/ui/`)

**Exports:**
- **Route definitions:** Always export `const Route = createFileRoute(...)`
- **Components:** Named exports for components and helper functions
- **Utils:** Named exports for utility functions
- **Singleton instances:** Default exports for providers and context creators

## Where to Add New Code

**New Feature (e.g., dashboard, blog):**
- Route directory: Create `src/routes/feature-name/` matching URL path structure
- Primary code: Route components in `src/routes/feature-name/*.tsx`
- Shared logic: Extract to `src/lib/feature-name.ts` if reusable
- Components: Add UI components to `src/components/` if shared, or inline in route if feature-specific
- Server logic: Add server handlers in API routes `src/routes/api/feature-name/*.ts`

**New API Endpoint:**
- Location: `src/routes/api/feature/endpoint.ts`
- Pattern: Use `createFileRoute('/api/feature/endpoint')` with `server: { handlers: { GET, POST } }`
- Handlers receive `{ request }` and can access auth, database, etc.
- Example path: `/api/users/list.ts` → POST/GET `/api/users/list`

**New Reusable Component:**
- Location: `src/components/ui/` for primitives, `src/components/` for domain-specific
- Pattern: Export component and variant schema (if using CVA from class-variance-authority)
- Example: Create `src/components/ui/card.tsx` for a new Card component

**New Context/Provider:**
- Location: `src/integrations/` for library integrations, or `src/lib/` for app-specific
- Pattern: Create provider component and export from index, use in `src/providers.tsx`
- Example: Create `src/integrations/my-feature/provider.tsx` and import in providers.tsx

**New Utility/Helper:**
- Location: `src/lib/` for general utilities, or domain-specific file (e.g., `src/lib/auth.ts`)
- Pattern: Named exports for individual functions
- Example: Add function to `src/lib/utils.ts` or create `src/lib/formatting.ts`

**New Database Table:**
- Location: `src/db/schema.ts`
- Pattern: Define table with Drizzle ORM, run `npm run db:push` to apply migration
- Tables auto-used by Better Auth for session management

## Special Directories

**src/routes/ (File-Based Routing):**
- Purpose: Define application routes via file structure
- Generated: `routeTree.gen.ts` is auto-generated by TanStack Router plugin
- Committed: Yes (route files committed, routeTree.gen.ts also committed)
- Pattern: TanStack Router watches this directory and generates route tree automatically
- File naming rules:
  - `index.tsx` = route at directory level (e.g., `routes/index.tsx` → /)
  - `$param.tsx` = dynamic segment (e.g., `routes/auth/$authView.tsx` → /auth/:authView)
  - `$.ts` = catch-all segment (e.g., `routes/api/auth/$.ts` → /api/auth/*)

**src/integrations/ (Third-Party Setup):**
- Purpose: Configuration and initialization for external libraries
- Generated: No
- Committed: Yes
- Pattern: Each subdirectory handles one integration (tanstack-query, future: stripe, etc.)
- Contains: Provider components, context setup, devtools plugins

**src/lib/ (Shared Code):**
- Purpose: Utilities, configurations, core business logic
- Generated: No
- Committed: Yes
- Pattern: Utilities can be imported by routes and components
- Contains: Auth system, utilities, type definitions

**.planning/codebase/ (Analysis Documents):**
- Purpose: Architecture and codebase analysis for development guidance
- Generated: Yes (by GSD mapping tool)
- Committed: Yes
- Files: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

---

*Structure analysis: 2026-03-30*
