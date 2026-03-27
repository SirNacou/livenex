# Livenex Conventions

This document establishes naming conventions and patterns for the Livenex codebase across database, backend, and frontend layers.

## Database Naming Conventions

### Tables
- **Naming:** `snake_case` (lowercase with underscores)
- **Pluralization:** Use plural form (e.g., `users`, `api_keys`, `audit_logs`)
- **Example:** `users`, `sessions`, `api_keys`, `monitors`, `check_results`

### Columns
- **Naming:** `snake_case` (lowercase with underscores)
- **Standard Columns:** Every table includes:
  - `id` (UUID primary key)
  - `created_at` (timestamp with timezone)
  - `updated_at` (timestamp with timezone, auto-updated)
  - `deleted_at` (timestamp with timezone, nullable, for soft deletes)
- **Foreign Keys:** Use pattern `{table_singular}_id` (e.g., `user_id`, `monitor_id`)
- **Examples:**
  - `users.id`, `users.email`, `users.created_at`
  - `monitors.id`, `monitors.user_id`, `monitors.name`
  - `check_results.id`, `check_results.monitor_id`, `check_results.status_code`

### Indexes
- **Naming:** `{table}_{column(s)}_idx`
- **Examples:**
  - `users_email_idx` for unique email index
  - `monitors_user_id_idx` for foreign key index
  - `audit_logs_created_at_idx` for range queries

## Backend (ElysiaJS) Conventions

### Files & Directories
- **File naming:** `kebab-case` (lowercase with hyphens) for endpoints, utilities
  - Exception: Database schema files use file naming convention from Drizzle ORM
- **Directory structure:**
  - `/src/api/` - API route files organized by domain
  - `/src/lib/` - Shared utilities (db, errors, validation)
  - `/src/db/` - Database schema and migrations
  - `/src/types/` - Shared TypeScript types
  - `/src/server/` - Middleware, context builders
  - `/src/constants/` - Application-wide constants
- **Examples:**
  - `src/api/monitors.ts` (endpoints for monitors)
  - `src/api/api-keys.ts` (endpoints for API keys)
  - `src/lib/errors.ts` (error classes)
  - `src/lib/validation.ts` (Zod validators)

### Code Naming
- **Variables, Functions, Methods:** `camelCase`
- **Classes:** `PascalCase` (e.g., `ValidationError`, `AuthenticationError`)
- **Constants:** `UPPER_SNAKE_CASE` only for truly global, immutable values
- **Examples:**
  - `const dbUrl = process.env.DATABASE_URL`
  - `function validateEmail(email: string) { }`
  - `class NotFoundError extends AppError { }`

### API Naming
- **Routes:** Flat structure with resource names in plural
  - `/api/monitors` (list monitors, create monitor)
  - `/api/monitors/{id}` (get, update, delete specific monitor)
  - `/api/api-keys` (manage API keys)
  - `/api/health` (health checks)
- **HTTP Methods:** RESTful conventions
  - `GET /api/monitors` - List all monitors
  - `POST /api/monitors` - Create monitor
  - `GET /api/monitors/{id}` - Get specific monitor
  - `PUT /api/monitors/{id}` - Update monitor
  - `DELETE /api/monitors/{id}` - Delete monitor
- **Response Envelope:** All responses follow this pattern:
  ```json
  {
    "ok": true,
    "data": { /* ... */ },
    "timestamp": "2026-03-27T12:00:00Z"
  }
  ```
- **Error Responses:** 
  ```json
  {
    "ok": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Email is required",
      "details": { /* optional */ }
    },
    "timestamp": "2026-03-27T12:00:00Z"
  }
  ```

### Error Codes
- `VALIDATION_ERROR` - Input validation failure (400)
- `UNAUTHORIZED` - Authentication required (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource already exists or conflict (409)
- `INTERNAL_ERROR` - Server error (500)

## Frontend (React/TanStack Start) Conventions

### File & Directory Structure
- **Route files:** `kebab-case.tsx` in `/src/routes/`
- **Components:** `PascalCase.tsx` in `/src/components/`
- **Utilities:** `kebab-case.ts` in `/src/lib/`
- **Styles:** `kebab-case.module.css` or inline Tailwind
- **Examples:**
  - `src/routes/__root.tsx` - Root layout
  - `src/routes/dashboard.tsx` - Dashboard page
  - `src/routes/monitors/index.tsx` - Monitors list
  - `src/routes/monitors/$id/index.tsx` - Monitor detail
  - `src/components/MonitorCard.tsx`
  - `src/components/AlertDialog.tsx`

### Component Naming
- **Components:** `PascalCase` (React convention)
- **Hooks:** `useXxx` pattern
- **Examples:**
  - `MonitorCard`, `AlertDialog`, `Header`, `Sidebar`
  - `useMonitors()`, `useAuthContext()`, `useApi()`

### Code Naming
- **Variables, Functions:** `camelCase`
- **Types, Interfaces:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE` only for global immutables
- **Examples:**
  - `const [monitors, setMonitors] = useState([])`
  - `const handleDelete = (id: string) => { }`
  - `type MonitorStatus = 'up' | 'down' | 'degraded'`
  - `interface Monitor { id: string; name: string }`

### API Calls
- **Client-side API:** Use relative paths (Caddy handles routing)
  ```typescript
  const response = await fetch('/api/monitors');
  const response = await fetch('/api/monitors/{id}');
  ```
- **Avoid:** Hardcoded domain names or environment-specific URLs in client code
- **Shared types:** Import from `@shared/types` for API response types

## Shared (Packages/Shared) Conventions

### Type Naming
- **Interfaces & Types:** `PascalCase`
- **Imports:** Use `import type` for type-only imports
- **Examples:**
  - `type ApiResponse<T> = { ok: true; data: T; timestamp: string }`
  - `interface User { id: string; email: string }`
  - `type MonitorStatus = 'up' | 'down'`

### Validation Schemas
- **Zod Schemas:** Use simple variable names, often matching types they validate
- **Pattern:** Create schema near usage, or in `/src/schemas.ts` if shared
- **Examples:**
  ```typescript
  const createMonitorSchema = z.object({
    name: z.string().min(1),
    url: z.string().url(),
  });
  ```

## Consistency Rules

1. **Imports:** Always use ESM syntax (`import ... from`)
2. **Async/Await:** Prefer async/await over `.then()` chains
3. **Null Handling:** Use explicit null checks; avoid falsy coercion
4. **Type Safety:** Always use TypeScript strict mode; no `any` types without justification
5. **Error Handling:** Throw `AppError` subclasses in backend; handle gracefully in frontend
6. **Comments:** Document _why_, not _what_; code should be self-documenting
7. **Testing:** Match file names with `.test.ts` or `.spec.ts` suffix

## Summary

| Layer       | Files                 | Code       | Database       |
| ----------- | --------------------- | ---------- | -------------- |
| Backend     | kebab-case            | camelCase  | snake_case     |
| Frontend    | kebab-case (routes)   | camelCase  | N/A            |
| Components  | PascalCase            | camelCase  | N/A            |
| Shared      | kebab-case            | camelCase  | N/A            |
| Types       | N/A                   | PascalCase | N/A            |

This ensures consistency across the codebase and reduces cognitive load when switching between layers.
