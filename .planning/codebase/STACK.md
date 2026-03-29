# Technology Stack

**Analysis Date:** 2026-03-30

## Languages

**Primary:**
- TypeScript 5.7.2 - All source code, configuration, and build setup
- JSX/TSX 5.2.0 - React components and route definitions

**Secondary:**
- CSS 4.1.18 - Styling via Tailwind CSS v4

## Runtime

**Environment:**
- Node.js v24.1.0 - Application runtime
- Modern ES2022 target - TypeScript compilation target

**Package Manager:**
- npm 11.11.1 - Dependency management
- pnpm configuration present for built-in dependency optimization

## Frameworks

**Core:**
- TanStack React Router 1.168.8 - File-based routing and navigation
- TanStack React Start 1.167.13 - Full-stack framework (React + Server)
- React 19.2.4 - UI framework
- Nitro (nightly) - Server-side rendering and API handling

**State Management & Data Fetching:**
- TanStack React Query 5.95.2 - Server state management and data fetching
- TanStack React Form 1.28.5 - Form state management

**UI & Components:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- @tailwindcss/vite 4.1.18 - Vite plugin for Tailwind CSS
- @base-ui/react 1.3.0 - Unstyled accessible UI components
- shadcn 4.1.1 - Pre-built component library
- lucide-react 1.7.0 - Icon library
- sonner 2.0.7 - Toast notifications
- class-variance-authority 0.7.1 - Component style variant generation
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.5.0 - Tailwind CSS class merging
- tw-animate-css 1.4.0 - Animation utilities

**Styling & Theming:**
- @fontsource-variable/inter 5.2.8 - Variable font family (Inter)
- next-themes 0.4.6 - Dark/light theme management

**Testing:**
- Vitest 3.0.5 - Unit and integration test runner
- @testing-library/react 16.3.0 - React component testing utilities
- @testing-library/dom 10.4.1 - DOM testing utilities
- jsdom 28.1.0 - DOM implementation for testing

**Build/Dev Tools:**
- Vite 7.3.1 - Frontend build tool and dev server
- @vitejs/plugin-react 5.1.4 - React support for Vite
- vite-tsconfig-paths 5.1.4 - TypeScript path alias resolution
- @tanstack/devtools-vite 0.6.0 - TanStack devtools Vite plugin
- @tanstack/router-plugin 1.132.0 - TanStack Router Vite plugin
- @tanstack/react-devtools 0.10.0 - React devtools browser integration
- @tanstack/react-query-devtools 5.95.2 - React Query debugger
- @tanstack/react-router-devtools 1.166.11 - Router debugger

**Code Quality:**
- Biome 2.4.5 - Linter and formatter (all-in-one tool)
- TypeScript strict mode enabled - Type safety

**Database:**
- Drizzle ORM 0.45.1 - Type-safe ORM for database access
- drizzle-kit 0.31.9 - Drizzle ORM CLI and migrations
- pg 8.16.3 - PostgreSQL client driver

**Authentication:**
- better-auth 1.5.3 - Full authentication framework
- @daveyplate/better-auth-ui 3.4.0 - Pre-built auth UI components for TanStack

**Utilities:**
- @t3-oss/env-core 0.13.10 - Environment variable validation with Zod
- zod 4.3.6 - Runtime schema validation
- @faker-js/faker 10.3.0 - Fake data generation
- @tanstack/match-sorter-utils latest - String matching utility
- tsx 4.21.0 - TypeScript execution
- dotenv 17.3.1 - Environment variable loading

## Configuration

**Environment:**
- Environment variables validated with Zod via `@t3-oss/env-core` at `src/env.ts`
- Server-side variables: `SERVER_URL`
- Client-side variables (must be prefixed with `VITE_`): `VITE_APP_TITLE`
- Separate `.env` and `.env.local` files supported

**Build:**
- `vite.config.ts` - Vite configuration with TanStack Start, Tailwind, Nitro, and React plugins
- `tsconfig.json` - TypeScript compiler options (ES2022 target, strict mode, path aliases)
- `biome.json` - Code formatter and linter configuration (tab indentation, double quotes)
- `drizzle.config.ts` - Database migration and schema management

**TypeScript Path Aliases:**
- `#/*` → `./src/*` (primary alias)
- `@/*` → `./src/*` (secondary alias)

## Platform Requirements

**Development:**
- Node.js 24.x
- npm 11.x (or pnpm-compatible)
- TypeScript knowledge for type-safe development
- Vite-compatible build environment

**Production:**
- Node.js 24.x runtime
- PostgreSQL database
- Environment variables: `DATABASE_URL` (PostgreSQL connection string)

---

*Stack analysis: 2026-03-30*
