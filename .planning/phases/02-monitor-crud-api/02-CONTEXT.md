# Phase 2: Monitor CRUD API - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver all Elysia API endpoints for creating, reading, updating, deleting, and toggling monitors — the complete API surface the admin UI (Phase 3) will consume. No auth guard yet (that's Phase 3). No scheduler logic (that's Phase 4). No status/history queries (that's Phase 5).

</domain>

<decisions>
## Implementation Decisions

### API Organization
- **D-01:** Monitors API lives in `src/api/monitors.ts` as a standalone Elysia plugin — keeps `src/index.ts` as a minimal app entry point.
- **D-02:** The plugin mounts with `prefix: '/monitors'`, giving clean paths: `GET /api/monitors`, `POST /api/monitors`, `PUT /api/monitors/:id`, `PATCH /api/monitors/:id/toggle`, `DELETE /api/monitors/:id`.
- **D-03:** This plugin-per-domain pattern is the **established convention for all future phases** — Phase 5 gets `src/api/status.ts`, Phase 7 gets `src/api/notifications.ts`, etc. Each domain = its own plugin, all `.use()`-d into `src/index.ts`.

### Response Shape
- **D-04:** Success responses return the raw Drizzle DB row as JSON — no envelope wrapping. Eden treaty infers the response type from the return type, so the client gets full type safety.
- **D-05:** `POST /api/monitors` returns **201** with the full monitor row on create.
- **D-06:** `PUT /api/monitors/:id` and `PATCH /api/monitors/:id/toggle` return **200** with the updated monitor row.
- **D-07:** `GET /api/monitors` returns **200** with an array of all monitor rows.
- **D-08:** `GET /api/monitors/:id` returns **200** with a single monitor row, or **404** if not found.
- **D-09:** `DELETE /api/monitors/:id` returns **204 No Content** on success (no body).
- **D-10:** Error responses use `{ error: "message here" }` — flat, no per-field breakdown. HTTP status codes: 400 for validation, 404 for not-found, 500 for unexpected errors.

### Validation (from ROADMAP — locked)
- **D-11:** Discriminated union on `type` — HTTP monitors require `url`; ping monitors require `host`. Use Elysia's input schema (Elysia's `t` typebox) to enforce at the API boundary.
- **D-12:** Minimum interval of 10 seconds enforced via `t.Number({ minimum: 10 })`.
- **D-13:** Cascade deletes handle `check_results` and `incidents` cleanup automatically via the `ON DELETE CASCADE` FK constraints already in the schema — no multi-step delete in the handler.

### Scheduler Stubs (from ROADMAP — locked)
- **D-14:** Add no-op stub functions `scheduler.onMonitorCreated(id)`, `.onMonitorUpdated(id)`, `.onMonitorDeleted(id)`, `.onMonitorToggled(id)` — called from CRUD handlers so Phase 4 only needs to implement the body, not scatter-patch call sites.
- **D-15:** Stub module lives at `src/scheduler.ts` — exports the stub object. Phase 4 replaces the stub implementations.

### Auth (from ROADMAP — locked)
- **D-16:** No auth gate on the monitors API in this phase. The Elysia auth guard is applied at the router/middleware level in Phase 3.

### Agent's Discretion
- Exact Elysia plugin wiring syntax (`.use()` vs `.group()`) — agent chooses the idiomatic approach.
- Whether `GET /api/monitors` returns all fields or applies any default ordering (e.g., `ORDER BY created_at DESC`) — agent can decide what makes sense.
- How to handle `PUT` vs full-row replace vs partial update — agent may use `PATCH` semantics even on `PUT /api/monitors/:id` since replacing `currentStatus`/`consecutiveFailures` from the client side would be destructive.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema
- `src/db/schema.ts` — Full monitors table definition with all columns (`id`, `name`, `type`, `url`, `host`, `interval`, `enabled`, `showOnStatusPage`, `currentStatus`, `consecutiveFailures`, `lastAlertedAt`, `confirmationThreshold`, `createdAt`, `updatedAt`). Discriminated union types live here.

### Elysia App Entry Point
- `src/index.ts` — Current bare Elysia app with `/api` prefix. Monitors plugin gets `.use()`-d here.

### API Route Handler
- `src/routes/api/$.ts` — Catch-all wildcard that forwards all HTTP methods to the Elysia app. No changes needed here.

### Eden Treaty Client
- `src/server/get-treaty.ts` — Isomorphic treaty client. Phase 3 UI will call the monitors endpoints through this.

### DB Client
- `src/db/index.ts` — Drizzle `db` singleton. Import this in the monitors plugin.

### Roadmap Phase Detail
- `.planning/ROADMAP.md` §Phase 2 — Contains key implementation notes: cascade delete strategy, interval validation, discriminated union validation, scheduler stub interface.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/index.ts` (`db` export): Import directly in `src/api/monitors.ts` for all queries.
- `src/db/schema.ts` (`monitorsTable`, `monitorType` enum, `checkStatus` enum): Use for Drizzle queries and type inference.
- `src/server/get-treaty.ts`: Eden treaty already wired up — once monitors endpoints exist, the client can call them immediately.

### Established Patterns
- Elysia app has `/api` prefix defined in `src/index.ts` — the monitors plugin's `/monitors` prefix stacks on top to produce `/api/monitors/...` paths.
- The wildcard `src/routes/api/$.ts` catches all routes and forwards to `app.fetch()` — no TanStack Start route files needed for individual API endpoints.
- `src/db/index.ts` uses `drizzle(process.env.DATABASE_URL!)` with the full merged schema — import `db` and `schema` exports separately.

### Integration Points
- `src/index.ts`: Add `.use(monitorsPlugin)` after creating the Elysia app.
- `src/scheduler.ts` (new): Stub module created here, called from `src/api/monitors.ts` handlers.
- Phase 3 will consume these endpoints via `getTreaty()` calls in TanStack Start route loaders.

</code_context>

<specifics>
## Specific Ideas

- The `src/api/` directory is a new top-level directory under `src/` — consistent with how one would naturally separate API plugins from routes.
- Future phases: `src/api/status.ts` (Phase 5), `src/api/notifications.ts` (Phase 7), `src/api/status-page.ts` (Phase 9).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-monitor-crud-api*
*Context gathered: 2026-04-01*
