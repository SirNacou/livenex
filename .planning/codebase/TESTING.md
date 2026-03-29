# Testing Patterns

**Analysis Date:** 2026-03-30

## Test Framework

**Runner:**
- Vitest 3.0.5
- Config: No `vitest.config.ts` (uses defaults)
- No tests currently present in codebase

**Assertion Library:**
- @testing-library/react 16.3.0 (installed)
- @testing-library/dom 10.4.1 (installed)
- No custom assertion wrappers found

**Run Commands:**
```bash
npm test                # Run all tests with Vitest
npm run test            # Alias for above
```

**Configuration:**
- Default Vitest patterns: `**/*.{test,spec}.?(c|m)[jt]s?(x)`
- Default exclude: `**/node_modules/**`, `**/dist/**`, `**/cypress/**`
- JSDOM environment configured (via @testing-library packages)

## Test File Organization

**Location:**
- No established pattern yet - tests would be co-located with source files or in dedicated test directory
- Default pattern expects files named `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx`

**Naming:**
- Recommended convention: `[ComponentName].test.tsx` for components, `[functionName].test.ts` for utilities
- Example patterns (proposed): `Button.test.tsx`, `cn.test.ts`, `getRouter.test.ts`

**Structure:**
```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx           # Co-located test
│   │   └── Toaster.test.tsx
├── lib/
│   ├── utils.ts
│   └── utils.test.ts
└── routes/
    ├── index.tsx
    └── index.test.tsx
```

## Test Structure

**Setup Pattern:**
No established test suite structure in codebase. Recommended approach using Testing Library:

```typescript
// Example: Component test structure
import { render, screen } from "@testing-library/react";
import { Button } from "#/components/ui/button";

describe("Button Component", () => {
  it("renders with default variant", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });
});
```

**Teardown Pattern:**
- Vitest + @testing-library handles automatic cleanup
- No manual teardown required per Testing Library best practices

**Assertion Pattern:**
- Expect-based assertions from vitest
- Testing Library matchers: `toBeInTheDocument()`, `toBeVisible()`, etc.
- DOM queries via Testing Library: `getByRole()`, `getByText()`, `queryBy*()`, `findBy*()`

## Mocking

**Framework:** Vitest built-in mocking
- `vi.mock()` for module mocking
- `vi.fn()` for function mocking
- `vi.spyOn()` for spying on methods

**Patterns:**
```typescript
// Mocking external modules
vi.mock("#/lib/auth-client", () => ({
  authClient: { login: vi.fn() },
}));

// Mocking functions
const mockFn = vi.fn();

// Spying on library calls
const spy = vi.spyOn(console, "log");
```

**What to Mock:**
- External API calls (use `vi.mock()` for eden/treaty client)
- Database connections (mock drizzle-orm)
- Authentication functions (mock `authClient` from `#/lib/auth-client`)
- TanStack Router and Query APIs if testing logic in isolation

**What NOT to Mock:**
- Core React functionality
- Custom utility functions (e.g., `cn` - test real implementation)
- Component composition unless testing integration points
- CSS utilities and className helpers

## Fixtures and Factories

**Test Data:**
No established test fixtures or factories yet. Recommended approach:

```typescript
// Example: factories/user.factory.ts
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: "1",
  email: "test@example.com",
  name: "Test User",
  ...overrides,
});

// Usage in test
const user = createMockUser({ email: "custom@example.com" });
```

**Location:**
- Proposed: `src/__tests__/fixtures/` or `src/__tests__/factories/`
- Shared fixtures across multiple test files
- Component-specific test data in test file directly

## Coverage

**Requirements:** No coverage requirements enforced
- Vitest supports coverage via `--coverage` flag
- No CI/CD integration configured yet

**View Coverage:**
```bash
# Generate coverage report (requires @vitest/coverage-v8 or similar)
npm test -- --coverage
```

**Configuration (if enabled):**
- Recommended minimum: 80% for critical paths (auth, data handling)
- UI component tests: visual/integration testing preferred over snapshot testing

## Test Types

**Unit Tests:**
- Scope: Individual functions and utilities
- Approach: Test pure functions in isolation
- Example: `cn()` utility, route loaders, data transformers
- Pattern: No dependencies on real services/databases

**Integration Tests:**
- Scope: Component rendering with providers
- Approach: Render components with actual context providers
- Example: Route components with TanStack Router context, authenticated components
- Pattern: Use real router context and query client from providers

```typescript
// Example: Integration test with providers
import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { App } from "#/routes/index";

const TestWrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router}>
      {children}
    </RouterProvider>
  </QueryClientProvider>
);

it("renders app with data", () => {
  render(<App />, { wrapper: TestWrapper });
});
```

**E2E Tests:**
- Framework: Not configured
- Recommended tool: Playwright or Cypress
- Scope: Full user workflows (auth, navigation, data display)
- Would test: Login → Navigate → Create/Update data → Verify result

## Common Patterns

**Async Testing:**
```typescript
// Using async/await
it("loads data on mount", async () => {
  render(<MyComponent />);
  const element = await screen.findByText("Loaded Data");
  expect(element).toBeInTheDocument();
});

// Using queryClient utilities
it("handles query state", async () => {
  const { result } = renderHook(() => useQuery({ queryKey: ["test"], queryFn: () => Promise.resolve("data") }));
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
});
```

**Error Testing:**
```typescript
// Testing error states
it("handles API errors gracefully", async () => {
  vi.mock("#/server/get-treaty", () => ({
    getTreaty: () => ({
      get: vi.fn().mockRejectedValue(new Error("API Error")),
    }),
  }));
  
  render(<Component />);
  const errorMsg = await screen.findByText(/error/i);
  expect(errorMsg).toBeInTheDocument();
});

// Testing error boundaries
it("catches thrown errors", () => {
  expect(() => {
    render(<ErrorThrowingComponent />);
  }).toThrow();
});
```

**Component Variant Testing:**
```typescript
// Test multiple variants (common for Button component)
describe.each([
  ["default"],
  ["outline"],
  ["destructive"],
  ["ghost"],
  ["link"],
])("Button variant=%s", (variant) => {
  it("renders correctly", () => {
    render(<Button variant={variant}>Click</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass(`variant-${variant}`);
  });
});
```

**Provider Setup in Tests:**
```typescript
// Factory for test providers matching src/providers.tsx
export const createTestProviders = (options?: ProviderOptions) => {
  const queryClient = new QueryClient();
  const router = createRouter({ routeTree, context: { queryClient } });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router}>
        <AuthUIProviderTanstack authClient={authClient} {...options}>
          {children}
        </AuthUIProviderTanstack>
      </RouterProvider>
    </QueryClientProvider>
  );
};
```

## Current State

**Tests Status:**
- No test files present in `src/`
- Vitest installed and ready
- Testing Library packages installed but unused
- Framework supports testing but coverage is 0%

**Setup Complete For:**
- ✅ Vitest test runner
- ✅ @testing-library/react for component testing
- ✅ @testing-library/dom for DOM queries
- ✅ jsdom environment

**Setup Pending:**
- ❌ Test files
- ❌ Coverage configuration
- ❌ E2E testing (Playwright/Cypress)
- ❌ Shared test utilities and fixtures
- ❌ CI integration for automated testing

## Recommended Testing Approach

Given the architecture:

1. **Start with unit tests:** Utility functions in `#/lib/` (auth, utils)
2. **Add component tests:** UI components in `#/components/ui/`
3. **Integration tests:** Route components with mock providers
4. **E2E tests:** Critical user flows (auth, navigation)

**Test Pyramid:**
```
      ⬠ E2E (5-10%)
     ⬠⬠⬠ Integration (20-30%)
   ⬠⬠⬠⬠⬠⬠⬠ Unit (60-75%)
```

---

*Testing analysis: 2026-03-30*
