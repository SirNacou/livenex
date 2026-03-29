# Testing Patterns

**Analysis Date:** 2026-03-30

## Test Framework

**Runner:**
- Vitest 3.0.5
- Config: Integrated via Vite (no separate `vitest.config.ts` present; uses `vite.config.ts`)
- Invoked with: `bun test` or `npm test`

**Assertion Library:**
- Not explicitly configured; Vitest includes built-in `expect()` assertion API
- Testing libraries available: `@testing-library/react` (16.3.0), `@testing-library/dom` (10.4.1)

**Run Commands:**
```bash
bun test              # Run all tests (vitest run)
npm test              # Runs "vitest run" from package.json scripts
```

**Additional test dependencies:**
- `jsdom` (28.1.0) - DOM environment for testing
- `tsx` (4.21.0) - TypeScript execution for test files

## Current Test Status

**No test files found in source:**
- No `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files in `src/` directory
- Testing infrastructure is configured but not yet implemented
- This is a greenfield testing setup ready for implementation

## Test File Organization

**Recommended Location:**
- Co-located with source files (preferred pattern for modern React projects)
- Pattern: `ComponentName.test.tsx` alongside `ComponentName.tsx`
- Utility tests: `utils.test.ts` alongside `utils.ts`

**Directory structure for tests (recommended):**
```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts
│   ├── auth.ts
│   └── auth.test.ts
└── routes/
    └── [route tests follow file structure]
```

**Naming:**
- Pattern: `[ComponentName|filename].test.tsx` or `.test.ts`
- Include "test" or "spec" suffix before file extension
- Use `.tsx` for React component tests, `.ts` for utility/logic tests

## Test Structure

**No active test examples in codebase** - Pattern recommendations based on Vitest + Testing Library defaults:

**Recommended Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '#/components/ui/button'

describe('Button Component', () => {
  describe('rendering', () => {
    it('should render with default variant', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('should apply secondary variant classes', () => {
      const { container } = render(<Button variant="secondary">Click</Button>)
      expect(container.firstChild).toHaveClass('bg-secondary')
    })
  })
})
```

**Patterns:**
- Setup: No explicit setup needed (Vitest auto-discovers from `vite.config.ts`)
- Teardown: React Testing Library auto-cleanup between tests
- Assertion: Use `expect()` from Vitest with Testing Library matchers

## Mocking

**Framework:** Vitest built-in mocking via `vi` namespace

**Recommended Patterns for this codebase:**

**Module mocking (APIs, external services):**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { auth } from '#/lib/auth'

vi.mock('#/lib/auth', () => ({
  auth: {
    handler: vi.fn()
  }
}))
```

**Function mocking:**
```typescript
import { getRouter } from '#/router'

const mockRouter = {
  navigate: vi.fn(),
  state: { location: { pathname: '/' } }
}

vi.spyOn(router, 'navigate')
```

**What to Mock:**
- External dependencies (Better-auth, Drizzle ORM)
- Database operations (via Drizzle adapter)
- API handlers (`auth.handler()`)
- Navigation in component tests (`useRouter()`)

**What NOT to Mock:**
- Utility functions like `cn()` - test with real implementation
- CSS/Tailwind classes - verify in rendered output, not mocked
- React hooks provided by libraries (use actual hooks from providers)
- Theme initialization logic - test real behavior

## Fixtures and Factories

**Test Data:**
- Not yet implemented in codebase
- Recommended approach using Faker (already installed: `@faker-js/faker`)

**Suggested pattern:**
```typescript
import { faker } from '@faker-js/faker'

// Factory function
export function createMockUser() {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
  }
}

// Usage in tests
describe('Auth', () => {
  it('should create user', () => {
    const user = createMockUser()
    expect(user.email).toBeDefined()
  })
})
```

**Location:**
- Suggested: `src/__tests__/fixtures/` or `src/[feature]/__fixtures__/[name].ts`
- Centralize factories for reuse across test files

## Coverage

**Requirements:** No coverage enforcement detected in current setup

**Recommended approach:**
- Add to `vite.config.ts`: Configure Vitest coverage reporter
- Use: `--coverage` flag or add to npm scripts

**View Coverage:**
```bash
vitest run --coverage        # Generate coverage report
vitest run --ui              # Interactive coverage UI
```

**Coverage config (recommended addition to vite.config.ts):**
```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/routeTree.gen.ts',
        'drizzle/',
      ]
    }
  }
})
```

## Test Types

**Unit Tests:**
- **Scope:** Individual functions, components in isolation
- **Approach:** Test pure functions (`cn()`, validators) without dependencies
- **Example locations:** `src/lib/utils.test.ts`, `src/components/ui/button.test.tsx`
- **Pattern:** Mock external dependencies, test input/output behavior

**Integration Tests:**
- **Scope:** Multiple components, features working together
- **Approach:** Test routes with providers, query client, auth context
- **Example locations:** `src/routes/__root.test.tsx`, auth flow tests
- **Pattern:** Render with full provider stack, test user interactions

**E2E Tests:**
- **Framework:** Not configured (Playwright, Cypress not in dependencies)
- **Status:** Not used currently
- **Recommendation:** Consider adding for critical user flows (auth, account management)

## Common Patterns

**Async Testing:**
- Testing Library handles async automatically with `waitFor()`
- Vitest async test pattern:

```typescript
it('should fetch data', async () => {
  // Render component that uses useQuery
  render(<MyComponent />)
  
  // Wait for async operation
  await waitFor(() => {
    expect(screen.getByText('loaded')).toBeInTheDocument()
  })
})
```

**Component Testing Pattern:**
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('should handle button click', async () => {
  const user = userEvent.setup()
  render(<Button variant="primary">Click me</Button>)
  
  const button = screen.getByRole('button')
  await user.click(button)
  
  expect(button).toHaveFocus()
})
```

**Tanstack Query Testing:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

function renderWithQueryClient(component) {
  const testQueryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={testQueryClient}>
      {component}
    </QueryClientProvider>
  )
}
```

**Error Testing:**
```typescript
it('should handle errors gracefully', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  
  render(<ComponentThatThrows />)
  
  // Error should be caught and handled
  expect(screen.getByText('Error message')).toBeInTheDocument()
  
  console.error.mockRestore()
})
```

## Route Testing

**Pattern for TanStack Router:**
```typescript
import { createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

it('should render route component', async () => {
  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: App,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory(),
  })

  render(<RouterProvider router={router} />)
  expect(screen.getByText('Welcome')).toBeInTheDocument()
})
```

## Testing API Routes

**Pattern for Better-auth handlers:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { auth } from '#/lib/auth'

describe('/api/auth/$ handler', () => {
  it('should handle POST request', async () => {
    const request = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'pwd' })
    })

    const response = await auth.handler(request)
    expect(response.status).toBe(200)
  })
})
```

## Next Steps for Test Implementation

1. **Create test file structure** matching source organization
2. **Start with utilities:** Test `cn()` function and other helpers first
3. **Component tests:** Add tests for `Button` and other UI components
4. **Route tests:** Add tests for auth routes and protected components
5. **Integration tests:** Test complete user flows (sign-up, sign-in, account)
6. **Setup CI/CD:** Run tests on every commit via GitHub Actions or similar

---

*Testing analysis: 2026-03-30*
