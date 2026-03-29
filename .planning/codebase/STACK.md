# Technology Stack

**Analysis Date:** 2026-03-30

## Languages

**Primary:**
- TypeScript 5.7.2 - Full-stack application development with strict type checking (ES2022 target)
- JSX/TSX - React component authoring with React 19.2.0

**Secondary:**
- JavaScript - Build configuration and tooling scripts

## Runtime

**Environment:**
- Bun (inferred from `bun.lock` and `@types/bun` dependency)
- Node.js compatible (postinstall scripts support both)

**Package Manager:**
- Bun (primary)
- Fallback support via pnpm with selective built dependencies (`esbuild`, `lightningcss`)
- Lockfile: `bun.lock` (present)

## Frameworks

**Core Web Framework:**
- @tanstack/react-start (latest) - Full-stack React meta-framework with SSR support
- React 19.2.0 - UI library with React Compiler support
- React DOM 19.2.0 - DOM rendering

**Routing:**
- @tanstack/react-router (latest) - Type-safe file-based routing with SSR
- @tanstack/router-plugin 1.132.0 - Vite plugin for route generation
- React Router SSR Query (@tanstack/react-router-ssr-query latest) - Server-side data fetching integration

**Backend/API:**
- Elysia 1.4.28 - TypeScript-first web framework for API routes
- @elysiajs/eden 1.4.8 - Type-safe client for Elysia API routes
- Nitro (nightly) - Server middleware and universal HTTP handler

**Data Fetching & State:**
- @tanstack/react-query (latest) - Asynchronous state management and data synchronization
- @tanstack/react-query-devtools (latest) - Query debugging interface
- @tanstack/react-form (latest) - Type-safe form state management

**Styling & UI:**
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

**UI Utilities:**
- Sonner 2.0.7 - Toast notifications
- @daveyplate/better-auth-ui 3.4.0 - Pre-built authentication UI components

**Testing:**
- Vitest 3.0.5 - Unit and integration test runner
- @testing-library/react 16.3.0 - React component testing utilities
- @testing-library/dom 10.4.1 - DOM testing utilities
- jsdom 28.1.0 - DOM implementation for Node.js

**Build & Development:**
- Vite 7.3.1 - Module bundler and dev server
- @vitejs/plugin-react 5.1.4 - React Fast Refresh and JSX support
- babel-plugin-react-compiler 1.0.0 - React 19 compiler for automatic memoization
- vite-tsconfig-paths 5.1.4 - TypeScript paths support in Vite
- @tanstack/devtools-vite (latest) - Router and query devtools Vite plugin

**Database & ORM:**
- Drizzle ORM 0.45.1 - TypeScript ORM with SQL-first approach
- drizzle-kit 0.31.9 - SQL migration and schema tools
- pg 8.16.3 - PostgreSQL client driver

**Authentication:**
- better-auth 1.5.3 - Type-safe authentication framework
- drizzle adapter - Built-in Drizzle adapter for better-auth
- tanstackStartCookies plugin - Cookie handling for TanStack Start

**Environment & Configuration:**
- @t3-oss/env-core 0.13.10 - Zod-based environment variable validation
- Zod 4.3.6 - TypeScript-first schema validation
- dotenv 17.3.1 - Environment variable loading

**Utilities:**
- @faker-js/faker 10.3.0 - Realistic test data generation
- @fontsource-variable/inter 5.2.8 - Inter variable font

**Linting & Formatting:**
- @biomejs/biome 2.4.5 - Fast code formatter and linter (replaces ESLint + Prettier)

**Development Utilities:**
- @tanstack/react-devtools (latest) - Router devtools with state inspection
- tsx 4.21.0 - TypeScript execution for Node.js
- @types/node 22.10.2 - Node.js type definitions
- @types/react 19.2.0 - React type definitions
- @types/react-dom 19.2.0 - React DOM type definitions
- @types/pg 8.15.6 - PostgreSQL client types
- @types/bun 1.3.11 - Bun runtime types

## Configuration Files

**TypeScript:**
- `tsconfig.json` - Strict mode enabled, ES2022 target, DOM + DOM.Iterable libs
  - Path aliases: `#/*` → `./src/*`, `@/*` → `./src/*`
  - Module resolution: bundler mode with verbatim syntax

**Build:**
- `vite.config.ts` - Vite configuration with plugins for React, Tailwind, TanStack, and Nitro
- Plugins stack: devtools → nitro → tsconfig-paths → tailwindcss → tanstackStart → viteReact

**Database:**
- `drizzle.config.ts` - PostgreSQL dialect
  - Schema: `./src/db/schema.ts`
  - Migrations: `./drizzle/` directory

**Code Quality:**
- `biome.json` - Formatter + Linter
  - Formatter: Tab indentation, double quotes (JavaScript)
  - Linter: Recommended rules enabled
  - Auto-organizes imports

**Components:**
- `components.json` - shadcn component configuration
  - Style: base-nova
  - CSS: `src/styles.css` with Tailwind CSS variables
  - Aliases: `#/components`, `#/lib/utils`, `#/components/ui`, `#/lib`, `#/hooks`

## Platform Requirements

**Development:**
- Bun 1.0+ (recommended) or Node.js with pnpm
- TypeScript 5.7+
- Git for version control

**Production:**
- Node.js or Bun runtime for Nitro server
- PostgreSQL 12+ database
- Environment variables: `DATABASE_URL`, `SERVER_URL` (optional), `VITE_APP_TITLE` (optional)

---

*Stack analysis: 2026-03-30*
