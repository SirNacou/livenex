# Phase 1: Database Schema - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Define all database tables, indexes, enums, and retention scaffolding before any app logic. Every subsequent phase builds on this foundation — no schema changes should be needed until a new capability is added in a later phase.

</domain>

<decisions>
## Implementation Decisions

### Schema Workflow
- **D-01:** Use `drizzle-kit generate` + `drizzle-kit migrate` (not `db:push`) as the canonical schema workflow. This produces SQL migration files in `./drizzle/` that Phase 10's auto-migration runner (`migrate(db, { migrationsFolder: './drizzle' })`) will consume. Never use `db:push` going forward — it produces no migration history and would break DEPL-04.

### Tables (All 5 Must Exist)
- **D-02:** Define all five tables in this phase: `monitors`, `check_results`, `incidents`, `notification_channels`, `monitor_notification_channels`. Notification tables are defined in Phase 1 even though the feature is implemented in Phase 7 — the schema must be complete so Phase 2+ foreign keys can reference them cleanly.

### Enums
- **D-03:** Define two Drizzle pgEnums: `monitorType` (`http`, `ping`) and `checkStatus` (`up`, `down`, `pending`). Enforced at DB level via PostgreSQL enum types — not just TypeScript.

### monitors Table
- **D-04:** Columns include: `id`, `name`, `type` (monitorType enum), `url` (nullable, HTTP only), `host` (nullable, ping only), `interval` (seconds, integer), `enabled` (boolean, default true), `show_on_status_page` (boolean, default true), `current_status` (checkStatus enum, default `pending`), `consecutive_failures` (integer, default 0), `last_alerted_at` (timestamp, nullable), `confirmation_threshold` (integer, default 2), `created_at`, `updated_at`.
- **D-05:** `confirmation_threshold` is added to `monitors` now (not deferred to Phase 2/4) — Phase 8's alert suppression logic depends on it and it is clearly a monitor-level config attribute.
- **D-06:** `show_on_status_page` boolean (default true) is added to `monitors` now per Phase 1 roadmap note — Phase 3 (STAT-05) needs it, and schema must precede the feature.

### check_results Table
- **D-07:** Columns: `id`, `monitor_id` (FK → monitors, ON DELETE CASCADE), `status` (checkStatus enum), `response_time_ms` (integer, nullable — null for failed/ping checks where timing is meaningless), `error_type` (varchar, nullable — values: `connection_refused`, `dns_error`, `timeout`, `wrong_status`, `icmp_failed`), `http_status_code` (integer, nullable — stored for HTTP monitors, useful for debugging non-200 responses in Phase 6), `checked_at` (timestamp, not null).
- **D-08:** Composite index on `(monitor_id, checked_at DESC)` — created from day one. At 100 monitors × 60s interval, this table grows ~144k rows/day; the index is painful to add after real data accumulates.

### incidents Table
- **D-09:** Columns: `id`, `monitor_id` (FK → monitors, ON DELETE CASCADE), `started_at` (timestamp, not null), `resolved_at` (timestamp, nullable — null means ongoing), `duration_seconds` (integer, nullable — computed on close, not via trigger).

### notification_channels Table
- **D-10:** Columns: `id`, `name`, `type` (varchar or enum: `discord`, `slack`), `webhook_url`, `created_at`.

### monitor_notification_channels Join Table
- **D-11:** Columns: `monitor_id` (FK → monitors, ON DELETE CASCADE), `notification_channel_id` (FK → notification_channels, ON DELETE CASCADE). Composite primary key on both columns.

### Seed Script
- **D-12:** A seed script (e.g., `src/db/seed.ts`) creates at least one HTTP monitor and one ping monitor for local development. Run via a `bun run db:seed` script (or similar). Uses `@faker-js/faker` (already installed) for realistic test names. The seed should be idempotent — safe to re-run without duplicating data.

### Retention
- **D-13:** No `retention_days` table or config column is added to the schema itself. The 90-day retention window is a hardcoded constant in the Phase 4 scheduler's daily cleanup job. If configurability is needed later, it can be an env var — the schema doesn't need a table for it.

### Agent's Discretion
- Column ordering within each table (functional groups vs. alphabetical)
- Whether to use `serial` / `uuid` for primary keys (either works — pick one and be consistent)
- Exact varchar lengths or use `text` type (Postgres text is fine for all string columns)
- Whether `updated_at` goes on all tables or just `monitors`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — MON-04 (store every check result), STAT-05 (show_on_status_page flag)
- `.planning/ROADMAP.md` §Phase 1 — implementation notes with CRITICAL callouts (composite index, persistent monitor state, retention, incident table design, pgEnums, STAT-05 column)

### Existing Codebase Files
- `src/db/schema.ts` — empty file, the target for all schema definitions
- `src/db/index.ts` — Drizzle instance (node-postgres driver, already wired)
- `drizzle.config.ts` — outputs migrations to `./drizzle/`, schema at `./src/db/schema.ts`
- `package.json` — `db:generate`, `db:migrate`, `db:push`, `db:studio` scripts already defined

### No external specs — requirements fully captured in decisions above and ROADMAP.md implementation notes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/index.ts`: Drizzle instance (`db`) exported and ready to import — schema.ts just needs to export tables and enums for this to work
- `@faker-js/faker` (already installed): Available for the seed script with no additional install
- `drizzle-orm` + `drizzle-kit` (already installed): Both ORM and migration tooling present, no setup needed
- `pg` driver (already installed): node-postgres driver matches the `drizzle('node-postgres')` import in `db/index.ts`

### Established Patterns
- Import alias `#/*` maps to `./src/*` — use `#/db/schema` not relative paths when importing schema from app code
- Named exports preferred (`export const monitorsTable = pgTable(...)`) — consistent with codebase conventions
- `drizzle-kit generate` → `drizzle-kit migrate` is the workflow (not push) per D-01

### Integration Points
- `src/db/schema.ts` → `src/db/index.ts` (already imported via `import * as schema from './schema.ts'`)
- `drizzle/` folder (to be created by first `db:generate` run) → consumed by Phase 10 auto-migration
- `src/env.ts` (uses `@t3-oss/env-core`) — `DATABASE_URL` is already used by `db/index.ts` but not yet validated in env.ts; Phase 1 may add it

</code_context>

<specifics>
## Specific Ideas

- `http_status_code` (integer, nullable) is worth capturing in `check_results` now — debugging unexpected 301/403/503 responses in Phase 6 charts is much easier with the raw code available
- `error_type` enum values defined for Phase 4's DNS error classification: `connection_refused`, `dns_error`, `timeout`, `wrong_status`, `icmp_failed`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-database-schema*
*Context gathered: 2026-03-31*
