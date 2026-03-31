# Phase 2: Monitor CRUD API - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 02-monitor-crud-api
**Areas discussed:** API organization, Response shape

---

## API Organization

| Option | Description | Selected |
|--------|-------------|----------|
| src/api/monitors.ts plugin | Elysia plugin, .use()-d into index.ts — keeps entry point minimal | ✓ |
| Inline in src/index.ts | All routes inline, simpler but gets messy as more route groups are added | |
| src/routes/api/monitors.ts | Parallel to existing src/routes/api/$.ts catch-all | |

**User's choice:** `src/api/monitors.ts` as a standalone Elysia plugin

---

| Option | Description | Selected |
|--------|-------------|----------|
| /api/monitors (prefixed plugin) | `prefix: '/monitors'` on the plugin → clean /api/monitors/... paths | ✓ |
| Manual paths in index.ts | Write full path in each route definition manually | |

**User's choice:** `/api/monitors` prefixed plugin

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, each domain = own plugin | Future phases each get their own plugin file (src/api/status.ts, etc.) | ✓ |
| No, all in index.ts for now | Grow index.ts until the need is obvious | |

**User's choice:** Plugin-per-domain is the established pattern for all future phases

---

## Response Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Return DB row directly | Raw Drizzle row as JSON, Eden treaty infers types | ✓ |
| Envelope-wrapped { data, meta } | Useful for pagination but adds overhead | |
| Curated subset of fields | Hand-picked fields, not the full row | |

**User's choice:** Return raw DB row directly on success (201 on create)

---

| Option | Description | Selected |
|--------|-------------|----------|
| { error: "message" } | Flat, simple, easy for client to read | ✓ |
| { errors: [{ field, message }] } | Per-field structured errors for form display | |
| Plain string body | Minimal, hard to parse on client | |

**User's choice:** `{ error: "message here" }` for all error responses

---

| Option | Description | Selected |
|--------|-------------|----------|
| 204 No Content | Conventional for DELETE, client checks status code | ✓ |
| 200 with body | Return { success: true } or the deleted row | |

**User's choice:** 204 No Content on successful DELETE

---

## Agent's Discretion

- Exact Elysia plugin wiring syntax (`.use()` vs `.group()`)
- Default ordering for `GET /api/monitors` list
- Whether `PUT /api/monitors/:id` should guard against overwriting runtime fields (`currentStatus`, `consecutiveFailures`)

## Deferred Ideas

None
