# Livenex Architecture

This document defines the architectural layers, boundaries, and patterns for the Livenex system.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Caddy Reverse Proxy (:80/:443)           │
│  Routes / and page routes to Frontend (:3000 internal)     │
│  Routes /api/* to Backend (:3001 internal)                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼──────────┐
│  TanStack Start│   │  ElysiaJS Backend │
│  Frontend      │   │  API Server       │
│  (:3000)       │   │  (:3001)          │
└───────┬────────┘   └────────┬──────────┘
        │                     │
        │     ┌───────────────┘
        │     │
        └─────┼──────────────────────────┐
              │                          │
        ┌─────▼─────────────┐    ┌──────▼──────────┐
        │  PostgreSQL (DB)  │    │  Redis (Queue)  │
        │  Port: 5432       │    │  Port: 6379     │
        └───────────────────┘    └─────────────────┘
```

## Layers

### 1. Frontend Layer (TanStack Start)
**Location:** `/packages/frontend/src/`

**Responsibilities:**
- Render UI pages (dashboard, settings)
- Handle user interactions and form submissions
- Manage client-side state (React Context, hooks)
- Route between pages using TanStack Router
- Call backend API via relative URLs (`/api/*`)

**Key Files:**
- `routes/` - File-based routing (TanStack Start convention)
- `components/` - Reusable React components
- `lib/` - Client-side utilities and hooks
- `entry.tsx` - Application entry point

**Data Flow:**
1. User interacts with UI
2. Component calls `fetch('/api/...')`
3. Response received and state updated
4. Component re-renders with new data

**No CORS Configuration Needed:**
- Frontend and backend appear same-origin to browser (Caddy at :80/:443)
- All API calls are same-domain from browser perspective
- Backend can set httpOnly cookies for session management

### 2. Backend Layer (ElysiaJS)
**Location:** `/packages/backend/src/`

**Responsibilities:**
- Serve HTTP API endpoints (`/api/*`)
- Connect to PostgreSQL for data persistence
- Manage user authentication and sessions
- Validate and sanitize incoming data (Zod)
- Execute business logic (Phase 2+: monitor checks, incident evaluation)
- Queue jobs via BullMQ (Phase 3+: notifications, scheduled checks)

**Key Files:**
- `app.ts` - Main Elysia application, middleware, error handling
- `api/` - Route handlers organized by domain
- `lib/` - Backend utilities (db, errors, validation)
- `db/` - Database schema and migrations
- `types/` - Shared types with frontend
- `server/` - Middleware (auth, logging, rate limiting)

**Middleware Stack (in order):**
1. **Request Logging** - Log HTTP method, path, IP
2. **Authentication** - Extract user/API key from headers/cookies
3. **Rate Limiting** - Enforce API rate limits (Phase 2+)
4. **Response Wrapping** - Ensure all responses follow envelope pattern
5. **Error Handling** - Catch errors and format as API errors

**Response Envelope Pattern:**
All responses (success and error) follow this structure:
```typescript
// Success
{
  ok: true,
  data: <T>,
  timestamp: "2026-03-27T12:00:00Z"
}

// Error
{
  ok: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable message",
    details?: { /* context */ }
  },
  timestamp: "2026-03-27T12:00:00Z"
}
```

### 3. Database Layer (PostgreSQL + Drizzle ORM)
**Location:** `/packages/backend/src/db/`

**Responsibilities:**
- Store all application data (users, monitors, checks, incidents)
- Enforce data integrity via constraints and indexes
- Enable efficient queries via proper indexing

**Schema Patterns:**
- **Primary Keys:** UUID v4 generated on insert
- **Timestamps:** Every table has `created_at`, `updated_at`
- **Soft Deletes:** `deleted_at` column for logical deletion
- **Foreign Keys:** Enforce referential integrity
- **Indexes:** Created on frequently queried columns

**Migrations:**
- Managed via Drizzle Kit
- Version-controlled in `/src/db/migrations/`
- Applied via `npm run db:migrate` in backend

**Connection:**
- Pooled connections via `pg` library
- Configured via `DATABASE_URL` environment variable
- Instance exported from `src/lib/db.ts` for use in route handlers

### 4. Shared Layer (Types & Validation)
**Location:** `/packages/shared/src/`

**Responsibilities:**
- Define API response types
- Define data model types (User, Monitor, etc.)
- Provide validation schemas (Zod)
- Ensure type consistency between frontend and backend

**Exports:**
- `types.ts` - TypeScript interfaces and types
- `schemas.ts` - Zod validation schemas (Phase 2+)

**Usage:**
- Backend: `import { ApiResponse, User } from '@shared/types'`
- Frontend: `import { Monitor } from '@shared/types'`

## Request/Response Flow

### Authentication Request Flow
```
Browser → Caddy → ElysiaJS Backend
1. Frontend sends POST /api/auth/login with credentials
2. Backend validates credentials against users table
3. Backend generates session token
4. Backend sets httpOnly cookie with session token
5. Backend returns { ok: true, data: { user: {...} } }
6. Subsequent requests include cookie automatically (httpOnly)
7. Backend validates session from cookie, populates context
```

### API Request with Authentication
```
Browser → Caddy → ElysiaJS Backend
1. Frontend sends GET /api/monitors with session cookie
2. Caddy passes request to backend (cookie included)
3. Backend middleware extracts session from cookie
4. Middleware queries sessions table to validate
5. Middleware populates context with user data
6. Route handler accesses context.user
7. Route handler queries monitors table for that user
8. Response returned with { ok: true, data: [monitors] }
```

### Error Handling Flow
```
Backend Route Handler
1. Throw ValidationError("Email is required")
2. Error caught by global error middleware
3. Middleware checks if error is AppError subclass
4. Middleware formats error response
5. Response sent with status code and error envelope:
   { ok: false, error: { code: "VALIDATION_ERROR", ... } }
```

## Key Architectural Decisions

### D-01: Monorepo Structure
**Why:** Single repo makes coordination easier; shared package reduces duplication
**Trade-off:** Build and testing must be coordinated across packages

### D-02: Flat API Structure (no /api/v1)
**Why:** Simpler routing; versioning handled via request headers or migration planning
**Trade-off:** Versioning must be managed carefully; breaking changes require migration

### D-03: Response Envelope Pattern
**Why:** Consistent error handling across all endpoints; frontend knows structure
**Trade-off:** Every response has wrapper, slightly larger payloads

### D-04: Caddy Reverse Proxy
**Why:** Automatic HTTPS, simple configuration, handles same-domain routing
**Trade-off:** Extra hop in request chain (negligible for personal use)

### D-05: PostgreSQL + Drizzle ORM
**Why:** Type-safe migrations, excellent TypeScript support, durable storage
**Trade-off:** Not as fast as some NoSQL solutions (acceptable for monitoring workload)

### D-06: BullMQ for Job Scheduling
**Why:** Reliable job scheduling, built-in retries, Redis-backed persistence
**Trade-off:** Requires Redis instance (Phase 3+)

## Phase Integration Points

### Phase 1 (Private Access Foundation)
- Implements authentication via better-auth
- Backend serves login/logout endpoints
- Frontend shows login form and dashboard (after auth)
- Uses database layer, error handling, response envelopes from Phase 1.1

### Phase 2 (Monitor Management)
- Adds monitors table and API endpoints
- Implements health checks (phase 2.1)
- Uses shared patterns and layer boundaries from Phase 1.1
- Extends database schema with monitor-specific tables

### Phase 3 (Incident Management)
- Adds incident tracking and evaluation
- Implements alert notifications (phase 3.1)
- Extends API with incident endpoints
- Uses BullMQ for reliable job queuing

### Phase 4+ (Public Pages, Advanced Features)
- Builds on all previous layers
- Adds public status page routing
- Extends monitoring capabilities

## Error Handling

### Backend Error Classes
All defined in `/packages/backend/src/lib/errors.ts`:
- **AppError** - Base class for all application errors
- **ValidationError** - Input validation failure (400)
- **AuthenticationError** - Missing/invalid credentials (401)
- **AuthorizationError** - User lacks permissions (403)
- **NotFoundError** - Resource not found (404)
- **ConflictError** - Resource conflict (409)
- **InternalError** - Unexpected server error (500)

### Error Handling Pattern
```typescript
// Route handler
export const handlers = {
  get: async ({ params }) => {
    // Validate input
    if (!params.id) throw new ValidationError("ID is required");
    
    // Check permissions
    const monitor = await db.select().from(monitors)
      .where(eq(monitors.id, params.id));
    if (!monitor) throw new NotFoundError("Monitor not found");
    if (monitor.userId !== context.userId) {
            throw new AuthorizationError("Cannot access this monitor");
    }
    
    // Return success
    return { ok: true, data: monitor };
  }
};
```

### Frontend Error Handling
```typescript
// Component
try {
  const response = await fetch('/api/monitors');
  const data = await response.json();
  
  if (!data.ok) {
    // Handle error
    setError(data.error.message);
    return;
  }
  
  // Use data
  setMonitors(data.data);
} catch (err) {
  // Network or parse error
  setError("Failed to fetch monitors");
}
```

## Testing Strategy

### Backend Unit Tests
- Location: `src/__tests__/` or `.test.ts` suffix
- Framework: Vitest
- Test error classes, validation, database queries

### Backend Integration Tests
- Test route handlers with mocked database
- Test full request/response flow
- Test error handling middleware

### Frontend Component Tests
- Location: `src/__tests__/` or `.test.tsx` suffix
- Framework: Vitest + React Testing Library
- Test component rendering and interactions

### End-to-End Tests
- Framework: Playwright (Phase 2+)
- Test user flows: login → create monitor → view status

## Performance Considerations

### Database
- Index on frequently queried columns (user_id, email, created_at)
- Connection pooling via pg library
- N+1 query prevention via Drizzle joins

### Frontend
- Code-split routes (TanStack Start handles this)
- Lazy load components
- Cache API responses when appropriate

### Backend
- Minimal middleware overhead (only logging + auth in Phase 1)
- Efficient database queries
- Rate limiting to prevent abuse (Phase 2+)

## Security Patterns

### Authentication
- Passwords hashed via better-auth
- Sessions stored in database with expiry
- httpOnly cookies prevent XSS access

### API Keys
- Hashed before storage
- Rate limited per key (Phase 2+)
- Permissions scoped (Phase 2+)

### Input Validation
- Zod schemas validate all input
- Type safety via TypeScript strict mode
- SQL injection prevented via ORM query builders

### CORS & CSRF
- Not needed: same-domain architecture via Caddy
- No cross-origin requests: all APIs accessed via relative URLs
- Session validation via httpOnly cookies

## Deployment Architecture

### Local Development
```
docker-compose up
- Caddy (reverse proxy at :80)
- Frontend (TanStack Start at :3000)
- Backend (ElysiaJS at :3001)
- PostgreSQL (at :5432)
```

### Production (Kubernetes)
```
- Ingress controller (Caddy or Nginx)
- Frontend Deployment
- Backend Deployment
- PostgreSQL StatefulSet
- Redis Deployment (for job queue)
```

---

**Last updated:** 2026-03-27  
**Status:** Ready for Phase 1.1 execution
