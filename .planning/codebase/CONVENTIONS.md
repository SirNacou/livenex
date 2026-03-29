# Coding Conventions

**Analysis Date:** 2026-03-30

## Naming Patterns

**Files:**
- React components: PascalCase (`Button`, `Toaster`, `Providers`)
- Route files: Use TanStack router naming with `$` for dynamic segments (`$authView.tsx`, `$accountView.tsx`)
- Utility modules: camelCase (`utils.ts`, `auth-client.ts`)
- Database/Config: camelCase (`schema.ts`, `index.ts`)
- Layout/Root: Underscore prefix for special routes (`__root.tsx`)
- API routes: Dynamic dollar prefix (`$.ts` for catch-all)

**Functions:**
- camelCase for all functions: `cn()`, `getRouter()`, `getContext()`
- Component functions: PascalCase (`App`, `RootDocument`, `RouteComponent`)
- Exported functions: camelCase for utilities, PascalCase for React components
- Factory/getter functions: Prefix with `get` (`getRouter()`, `getContext()`)

**Variables:**
- camelCase: `queryClient`, `authClient`, `context`, `router`
- Constants exported: camelCase (`auth`, `db`, `authClient`)
- Theme constants: SCREAMING_SNAKE_CASE (`THEME_INIT_SCRIPT`)

**Types:**
- Interfaces: PascalCase (`MyRouterContext`, `ToasterProps`)
- Props types: `ComponentNameProps` pattern or inline `interface` with file-scoped definitions
- Generic types: Imported from libraries with `type` keyword (`type VariantProps`, `type ReactNode`, `type ClassValue`)

## Code Style

**Formatting:**
- Formatter: Biome 2.4.5
- Indentation: Tabs (configured in `biome.json`)
- Quote style: Double quotes for JavaScript (enforced by Biome)
- Semicolons: Required (Biome default)

**Linting:**
- Linter: Biome 2.4.5
- Configuration: `biome.json` with recommended rules enabled
- Organization: Auto-import organization enabled (`biome assist`)
- Files scanned: `src/**/*`, `.vscode/**/*`, `index.html`, `vite.config.ts`
- Exclusions: Generated files (`routeTree.gen.ts`), styles (`styles.css`)

**Line Length:**
- No explicit limit observed in conventions; follows standard long lines as needed

## Import Organization

**Order:**
1. External third-party libraries (`react`, `@tanstack/*`, etc.)
2. Project imports using path aliases (`#/*` or `@/*`)
3. Type imports: Always use `type` keyword for type-only imports

**Path Aliases:**
- Primary: `#/*` maps to `./src/*` (defined in `tsconfig.json` and `package.json`)
- Alternative: `@/*` maps to `./src/*` (available in `tsconfig.json`)
- Standard: Mix of both; `#/` appears more frequently in code

**Import Examples:**
```typescript
// External first
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ReactNode } from 'react'

// Then project imports
import { cn } from "#/lib/utils"
import { db } from "#/db"
import { Button } from "#/components/ui/button"

// Type imports with type keyword
import type { QueryClient } from "@tanstack/react-query"
```

## Error Handling

**Patterns:**
- Inline try-catch in JavaScript/browser context (see `THEME_INIT_SCRIPT` in `src/routes/__root.tsx:18`)
- No explicit error handling in component code; errors bubble to provider level
- Better-auth handles auth errors automatically
- Tanstack Query handles async error states through query hooks
- Database errors: Handled by Drizzle ORM + Better-auth integration

**Observed approach:**
- Silent failure with fallback behavior in client-side code (e.g., theme init script)
- Framework-provided error boundaries (Tanstack Router)
- No custom error classes or centralized error handling visible

## Logging

**Framework:** Not used - no logging library detected

**Patterns:**
- No explicit console logging in application code
- Devtools provide debugging: TanStack DevTools, React Devtools, Router Devtools
- Log sink: Tanstack Query Devtools integration

**Recommendation for adding logs:**
- Use Sonner toast notifications for user-facing messages (`src/components/ui/sonner.tsx`)
- Use devtools for development debugging
- Avoid console logging in production code

## Comments

**When to Comment:**
- JSDoc blocks for complex configuration: observed in `src/env.ts` with block comments explaining Zod validation behavior
- Biome ignore directives: `{/** biome-ignore lint/... */}` for exceptions to linting rules (seen in `src/routes/__root.tsx:48`)
- Documentation blocks for setup/configuration in utility files

**JSDoc/TSDoc:**
- Used sparingly for explanation blocks (seen in `src/env.ts` lines 9-38)
- Not used for function documentation in general code
- Pattern: Block comments for complex logic explanation, not inline annotations

## Function Design

**Size:** 
- Small focused functions (6-11 lines typical for route components)
- Larger files when they contain variant definitions (Button component: 58 lines)

**Parameters:**
- Destructured props: `{ children }`, `{ ...props }`
- Type annotations required for all parameters in TypeScript files
- Props patterns: Inline interface or spread existing component props

**Return Values:**
- React components return JSX.Element
- Utilities return specific types (`string`, `QueryClient`, etc.)
- Export constants with explicit types: `export const auth = betterAuth({...})`

**Example patterns:**
```typescript
// Simple utility with clear types
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Component with destructured props
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive {...props} />
}

// Route component pattern
function RouteComponent() {
  const { authView } = Route.useParams()
  return (
    <main className="...">
      <AuthView pathname={authView} />
    </main>
  )
}
```

## Module Design

**Exports:**
- Named exports for utilities: `export function cn(...)`, `export const auth = ...`
- Default exports for integrations and providers: `export default TanStackQueryProvider`
- Mixed pattern: Some files export both (`src/components/ui/button.tsx` exports both function and variant const)

**Barrel Files:**
- Not observed in current codebase
- Components are imported directly from their files

**Pattern Example:**
```typescript
// Utility module export
export function cn(...inputs: ClassValue[]) { ... }

// Configuration module export
export const auth = betterAuth({...})

// Component export
export { Button, buttonVariants }

// Provider default export
export default function TanStackQueryProvider({...}) { ... }
```

## TypeScript Configuration

**Strict Mode:** Enabled
- `strict: true` in `tsconfig.json`
- `noUnusedLocals: true` - Unused variables not allowed
- `noUnusedParameters: true` - Unused parameters not allowed
- `noFallthroughCasesInSwitch: true` - Switch fallthrough prevented
- `noUncheckedSideEffectImports: true` - Explicit side effect imports required

**Module Resolution:** Bundler mode with path aliases

**JSX:** React 17+ automatic JSX transform enabled

## Component Patterns

**Styled Components:**
- Tailwind CSS for styling (via `@tailwindcss/vite` plugin)
- Class variance authority for component variants
- `cn()` utility for merging classes: `cn(buttonVariants({ variant, size, className }))`

**Props Pattern:**
- Spread syntax with defaults: `{ variant = "default", size = "default", ...props }`
- Type composition: Combining component props with variant types
- Forwarding: Full spread forwarding to underlying components

**Example:**
```typescript
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

---

*Convention analysis: 2026-03-30*
