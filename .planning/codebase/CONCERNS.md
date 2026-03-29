# Codebase Concerns

**Analysis Date:** 2026-03-30

## Tech Debt

**Floating Dependency Versions:**
- Issue: Multiple core dependencies use `"latest"` tag instead of pinned versions
- Files: `package.json` (lines 29-38, 47, 61)
- Dependencies: `@tanstack/react-query`, `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/react-router-ssr-query`, `@tanstack/react-form`, `@tanstack/react-table`, `@tanstack/match-sorter-utils`, `@tanstack/react-devtools`, `@tanstack/react-query-devtools`, `@tanstack/react-router-devtools`, `@tanstack/devtools-vite`, `nitro` (nightly)
- Impact: Non-deterministic builds, unpredictable breaking changes in production, difficulty reproducing bugs. Nightly dependencies (`nitro`) are especially risky. Teams cannot rebuild the same version, and new developers get different dependency trees.
- Fix approach: Lock all versions to specific semver ranges (e.g., `^1.2.3`). Use `npm audit` or `bun update --latest` with careful testing. Pin nightly dependencies to a specific commit or release when framework stabilizes.

**Experimental Features in Production:**
- Issue: Using experimental API in authentication
- Files: `src/lib/auth.ts` (lines 14-16)
- Code: `experimental: { joins: true }`
- Impact: Better Auth's experimental `joins` feature may change or be removed. This could break user-related queries and database joins without warning.
- Fix approach: Document the reason for using experimental features. Monitor Better Auth changelog for stability announcements. Have a migration plan to move away from experimental joins if/when the API changes.

**Empty Database Schema:**
- Issue: Schema file exists but is completely empty
- Files: `src/db/schema.ts` (0 lines)
- Impact: No tables, columns, or indexes defined. Database integration appears incomplete. Better Auth tables may not exist, causing runtime errors during authentication operations.
- Fix approach: Run `bun run db:generate` to auto-generate schema from database, or manually define all tables needed for Better Auth and the application. Use `bun run db:push` to sync.

**Unvalidated Database URL:**
- Issue: Database URL accessed with non-null assertion without validation
- Files: `src/db/index.ts` (line 5), `drizzle.config.ts` (line 11)
- Code: `process.env.DATABASE_URL!`
- Impact: If `DATABASE_URL` is missing or malformed, the application crashes at runtime rather than failing gracefully during startup.
- Fix approach: Add the `DATABASE_URL` to the T3Env schema in `src/env.ts` with proper validation (e.g., `z.string().url()`). This enforces the variable exists and is valid before the app starts. Update `src/db/index.ts` to use `env.DATABASE_URL` instead.

**Theme Initialization with dangerouslySetInnerHTML:**
- Issue: Inline script injected directly into HTML via dangerouslySetInnerHTML
- Files: `src/routes/__root.tsx` (lines 18, 49)
- Code: `THEME_INIT_SCRIPT` containing localStorage access and DOM manipulation
- Impact: While this particular script is safe (no user input), the pattern is dangerous and opens the door to XSS if modified. The comment `biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>` has no actual explanation provided.
- Fix approach: Extract the theme script to a separate external file in `public/` and reference it via `<script src="...">`. Or use a proper React hook that runs after hydration to set the theme.

## Known Bugs

**Query Client Configuration Gap:**
- Issue: QueryClient created without explicit configuration
- Files: `src/integrations/tanstack-query/root-provider.tsx` (line 15)
- Code: `const queryClient = new QueryClient()` with no default options
- Impact: Uses TanStack Query defaults (30s staleTime, no retry strategy). Queries may appear stale while still in memory. No automatic retries for failed requests. Could lead to silent data inconsistencies.
- Trigger: Long-lived connections with stale data, network failures without retries
- Workaround: Manually refetch data in components or set query options per-query, but this defeats the purpose of having a global QueryClient.

**Auth Handler Endpoints Not Implemented:**
- Issue: Better Auth handler mapped but no actual authentication routes defined
- Files: `src/routes/api/auth/$.ts` (lines 4-10)
- Code: Catches all `/api/auth/*` requests but `auth` module only initializes the server, no OAuth/custom endpoints configured in `src/lib/auth.ts`
- Impact: Authentication flows (login, logout, callback) will fail because the auth server doesn't expose handlers. Users cannot sign in or out.
- Trigger: Any attempt to sign in or access protected routes
- Workaround: None—must configure auth handlers in `src/lib/auth.ts`

**Type Safety Issues in Generated Route Tree:**
- Issue: Auto-generated route file bypasses TypeScript strict mode
- Files: `src/routeTree.gen.ts` (line 1)
- Code: `// @ts-nocheck` and `as any` casts throughout
- Impact: Generated types are not validated by TypeScript. Type errors in route registration won't be caught at compile time. Allows invalid route definitions to slip through.
- Trigger: Modifying routes and relying on generated types
- Workaround: Don't modify this file directly; TanStack Router regenerates it automatically.

## Security Considerations

**Environment Variable Exposure:**
- Risk: DATABASE_URL and BETTER_AUTH_SECRET must be set but are not documented as required in the app initialization
- Files: `src/lib/auth.ts` (setup), `src/db/index.ts` (non-null assertion)
- Current mitigation: `.env` file is in `.gitignore` (good)
- Recommendations: 
  1. Add DATABASE_URL and BETTER_AUTH_SECRET to the T3Env validation schema with helpful error messages if missing
  2. Add a startup check that logs which critical variables are missing
  3. Document in README that both variables MUST be set for the app to work

**Better Auth Secret Not Explicitly Configured:**
- Risk: Better Auth requires a `BETTER_AUTH_SECRET` for CSRF protection and session signing, but it's not configured in `src/lib/auth.ts`
- Files: `src/lib/auth.ts` (missing configuration)
- Current mitigation: Better Auth may auto-detect from env if present
- Recommendations:
  1. Explicitly pass `secret` to `betterAuth()` config: `betterAuth({ secret: env.BETTER_AUTH_SECRET, ... })`
  2. Validate that the secret is a strong random string (Better Auth CLI generates 32+ char strings)

**Unimplemented CSRF Protection for Dynamic Routes:**
- Risk: Dynamic route parameters (`$authView`, `$accountView`) are passed directly to UI components without validation
- Files: `src/routes/auth/$authView.tsx` (line 10-14), `src/routes/account/$accountView.tsx` (line 9-12)
- Current mitigation: Routes are validated by TanStack Router but values are not sanitized in components
- Recommendations:
  1. Use an enum or validator to whitelist allowed `$authView` values (e.g., "login", "sign-up", "sign-out")
  2. Use Zod schema to validate route params before passing to `AuthView` and `AccountView` components
  3. Add a catch-all route for invalid values that redirects to a safe default

**Cookies Configured Without Secure Flags:**
- Risk: Better Auth's TanStack Start cookies plugin may not enforce secure flags in production
- Files: `src/lib/auth.ts` (line 13)
- Current mitigation: Plugin handles cookies but no explicit configuration of SameSite, Secure, HttpOnly
- Recommendations:
  1. Check Better Auth documentation for cookie configuration options
  2. Ensure Secure flag is set in production (HTTPS only)
  3. Set SameSite=Strict to prevent CSRF attacks
  4. Set HttpOnly to prevent JavaScript access to auth cookies

## Performance Bottlenecks

**Theme Synchronization Blocks Rendering:**
- Problem: Inline `THEME_INIT_SCRIPT` executes before any page content renders
- Files: `src/routes/__root.tsx` (lines 18-49)
- Cause: The script manipulates DOM and localStorage before React hydration. If localStorage is slow or the script is large, First Contentful Paint (FCP) is delayed.
- Improvement path: Move theme resolution into a non-blocking context. Use a theme provider with a fallback value from initial meta tag or CSS variable.

**Global Query Client Never Garbage Collected:**
- Problem: QueryClient stored in module-level variable persists across entire app lifetime
- Files: `src/integrations/tanstack-query/root-provider.tsx` (lines 4-8)
- Code: `let context` persists as singleton
- Cause: In SSR or if the provider is unmounted and remounted, the same QueryClient is reused. This can cause stale data to persist across user sessions.
- Improvement path: Create a new QueryClient per session or per user. Reset cache on logout. In SSR, create a new QueryClient per request.

**No Lazy Route Loading:**
- Problem: All routes are likely bundled together
- Files: `src/routeTree.gen.ts` (all routes imported)
- Cause: TanStack Router doesn't appear to have route-level code splitting configured
- Improvement path: Enable route-level code splitting by configuring lazy components in route definitions (e.g., `lazyComponent: () => import('./MyComponent')`). This reduces initial bundle size.

**DevTools Included in Production Bundles:**
- Problem: TanStack Query Devtools, React Router Devtools, and React Devtools loaded in all environments
- Files: `src/routes/__root.tsx` (lines 56-67)
- Cause: Devtools components are rendered conditionally but packages are always imported
- Improvement path: Conditionally import devtools only in development: `if (process.env.NODE_ENV === 'development') { /* import */ }`

## Fragile Areas

**Auth Routes Without Fallbacks:**
- Files: `src/routes/auth/$authView.tsx`, `src/routes/account/$accountView.tsx`
- Why fragile: Parameters are used directly without validation. If `$authView` is an unexpected value, the `AuthView` component may crash or render nothing. No error boundary protects the page.
- Safe modification: Add route-level loaders that validate params with Zod. Add an error boundary around `AuthView` and `AccountView` components. Define allowed values in an enum.
- Test coverage: No tests for route parameter validation or error cases.

**Better Auth Configuration Tightly Coupled to One Database:**
- Files: `src/lib/auth.ts` (hardcoded to Drizzle PostgreSQL adapter)
- Why fragile: If the database provider changes, the adapter must be swapped. No abstraction layer. Better Auth's `experimental.joins` may break with database upgrades.
- Safe modification: Create a factory function for auth configuration that accepts database options. Document which Better Auth versions are tested with which adapter versions.
- Test coverage: No integration tests for auth + database.

**Theme Script Coupled to Storage API:**
- Files: `src/routes/__root.tsx` (THEME_INIT_SCRIPT)
- Why fragile: The inline script directly accesses `window.localStorage` and modifies `document.documentElement`. If localStorage is disabled, the script fails silently. If class names change, styles break.
- Safe modification: Create a theme provider hook that abstracts localStorage access. Test in environments where localStorage is unavailable (private browsing).
- Test coverage: No tests for theme initialization.

## Scaling Limits

**Single Query Client Instance:**
- Current capacity: Handles queries for a single user session
- Limit: Cannot scale to server-side data fetching without clearing cache between requests (in SSR)
- Scaling path: Implement a factory pattern for QueryClient creation. Create a new client per request in SSR. Use React Query Server-Side Rendering utilities from `@tanstack/react-query-server-state` if available.

**No Pagination or Lazy Loading Configured:**
- Current capacity: No example queries; behavior unknown
- Limit: If any queries fetch all data at once, they will fail on larger datasets
- Scaling path: Implement cursor-based pagination or offset-limit pagination in TanStack Query. Use `useInfiniteQuery` for infinite scroll patterns.

**Database URL Connection String No Pool Configuration:**
- Current capacity: Single PostgreSQL connection pool (default from `pg` module)
- Limit: Default pool size is limited; concurrent connections may exhaust the pool
- Scaling path: Add connection pooling configuration (e.g., via pgBouncer or Drizzle's pool options). Set appropriate min/max pool sizes.

## Dependencies at Risk

**Nightly Nitro Dependency:**
- Risk: `"nitro": "npm:nitro-nightly@latest"` is unstable and breaks frequently
- Impact: Builds may fail without warning. Production deployments could break due to Nitro API changes.
- Migration plan: 
  1. Wait for Nitro 3.0 stable release
  2. Switch to a specific version (e.g., `"nitro": "^3.0.0"`)
  3. Thoroughly test before deploying

**TanStack Floating Latest Versions:**
- Risk: Each TanStack package version may have incompatibilities with each other
- Impact: `npm install` on two different days could result in different versions. Breaking changes in one package might require updates to multiple others.
- Migration plan:
  1. Lock all TanStack packages to the same semantic versioning range
  2. Upgrade all at once quarterly
  3. Run full test suite after every upgrade

**Better Auth Experimental Joins:**
- Risk: Experimental APIs are not guaranteed to be stable
- Impact: Code using `joins: true` may break on Better Auth upgrades
- Migration plan:
  1. Monitor Better Auth releases for `joins` stabilization
  2. When stable, remove `experimental` flag
  3. If removed, refactor queries to use explicit joins instead of auto-joins

## Missing Critical Features

**No Error Handling for Failed Queries:**
- Problem: TanStack Query configured with defaults; no global error handler
- Blocks: Cannot notify users of network failures, API errors, or server issues
- Recommendation: Implement a global error boundary using React's error boundary + TanStack Query's `useQuery` options with `onError` callback, or use a query error hook

**No Logging Framework:**
- Problem: No structured logging setup
- Blocks: Debugging production issues, monitoring user behavior, error tracking
- Recommendation: Integrate a logging library (e.g., Pino, Winston, or Sentry) to capture errors and important events server-side

**No Input Validation Layer:**
- Problem: No Zod schemas for API inputs beyond route parameters
- Blocks: Cannot safely parse user input, no automated validation errors
- Recommendation: Create request/response validators using Zod for all API handlers

**No API Rate Limiting:**
- Problem: Auth endpoints have no rate limiting configured
- Blocks: Vulnerable to brute-force attacks on login
- Recommendation: Implement rate limiting middleware (e.g., sliding window, token bucket) on auth endpoints

**No Database Migrations Strategy:**
- Problem: Schema is empty; no migration files exist
- Blocks: Cannot evolve database schema safely or roll back changes
- Recommendation: Use Drizzle migrations. Run `bun run db:generate` and commit migration files to version control.

## Test Coverage Gaps

**No Application Tests:**
- What's not tested: Zero test files in the application source code
- Files: `src/**/*` (no .test.ts or .spec.ts files)
- Risk: No confidence in authentication flow, route handling, or component rendering. Regression bugs will only be caught in production or manual testing.
- Priority: **High** - Authentication and routing changes should be tested before deployment

**No Unit Tests for Utilities:**
- What's not tested: `src/lib/utils.ts` (`cn` function), `src/lib/auth.ts` (auth configuration)
- Files: `src/lib/*`
- Risk: Changes to utility functions or auth configuration could silently break the app
- Priority: **High** - Core utilities should have test coverage

**No Integration Tests for Auth:**
- What's not tested: End-to-end auth flows (signup, login, logout, session management)
- Files: `src/lib/auth.ts`, `src/routes/api/auth/$.ts`, Better Auth integration
- Risk: Authentication is the most critical feature; without tests, breaking changes are undetected
- Priority: **Critical** - Auth must have integration tests

**No Tests for Dynamic Routes:**
- What's not tested: Route parameter validation, error handling for invalid params
- Files: `src/routes/auth/$authView.tsx`, `src/routes/account/$accountView.tsx`
- Risk: Malformed route params could crash the page
- Priority: **Medium** - Add param validation tests and error boundary tests

**No E2E Tests:**
- What's not tested: Full user workflows (login → navigate → logout)
- Framework: None (Playwright, Cypress, or similar not configured)
- Risk: Browser-specific bugs, navigation issues, and state management errors are invisible
- Priority: **Medium** - Add E2E tests for critical user paths

## Code Quality Issues

**Missing Import Path Alias Consistency:**
- Issue: Code uses both `#/*` and `@/*` path aliases inconsistently
- Files: `src/routes/auth/$authView.tsx` (line 1) uses `@/`, but `src/lib/auth-client.ts` uses bare imports
- Impact: Confusing for new developers; unclear which alias to use
- Fix: Standardize on one alias (preferably `#/` based on package.json). Update all imports to use it consistently.

**Biome Config Excludes Generated Files:**
- Issue: `routeTree.gen.ts` and `styles.css` are excluded from linting
- Files: `biome.json` (lines 15-16)
- Impact: Generated files bypass formatting/linting, but developers shouldn't edit them anyway. Exclusion is correct but ensures consistency is maintained.
- Note: This is actually correct behavior—generated files shouldn't be linted.

**No JSDoc for Public APIs:**
- Issue: Exported functions and components lack documentation
- Files: `src/lib/auth-client.ts`, `src/router.tsx`, `src/providers.tsx`
- Impact: New developers must read the code to understand how to use these APIs
- Fix: Add JSDoc comments explaining parameters, return types, and usage examples

---

*Concerns audit: 2026-03-30*
