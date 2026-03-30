<!-- GSD:project-start source:PROJECT.md -->
## Project

**Livenex**

Livenex is a self-hosted uptime monitoring application built for personal home lab use. It monitors HTTP endpoints and hosts (via ping), records availability and response time history, sends alerts via Discord/Slack and email when services change state, and exposes a public status page alongside a protected admin dashboard.

**Core Value:** A single place to know — at a glance and in real time — what is up and what is down in the home lab, with alerts that fire before you notice manually.

### Constraints

- **Tech Stack**: Must use the existing TanStack Start + Elysia + Drizzle + PostgreSQL + Better Auth scaffold — no replacing core libraries
- **Runtime**: Bun (primary); the monitoring scheduler runs in-process with the Elysia server
- **Deployment**: Docker / docker-compose — must ship a Dockerfile and compose config
- **Scale**: Designed for 20-100 monitors; no need for distributed worker architecture
- **Auth**: Better Auth is already integrated — admin login uses existing auth system
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.7.2 - Full-stack application development with strict type checking (ES2022 target)
- JSX/TSX - React component authoring with React 19.2.0
- JavaScript - Build configuration and tooling scripts
## Runtime
- Bun (inferred from `bun.lock` and `@types/bun` dependency)
- Node.js compatible (postinstall scripts support both)
- Bun (primary)
- Fallback support via pnpm with selective built dependencies (`esbuild`, `lightningcss`)
- Lockfile: `bun.lock` (present)
## Frameworks
- @tanstack/react-start (latest) - Full-stack React meta-framework with SSR support
- React 19.2.0 - UI library with React Compiler support
- React DOM 19.2.0 - DOM rendering
- @tanstack/react-router (latest) - Type-safe file-based routing with SSR
- @tanstack/router-plugin 1.132.0 - Vite plugin for route generation
- React Router SSR Query (@tanstack/react-router-ssr-query latest) - Server-side data fetching integration
- Elysia 1.4.28 - TypeScript-first web framework for API routes
- @elysiajs/eden 1.4.8 - Type-safe client for Elysia API routes
- Nitro (nightly) - Server middleware and universal HTTP handler
- @tanstack/react-query (latest) - Asynchronous state management and data synchronization
- @tanstack/react-query-devtools (latest) - Query debugging interface
- @tanstack/react-form (latest) - Type-safe form state management
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- @tailwindcss/vite 4.1.18 - Vite integration for Tailwind
- @tailwindcss/typography 0.5.16 - Typography plugin for prose styling
- shadcn 4.1.1 - Accessible component library (via components.json)
- @base-ui/react 1.3.0 - Unstyled, accessible component primitives
- Lucide React 1.7.0 - Icon library
- class-variance-authority 0.7.1 - Type-safe component variant system
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.5.0 - Merge conflicting Tailwind classes
- tw-animate-css 1.4.0 - Animation utilities
- next-themes 0.4.6 - Dark mode and theme switching
- Sonner 2.0.7 - Toast notifications
- @daveyplate/better-auth-ui 3.4.0 - Pre-built authentication UI components
- Vitest 3.0.5 - Unit and integration test runner
- @testing-library/react 16.3.0 - React component testing utilities
- @testing-library/dom 10.4.1 - DOM testing utilities
- jsdom 28.1.0 - DOM implementation for Node.js
- Vite 7.3.1 - Module bundler and dev server
- @vitejs/plugin-react 5.1.4 - React Fast Refresh and JSX support
- babel-plugin-react-compiler 1.0.0 - React 19 compiler for automatic memoization
- vite-tsconfig-paths 5.1.4 - TypeScript paths support in Vite
- @tanstack/devtools-vite (latest) - Router and query devtools Vite plugin
- Drizzle ORM 0.45.1 - TypeScript ORM with SQL-first approach
- drizzle-kit 0.31.9 - SQL migration and schema tools
- pg 8.16.3 - PostgreSQL client driver
- better-auth 1.5.3 - Type-safe authentication framework
- drizzle adapter - Built-in Drizzle adapter for better-auth
- tanstackStartCookies plugin - Cookie handling for TanStack Start
- @t3-oss/env-core 0.13.10 - Zod-based environment variable validation
- Zod 4.3.6 - TypeScript-first schema validation
- dotenv 17.3.1 - Environment variable loading
- @faker-js/faker 10.3.0 - Realistic test data generation
- @fontsource-variable/inter 5.2.8 - Inter variable font
- @biomejs/biome 2.4.5 - Fast code formatter and linter (replaces ESLint + Prettier)
- @tanstack/react-devtools (latest) - Router devtools with state inspection
- tsx 4.21.0 - TypeScript execution for Node.js
- @types/node 22.10.2 - Node.js type definitions
- @types/react 19.2.0 - React type definitions
- @types/react-dom 19.2.0 - React DOM type definitions
- @types/pg 8.15.6 - PostgreSQL client types
- @types/bun 1.3.11 - Bun runtime types
## Configuration Files
- `tsconfig.json` - Strict mode enabled, ES2022 target, DOM + DOM.Iterable libs
- `vite.config.ts` - Vite configuration with plugins for React, Tailwind, TanStack, and Nitro
- Plugins stack: devtools → nitro → tsconfig-paths → tailwindcss → tanstackStart → viteReact
- `drizzle.config.ts` - PostgreSQL dialect
- `biome.json` - Formatter + Linter
- `components.json` - shadcn component configuration
## Platform Requirements
- Bun 1.0+ (recommended) or Node.js with pnpm
- TypeScript 5.7+
- Git for version control
- Node.js or Bun runtime for Nitro server
- PostgreSQL 12+ database
- Environment variables: `DATABASE_URL`, `SERVER_URL` (optional), `VITE_APP_TITLE` (optional)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Component files: PascalCase (e.g., `Button.tsx`, `Toaster.tsx`)
- Utility/helper files: camelCase (e.g., `auth-client.ts`, `get-treaty.ts`)
- Config files: camelCase or kebab-case (e.g., `drizzle.config.ts`, `vite.config.ts`)
- Route files: Dollar-prefix pattern for dynamic routes (e.g., `$authView.tsx`, `$accountView.tsx`)
- Index files: `index.ts` for exporting modules
- Component functions: PascalCase (e.g., `Button`, `Toaster`, `RootDocument`, `RouteComponent`)
- Utility functions: camelCase (e.g., `cn`, `getRouter`, `getTreaty`, `getContext`)
- Handler functions: camelCase with descriptive names (e.g., `handle`)
- Arrow functions preferred for inline handlers: `const handle = ({ request }: { request: Request }) => app.fetch(request)`
- Constants: camelCase or SCREAMING_SNAKE_CASE for initialization scripts (e.g., `THEME_INIT_SCRIPT`)
- State variables: camelCase (e.g., `data`, `message`, `stored`, `mode`)
- Objects/configs: camelCase (e.g., `buttonVariants`, `authClient`)
- Destructured props: camelCase
- Interfaces: PascalCase (e.g., `MyRouterContext`, `ToasterProps`)
- Type aliases: PascalCase (e.g., `ClassValue`, `VariantProps`)
- Imported type keyword: Use `type` prefix for imports (e.g., `import type { QueryClient }`)
- Props types: Inline with component or `PropsName` suffix (e.g., `ButtonPrimitive.Props`)
## Code Style
- Tool: Biome 2.4.5
- Indent style: Tabs
- Quote style: Double quotes
- Enabled formatter: true
- Organized imports enabled
- Tool: Biome (built-in)
- Rules: Recommended rules enabled
- Configuration: `biome.json`
- Security rules enforced: e.g., `noDangerouslySetInnerHtml` (with biome-ignore override when necessary)
## Import Organization
- `#/*` maps to `./src/*` (primary alias, used throughout codebase)
- `@/*` maps to `./src/*` (secondary alias, also available)
## Error Handling
- No explicit try-catch blocks in most route components
- Error handling delegated to framework and library defaults
- Inline error handling: Inline script uses `try-catch` with silent fallback (e.g., `catch(e){}` in THEME_INIT_SCRIPT)
- Errors from async operations handled by TanStack Router loaders implicitly
- API errors handled by client library (`eden` from Elysia)
## Logging
- Console logging not used in codebase (not required for current patterns)
- Errors logged implicitly by framework and libraries
- Development debugging: Use TanStack Devtools components enabled in root layout
## Comments
- JSDoc comments for complex public APIs: `/** ... */` syntax used in `env.ts` for configuration documentation
- Biome-ignore directives for security overrides: `{/** biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}`
- Auto-generated files marked as non-editable: `routeTree.gen.ts` has explicit "do not modify" comments
- Minimal inline comments; code should be self-documenting
- Used for environment variable descriptions and configuration notes
- Multi-line comments document WHY decisions were made
- Single-line comments rare; code readability preferred
## Function Design
- Small, focused functions preferred
- Most route components: 10-30 lines
- Utility functions: Single responsibility (e.g., `cn` = class merging only)
- Destructured props for component functions
- Named parameters with type annotations: `const handle = ({ request }: { request: Request })`
- Rest spread operators for passthrough props: `{ ...props }` for UI components
- Implicit returns in arrow functions
- JSX components return React.ReactNode
- Utility functions return typed values
- Async functions return Promises with generic type
## Module Design
- Named exports preferred: `export const`, `export function`
- Default exports used for route components created with `createFileRoute`
- Barrel exports from index files: `export { Button, buttonVariants }`
- Type-only exports: `export { type AppType }` with `type` keyword
- Index files re-export from component folders
- Example: `components/ui/button.tsx` exports both `Button` component and `buttonVariants` utility
- Config objects centralized: `env.ts`, `router.tsx`, `providers.tsx`
- Route configuration: `export const Route = createFileRoute(...)`
- Integration wrappers: Abstract external library setup in `integrations/` folder
- Server functions: Wrapped with `createIsomorphicFn()` for dual server/client execution
## TypeScript Configuration
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedSideEffectImports: true`
- Module: ESNext
- Module resolution: bundler
- Allows importing .ts/.tsx extensions: `allowImportingTsExtensions: true`
- Verbatim module syntax: `verbatimModuleSyntax: true`
## Architectural Principles
- React functional components with hooks
- Wrapper pattern for library components (e.g., Button wraps ButtonPrimitive)
- Provider pattern for context setup: `Providers.tsx` wraps multiple providers
- Utilities isolated in `lib/` (e.g., `utils.ts`, `auth.ts`)
- Database logic in `db/`
- Route-specific logic in `routes/`
- Integrations abstracted in `integrations/`
- Each file has one primary export
- Components focus on rendering
- Utilities focus on data transformation
- Config files focus on setup
- Const declarations preferred over let
- Functional paradigm for state management (TanStack Query for server state)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Isomorphic codebase - code runs on both server and client
- File-based routing system using TanStack Router
- Server-side API layer built with Elysia
- Client-side state management via React Query
- Authentication integrated via Better Auth
- Database abstraction using Drizzle ORM
## Layers
- Purpose: Provide HTTP API endpoints and authentication handlers
- Location: `src/index.ts` (Elysia app), `src/routes/api/` (route handlers)
- Contains: API endpoint definitions, authentication middleware, request handlers
- Depends on: `src/lib/auth.ts` for auth logic, `src/db/` for database access
- Used by: Client layer via treaty (Elysia client) and fetch requests
- Purpose: Handle user authentication, session management, and credential validation
- Location: `src/lib/auth.ts` (server), `src/lib/auth-client.ts` (client)
- Contains: Better Auth configuration with Drizzle adapter, email/password plugin
- Depends on: `src/db/` for user persistence, Better Auth framework
- Used by: API routes (`src/routes/api/auth/$`), client providers, UI components
- Purpose: Provide database connection and schema management
- Location: `src/db/index.ts` (client), `src/db/schema.ts` (schema definitions)
- Contains: Drizzle ORM instance, database schema
- Depends on: PostgreSQL (via `DATABASE_URL` env var)
- Used by: Auth layer, any server-side queries
- Purpose: Define application routes and navigation structure
- Location: `src/router.tsx` (router config), `src/routes/` (route files), `src/routeTree.gen.ts` (generated)
- Contains: File-based routes using TanStack Router file convention
- Depends on: TanStack Router, context providers
- Used by: Root layout, navigation, deeplinks
- Purpose: Render UI components and handle user interactions
- Location: `src/routes/` (route components), `src/components/` (shared components)
- Contains: React components, page layouts, UI elements
- Depends on: `src/lib/utils.ts` for utilities, `src/providers.tsx` for context
- Used by: Browser rendering, route displays
- Purpose: Manage client-side application state and server data
- Location: `src/integrations/tanstack-query/` (React Query setup)
- Contains: QueryClient configuration, provider setup
- Depends on: React Query, React Router context
- Used by: All client components via useQuery hooks
- Purpose: Wire up global providers and context
- Location: `src/providers.tsx` (main provider), `src/__root.tsx` (root layout)
- Contains: TanStack Query provider, auth provider, theme setup
- Depends on: Auth client, Query client, UI frameworks
- Used by: Root document wrapper
## Data Flow
- **Server State:** Persisted in PostgreSQL database via Drizzle ORM
- **Session State:** HTTP cookies managed by Better Auth
- **Client Cache:** React Query QueryClient maintains server data cache
- **UI State:** React component state (form inputs, modals, etc.)
- **Router State:** TanStack Router manages active route and params
- **Theme State:** Theme preference stored in localStorage, applied at root
## Key Abstractions
- Purpose: Isomorphic RPC-like client for calling server API
- Examples: `src/server/get-treaty.ts`
- Pattern: Uses `createIsomorphicFn()` to provide server and client implementations
- Purpose: Provide type-safe authentication hooks and methods
- Examples: `src/lib/auth-client.ts`
- Pattern: Creates single `authClient` instance from Better Auth client factory
- Purpose: Provide singleton QueryClient to all components
- Examples: `src/integrations/tanstack-query/root-provider.tsx`
- Pattern: Lazy initialization of QueryClient in getContext()
## Entry Points
- Location: `src/index.ts`
- Triggers: Application start (via Vite/Nitro)
- Responsibilities: Create Elysia app, define base API route, export app type
- Location: `src/routes/__root.tsx`
- Triggers: Browser page load
- Responsibilities: Render root HTML document, setup providers, hydrate theme, include devtools
- Location: `src/router.tsx`
- Triggers: Route initialization
- Responsibilities: Create TanStack Router instance, register context, configure scroll behavior
- Location: `src/routes/index.tsx`
- Triggers: Navigation to `/`
- Responsibilities: Load initial data via treaty, display home page content
## Error Handling
- Route handlers in `src/routes/api/$.ts` catch all HTTP errors via Elysia
- Better Auth handles authentication errors via built-in validation
- React Query handles network errors with automatic retry logic
- Components can catch and display errors via React error boundaries
- Toast notifications via Sonner for user-facing error display (Toaster in root)
## Cross-Cutting Concerns
- Server-side: Elysia request validation, Zod in env validation
- Client-side: Better Auth form validation, React Query error states
- Database schema validation via Drizzle ORM type system
- Better Auth library handles full auth flow
- Sessions via HTTP cookies managed by Better Auth tanstack-start plugin
- Protected routes enforced by auth middleware in route handlers
- Client-side guards via auth client useSession hook pattern
- Tailwind CSS v4 for utility styling
- Class variance authority for component variant management
- Theme management via next-themes with localStorage persistence
- Dark mode support with automatic preference detection
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
