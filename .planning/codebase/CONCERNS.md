# Codebase Concerns

**Analysis Date:** 2026-03-30

## Dependency Stability

**Unstable Version Pinning:**
- Issue: Multiple critical dependencies pinned to `latest` and nightly versions, creating reproducibility and stability risks
- Files: `package.json`
- Dependencies: `@tanstack/react-query`, `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/react-router-ssr-query`, `@tanstack/react-form`, `@tanstack/react-table`, `@tanstack/react-devtools`, `@tanstack/react-query-devtools`, `@tanstack/devtools-vite`, `nitro` (npm:nitro-nightly@latest)
- Impact: Breaking changes could be introduced without notice, making deployments unpredictable. Cannot reproduce exact build locally after time passes.
- Fix approach: Pin all `latest` versions to specific semver ranges (e.g., `^5.0.0` instead of `latest`). Document decision and establish version upgrade strategy with testing before deployment.

**Experimental Features in Use:**
- Issue: Using `experimental.joins` feature in better-auth configuration
- Files: `src/lib/auth.ts` (lines 14-16)
- Impact: No guarantee of stability; API could change or be removed in future releases. Breaking changes to authentication functionality possible.
- Fix approach: Monitor better-auth releases closely. Plan migration path if experimental feature becomes unstable.

## Database Configuration Concerns

**Missing Database Schema:**
- Issue: `src/db/schema.ts` is completely empty (0 lines)
- Files: `src/db/schema.ts`
- Impact: Drizzle ORM cannot function without schema definitions. Database operations will fail at runtime. Cannot generate migrations.
- Fix approach: Define complete database schema with tables, columns, and relationships. Use `npm run db:generate` after schema definition to create migrations.

**Unsafe Database Connection String Access:**
- Issue: Direct use of `process.env.DATABASE_URL!` with non-null assertion in multiple locations
- Files: `src/db/index.ts` (line 5), `drizzle.config.ts` (line 11)
- Impact: If DATABASE_URL is missing or undefined, application will crash at runtime without graceful error. No validation that URL is valid PostgreSQL connection string.
- Fix approach: Use the existing `env` validation in `src/env.ts` to validate `DATABASE_URL` at startup with Zod schema. Replace direct env access with validated `env.DATABASE_URL`.

## Incomplete Environment Validation

**Missing Server Environment Variables:**
- Issue: Server-side environment validation in `src/env.ts` only defines `SERVER_URL` (optional). Database URL and other backend configs not validated.
- Files: `src/env.ts`
- Impact: Missing critical env vars will not be caught until runtime. No clear documentation of required environment variables.
- Fix approach: Add all required server environment variables to validation schema (e.g., `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`). Document all required env vars in README.

## Testing Gaps

**No Test Coverage:**
- Issue: Zero test files found in codebase despite modern testing infrastructure (Vitest, Testing Library installed)
- Files: None - this is the problem
- Impact: Authentication flows, API endpoints, and data fetching are untested. Regression risk is high. Cannot safely refactor.
- Priority: High
- Fix approach: Create tests for critical paths: authentication (signup, login, logout), API endpoints, React Query integration, route navigation. Start with critical business logic.

## Architecture & State Management Issues

**Redundant Data Fetching Pattern:**
- Issue: Data is fetched twice in the same component - once in route loader and again with useQuery
- Files: `src/routes/index.tsx` (lines 6-8, 15-20)
- Impact: Unnecessary network request, performance degradation, potential cache invalidation issues, inconsistent state.
- Fix approach: Choose ONE pattern: either use route loader for server-side data + pass to client, OR use useQuery for client-side fetching. Do not use both for same data.

**Global QueryClient State Issue:**
- Issue: QueryClient is created once at module load via `getContext()` and reused globally, violating React best practices for context
- Files: `src/integrations/tanstack-query/root-provider.tsx` (lines 10-22)
- Impact: In SSR/test environments, stale cache could persist across requests. Hydration mismatches possible. Testing isolation broken.
- Fix approach: Create fresh QueryClient per server request (SSR) and per test. Use React Context properly with `createContext` hook. Reference: TanStack React Query SSR patterns.

**Unmanaged Error Handling:**
- Issue: No error boundaries, error handling middleware, or error recovery logic found in routes
- Files: `src/routes/` (all route files)
- Impact: Unhandled errors crash the page with no user feedback. Failed API calls have no retry logic.
- Fix approach: Add React Error Boundary component. Add error handling in useQuery calls. Add error toast notifications via Sonner (already imported).

## Security Considerations

**Dangerously Rendered Inline Script:**
- Issue: Theme initialization script rendered with `dangerouslySetInnerHTML` without content security policy
- Files: `src/routes/__root.tsx` (lines 18, 49)
- Impact: XSS vulnerability if environment variables are interpolated into this script. Script has no CSP headers to prevent injection.
- Current mitigation: Script is hardcoded, not interpolated. But biome-ignore comment suggests awareness of risk.
- Recommendations: Add Content-Security-Policy headers to block inline scripts. Move script to separate file with hash-based CSP. Ensure no env vars are embedded in this script.

**Unencrypted Connection String in Non-Local Environments:**
- Issue: DATABASE_URL contains plaintext connection string, potentially passed through build artifacts or logs
- Files: `src/db/index.ts`, `drizzle.config.ts`
- Impact: If connection string leaks in error logs, build outputs, or monitoring systems, database credentials exposed.
- Fix approach: Never log or expose DATABASE_URL. Use `.env.local` for local development (already in .gitignore). For production, inject via secure secret management (environment variables, AWS Secrets Manager, Vault).

**Missing CSRF and Auth Validation on API Routes:**
- Issue: API routes in `/api/$` accept all HTTP methods without explicit method routing or validation
- Files: `src/routes/api/$.ts` (lines 10-15)
- Impact: No per-endpoint authentication or CSRF protection enforced. Auth is delegated to Elysia backend but no guards on routing layer.
- Fix approach: Add route-level guards for protected endpoints. Validate request origin for state-changing operations (POST, PUT, DELETE). Use `better-auth` middleware.

## Performance Concerns

**Devtools Always Bundled:**
- Issue: TanStack devtools (React Query, Router, React) bundled in production builds
- Files: `src/routes/__root.tsx` (lines 56-67)
- Impact: Increases production bundle size with non-essential debug UI. Slight performance overhead.
- Fix approach: Conditionally render devtools only in development: `if (process.env.NODE_ENV === 'development') { return <Devtools /> }`. Or use Vite environment checks.

**React Compiler Without Memoization Strategy:**
- Issue: React Compiler (babel-plugin-react-compiler) enabled but no explicit memoization or component splitting strategy
- Files: `vite.config.ts` (line 20)
- Impact: Compiler optimizes what it can, but without strategic component design, unnecessary re-renders possible.
- Fix approach: Review components for memoization opportunities. Ensure route components are properly split. Document component re-render expectations.

## Maintainability Issues

**Generated Routes File Not in Gitignore:**
- Issue: `src/routeTree.gen.ts` (156 lines) is committed to git but auto-generated by TanStack Router plugin
- Files: `src/routeTree.gen.ts`, `.gitignore`
- Impact: Merge conflicts when multiple developers add routes. File includes `as any` type casts (5 instances, lines 22, 27, 32, 37, 42).
- Fix approach: Add `src/routeTree.gen.ts` to `.gitignore`. Regenerate locally via `npm run build` or watch mode. Document in README.

**Type Safety Violations in Generated Code:**
- Issue: Auto-generated file contains multiple `as any` type assertions, suppressing TypeScript safety
- Files: `src/routeTree.gen.ts` (lines 22, 27, 32, 37, 42)
- Impact: Cannot catch type errors in route definitions. Type safety guarantee broken for routing logic.
- Fix approach: Configure TanStack Router to generate proper types. Cannot manually fix - generated file will be overwritten.

**Limited Utility Functions:**
- Issue: Only one utility function exported (`cn` for CSS class merging)
- Files: `src/lib/utils.ts` (6 lines)
- Impact: Common utility patterns may be duplicated across components. No centralized error formatting, date handling, or API response utilities.
- Fix approach: Create additional utility modules: `src/lib/error.ts`, `src/lib/api.ts`, `src/lib/format.ts`.

**Mixed Import Path Aliases:**
- Issue: Code uses both `#/*` and `@/*` path aliases (aliased to same location in tsconfig.json)
- Files: `src/routes/auth/$authView.tsx` (line 1 uses `@/`), most other files use `#/`
- Impact: Inconsistent import patterns make code harder to read. Unclear which alias to use in new code.
- Fix approach: Standardize on single alias (`#/` preferred as it's used 90% of code). Update tsconfig.json to remove redundant alias. Update all imports.

## Empty Database Schema

**Schema Definition Missing:**
- Issue: Database schema file is completely empty, but application expects database
- Files: `src/db/schema.ts`
- Impact: Cannot run migrations (`npm run db:migrate`). Database has no structure. All Drizzle ORM queries will fail.
- Blocks: Data persistence, authentication (better-auth stores sessions in DB), any database-backed features.

## Architectural Gaps

**No API Response Standardization:**
- Issue: Backend API (Elysia) returns plain strings (`"Hello World!"`) with no structured response envelope
- Files: `src/index.ts` (line 5)
- Impact: Frontend cannot reliably detect errors, status codes, or error messages. No standard format for pagination, metadata, errors.
- Fix approach: Create standard API response structure: `{ success: boolean, data: T, error?: string, meta?: {...} }`. Apply to all endpoints.

**Missing Authentication Guards on Protected Routes:**
- Issue: Account and auth routes exist but no authentication middleware to protect them
- Files: `src/routes/account/$accountView.tsx`
- Impact: Any user can navigate to `/account` URLs. No redirect to login for unauthenticated users.
- Fix approach: Add route-level guards using `before` hook in route creation. Redirect unauthenticated users to `/auth/sign-in`. Use better-auth session validation.

**No Environment-Based Configuration:**
- Issue: Hardcoded configuration like API prefix `/api` in Elysia and port 3000 in dev script
- Files: `src/index.ts` (line 4), `package.json` (line 9)
- Impact: Cannot easily switch between environments. Development and production may have different requirements.
- Fix approach: Move configuration to env.ts validation. Support API_PREFIX, API_PORT, API_HOST from environment.

## Data Validation Gaps

**Insufficient Input Validation:**
- Issue: No Zod schemas for API request bodies or form inputs beyond basic auth-ui
- Files: `src/index.ts`, `src/routes/` (route handlers)
- Impact: Invalid data can reach application logic. Security risk for injection attacks. No clear contract for API consumers.
- Fix approach: Create Zod schemas for all API endpoints. Add request validation middleware in Elysia. Validate all user form inputs before submission.

---

*Concerns audit: 2026-03-30*
