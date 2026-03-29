# Codebase Structure

**Analysis Date:** 2026-03-30

## Directory Layout

```
livenex/
├── src/                          # Application source code
│   ├── routes/                   # TanStack Router file-based routes
│   │   ├── __root.tsx           # Root layout and HTML document
│   │   ├── index.tsx            # Home page
│   │   ├── api/                 # API route handlers
│   │   │   ├── $.ts             # Catch-all API handler (delegates to Elysia)
│   │   │   └── auth/            # Authentication endpoints
│   │   │       └── $.ts         # Auth handler
│   │   ├── auth/                # Authentication UI routes
│   │   │   └── $authView.tsx    # Dynamic auth views (sign-in, sign-up, etc.)
│   │   └── account/             # Account management routes
│   │       └── $accountView.tsx # Dynamic account views (profile, settings, etc.)
│   ├── components/              # Reusable React components
│   │   └── ui/                  # Base UI components
│   │       ├── button.tsx       # Button component with variants
│   │       └── sonner.tsx       # Toast notification component wrapper
│   ├── integrations/            # Third-party library integrations
│   │   └── tanstack-query/      # React Query integration
│   │       ├── root-provider.tsx # QueryClient provider setup
│   │       └── devtools.tsx     # React Query devtools panel
│   ├── lib/                     # Shared utilities and clients
│   │   ├── auth-client.ts       # Client-side auth client instance
│   │   ├── auth.ts              # Server-side Better Auth configuration
│   │   └── utils.ts             # Utility functions (cn, etc.)
│   ├── db/                      # Database layer
│   │   ├── index.ts             # Drizzle ORM instance
│   │   └── schema.ts            # Database schema definitions (empty)
│   ├── server/                  # Server-side utilities
│   │   └── get-treaty.ts        # Isomorphic API client wrapper
│   ├── providers.tsx            # Global context providers wrapper
│   ├── router.tsx               # TanStack Router configuration
│   ├── env.ts                   # Environment variable validation (t3-oss/env-core)
│   ├── routeTree.gen.ts         # Auto-generated route tree (do not edit)
│   ├── index.ts                 # Server API entry point (Elysia app)
│   └── styles.css               # Global styles
├── public/                       # Static assets
├── .planning/                    # GSD planning documents
│   └── codebase/                # Architecture documentation
├── .vscode/                     # VS Code workspace settings
├── .tanstack/                   # TanStack-related config
├── biome.json                   # Biome linter/formatter config
├── drizzle.config.ts            # Drizzle ORM configuration
├── vite.config.ts               # Vite build configuration
├── tsconfig.json                # TypeScript compiler configuration
├── package.json                 # Dependencies and scripts
├── bun.lock                      # Lock file (Bun package manager)
└── README.md                     # Project documentation
```

## Directory Purposes

**`src/routes/`:**
- Purpose: File-based routing system - each file/folder structure maps to URL routes
- Contains: Route components (TSX), route loaders, server-side route handlers
- Key files: `__root.tsx` (layout), `index.tsx` (home), dynamic routes with `$` prefix
- Pattern: File names become URL paths - `auth/$authView.tsx` creates `/auth/:authView` route

**`src/components/`:**
- Purpose: Reusable React components
- Contains: UI components, layout components, feature-specific components
- Key files: `ui/` subdirectory contains base components (Button, Sonner)
- Pattern: Atomic design - start with small UI pieces in `ui/`, build feature components above

**`src/integrations/`:**
- Purpose: Third-party library integrations and setup
- Contains: Provider configurations, wrapper components, initialization code
- Key files: `tanstack-query/` - React Query setup
- Pattern: Each integration has isolated setup to avoid polluting main codebase

**`src/lib/`:**
- Purpose: Shared utilities, clients, and configurations
- Contains: Authentication client, API client wrappers, utility functions
- Key files: `auth-client.ts` (client), `auth.ts` (server), `utils.ts` (helpers)
- Pattern: Non-component, non-route logic lives here

**`src/db/`:**
- Purpose: Database access layer
- Contains: Drizzle ORM instance, database schema
- Key files: `index.ts` (export db instance), `schema.ts` (table definitions)
- Pattern: Database client exported and used server-side only

**`src/server/`:**
- Purpose: Server-only utilities and API helpers
- Contains: Server-side functions, API wrappers
- Key files: `get-treaty.ts` (isomorphic API client)
- Pattern: Code here can be imported in routes but only executes on server

**`src/providers.tsx`:**
- Purpose: Global context provider composition
- Contains: TanStack Query provider, authentication UI provider, nested providers
- Pattern: Single file that wraps all providers - imported in root layout

**`src/router.tsx`:**
- Purpose: TanStack Router configuration and context setup
- Contains: Router creation, context definition
- Pattern: Creates router instance with route tree and context

**`src/env.ts`:**
- Purpose: Environment variable validation
- Contains: Schema definitions for server and client env vars
- Pattern: t3-oss/env-core validates at startup, prevents runtime errors

**`src/index.ts`:**
- Purpose: Server API entry point
- Contains: Elysia app instance with base routes
- Pattern: Exported as AppType for client type safety

## Key File Locations

**Entry Points:**
- `src/index.ts`: Server API entry point (Elysia app)
- `src/routes/__root.tsx`: Client entry point (root layout and HTML)
- `src/router.tsx`: Router initialization
- `vite.config.ts`: Build configuration

**Configuration:**
- `src/env.ts`: Environment variable validation
- `src/lib/auth.ts`: Authentication server setup
- `src/integrations/tanstack-query/root-provider.tsx`: Query client setup
- `drizzle.config.ts`: Database migration configuration

**Core Logic:**
- `src/lib/auth-client.ts`: Client-side authentication
- `src/server/get-treaty.ts`: API communication layer
- `src/db/index.ts`: Database connection

**Testing:**
- No test files detected in src/ directory
- `vitest` configured but no test suite present

## Naming Conventions

**Files:**
- Route files: PascalCase for route segments (e.g., `__root.tsx`)
- Dynamic segments: `$paramName.tsx` (e.g., `$authView.tsx`)
- Component files: `PascalCase.tsx` (e.g., `Button.tsx`)
- Utilities/configs: `camelCase.ts` (e.g., `utils.ts`, `auth-client.ts`)
- Index files: `index.ts` for directory exports

**Directories:**
- Feature directories: `lowercase` (e.g., `routes/`, `components/`, `lib/`)
- UI components: `ui/` subdirectory under components
- Integrations: `integrations/` with descriptive subdirectories

**Types/Interfaces:**
- Interface names: PascalCase, often prefixed with their context
- Generic context types: `MyRouterContext` (see `__root.tsx`)

## Where to Add New Code

**New Feature:**
- Primary code: `src/routes/` (create new route file or folder)
- Components: `src/components/` (if component-based features)
- Server logic: `src/server/` or `src/lib/` depending on scope
- Tests: Create `.test.ts` or `.spec.ts` next to source file

**New Component/Module:**
- UI component: `src/components/ui/` (for reusable base components)
- Feature component: `src/components/` (for feature-specific components)
- Logic: `src/lib/` (for utilities), `src/server/` (for server code)
- Integration: `src/integrations/` (if wrapping third-party library)

**Utilities:**
- General utilities: `src/lib/utils.ts`
- Domain-specific utilities: Create file in `src/lib/` (e.g., `src/lib/date-utils.ts`)
- Server utilities: `src/server/` directory
- Client utilities: `src/lib/` or `src/utils/` (as project grows)

**API Routes:**
- Public API: `src/routes/api/` with catch-all `$.ts` handler
- Auth endpoints: Handled by `src/routes/api/auth/$.ts`
- New endpoints: Add to Elysia app in `src/index.ts` or create new route handler

## Special Directories

**`src/routes/`:**
- Purpose: File-based routing
- Generated: Partially - `routeTree.gen.ts` is auto-generated
- Committed: Yes - route files are committed, `routeTree.gen.ts` is generated

**`src/components/ui/`:**
- Purpose: Base UI component library
- Generated: No
- Committed: Yes - hand-crafted components

**`src/integrations/`:**
- Purpose: Third-party integrations isolated from main code
- Generated: No
- Committed: Yes

**`routeTree.gen.ts`:**
- Purpose: Auto-generated route tree mapping
- Generated: Yes - do NOT edit manually
- Committed: Yes - check in generated file
- Regenerated: When routes change, rebuild triggers generation

**`.planning/codebase/`:**
- Purpose: Architecture documentation for code generation
- Generated: Yes - created by GSD tools
- Committed: Yes - referenced by other agents

## File Size Overview

- `src/routes/__root.tsx`: ~2.2KB (root layout with providers)
- `src/routes/index.tsx`: ~774B (home page)
- `src/components/ui/button.tsx`: ~1.8KB (button variants)
- `src/routes/auth/$authView.tsx`: ~844B (auth UI wrapper)
- Most files: < 1KB (clean separation of concerns)

---

*Structure analysis: 2026-03-30*
