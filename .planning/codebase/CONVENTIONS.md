# Coding Conventions

**Analysis Date:** 2026-03-30

## Naming Patterns

**Files:**
- Component files: PascalCase (e.g., `Button.tsx`, `Toaster.tsx`)
- Utility/helper files: camelCase (e.g., `auth-client.ts`, `get-treaty.ts`)
- Config files: camelCase or kebab-case (e.g., `drizzle.config.ts`, `vite.config.ts`)
- Route files: Dollar-prefix pattern for dynamic routes (e.g., `$authView.tsx`, `$accountView.tsx`)
- Index files: `index.ts` for exporting modules

**Functions:**
- Component functions: PascalCase (e.g., `Button`, `Toaster`, `RootDocument`, `RouteComponent`)
- Utility functions: camelCase (e.g., `cn`, `getRouter`, `getTreaty`, `getContext`)
- Handler functions: camelCase with descriptive names (e.g., `handle`)
- Arrow functions preferred for inline handlers: `const handle = ({ request }: { request: Request }) => app.fetch(request)`

**Variables:**
- Constants: camelCase or SCREAMING_SNAKE_CASE for initialization scripts (e.g., `THEME_INIT_SCRIPT`)
- State variables: camelCase (e.g., `data`, `message`, `stored`, `mode`)
- Objects/configs: camelCase (e.g., `buttonVariants`, `authClient`)
- Destructured props: camelCase

**Types:**
- Interfaces: PascalCase (e.g., `MyRouterContext`, `ToasterProps`)
- Type aliases: PascalCase (e.g., `ClassValue`, `VariantProps`)
- Imported type keyword: Use `type` prefix for imports (e.g., `import type { QueryClient }`)
- Props types: Inline with component or `PropsName` suffix (e.g., `ButtonPrimitive.Props`)

## Code Style

**Formatting:**
- Tool: Biome 2.4.5
- Indent style: Tabs
- Quote style: Double quotes
- Enabled formatter: true
- Organized imports enabled

**Linting:**
- Tool: Biome (built-in)
- Rules: Recommended rules enabled
- Configuration: `biome.json`
- Security rules enforced: e.g., `noDangerouslySetInnerHtml` (with biome-ignore override when necessary)

**File Organization:**
```
src/
├── components/        # React components
├── ui/               # UI components (shadcn pattern)
├── db/               # Database configuration and schema
├── lib/              # Utilities and helpers
├── integrations/     # Third-party integration wrappers
├── routes/           # File-based routing (TanStack Router)
├── server/           # Server-side functions
├── index.ts          # Elysia app entry point
├── env.ts            # Environment variables
├── providers.tsx     # Root provider component
└── router.tsx        # Router configuration
```

## Import Organization

**Order:**
1. External framework imports (React, Elysia, TanStack)
2. Third-party library imports (class-variance-authority, zod, etc.)
3. Relative imports with path aliases (`#/` or `@/`)
4. Type imports use `import type` syntax

**Path Aliases:**
- `#/*` maps to `./src/*` (primary alias, used throughout codebase)
- `@/*` maps to `./src/*` (secondary alias, also available)

**Example:**
```typescript
import { Toaster } from "#/components/ui/sonner";
import { Providers } from "#/providers";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
```

## Error Handling

**Patterns:**
- No explicit try-catch blocks in most route components
- Error handling delegated to framework and library defaults
- Inline error handling: Inline script uses `try-catch` with silent fallback (e.g., `catch(e){}` in THEME_INIT_SCRIPT)
- Errors from async operations handled by TanStack Router loaders implicitly
- API errors handled by client library (`eden` from Elysia)

**Example:**
```typescript
// Route loader with implicit error handling
loader: async () => {
  const r = await getTreaty().get()
  return r.data
}
```

## Logging

**Framework:** No explicit logging library configured
- Console logging not used in codebase (not required for current patterns)
- Errors logged implicitly by framework and libraries
- Development debugging: Use TanStack Devtools components enabled in root layout

## Comments

**When to Comment:**
- JSDoc comments for complex public APIs: `/** ... */` syntax used in `env.ts` for configuration documentation
- Biome-ignore directives for security overrides: `{/** biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}`
- Auto-generated files marked as non-editable: `routeTree.gen.ts` has explicit "do not modify" comments
- Minimal inline comments; code should be self-documenting

**JSDoc/TSDoc:**
- Used for environment variable descriptions and configuration notes
- Multi-line comments document WHY decisions were made
- Single-line comments rare; code readability preferred

## Function Design

**Size:** 
- Small, focused functions preferred
- Most route components: 10-30 lines
- Utility functions: Single responsibility (e.g., `cn` = class merging only)

**Parameters:**
- Destructured props for component functions
- Named parameters with type annotations: `const handle = ({ request }: { request: Request })`
- Rest spread operators for passthrough props: `{ ...props }` for UI components

**Return Values:**
- Implicit returns in arrow functions
- JSX components return React.ReactNode
- Utility functions return typed values
- Async functions return Promises with generic type

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

## Module Design

**Exports:**
- Named exports preferred: `export const`, `export function`
- Default exports used for route components created with `createFileRoute`
- Barrel exports from index files: `export { Button, buttonVariants }`
- Type-only exports: `export { type AppType }` with `type` keyword

**Barrel Files:**
- Index files re-export from component folders
- Example: `components/ui/button.tsx` exports both `Button` component and `buttonVariants` utility

**Patterns:**
- Config objects centralized: `env.ts`, `router.tsx`, `providers.tsx`
- Route configuration: `export const Route = createFileRoute(...)`
- Integration wrappers: Abstract external library setup in `integrations/` folder
- Server functions: Wrapped with `createIsomorphicFn()` for dual server/client execution

## TypeScript Configuration

**Strict Mode:** Enabled
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedSideEffectImports: true`

**Module System:**
- Module: ESNext
- Module resolution: bundler
- Allows importing .ts/.tsx extensions: `allowImportingTsExtensions: true`
- Verbatim module syntax: `verbatimModuleSyntax: true`

## Architectural Principles

**Composition Over Inheritance:**
- React functional components with hooks
- Wrapper pattern for library components (e.g., Button wraps ButtonPrimitive)
- Provider pattern for context setup: `Providers.tsx` wraps multiple providers

**Separation of Concerns:**
- Utilities isolated in `lib/` (e.g., `utils.ts`, `auth.ts`)
- Database logic in `db/`
- Route-specific logic in `routes/`
- Integrations abstracted in `integrations/`

**Single Responsibility:**
- Each file has one primary export
- Components focus on rendering
- Utilities focus on data transformation
- Config files focus on setup

**Immutability:**
- Const declarations preferred over let
- Functional paradigm for state management (TanStack Query for server state)

---

*Convention analysis: 2026-03-30*
