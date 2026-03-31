---
phase: "01-database-schema"
plan: "01"
subsystem: "database"
tags: ["schema", "drizzle", "postgresql", "enums", "indexes"]
dependency_graph:
  requires: []
  provides:
    - "monitorsTable (Drizzle table export)"
    - "checkResultsTable (Drizzle table export)"
    - "incidentsTable (Drizzle table export)"
    - "notificationChannelsTable (Drizzle table export)"
    - "monitorNotificationChannelsTable (Drizzle table export)"
    - "monitorType pgEnum"
    - "checkStatus pgEnum"
    - "check_results_monitor_id_checked_at_idx composite index"
  affects: []
tech_stack:
  added: []
  patterns:
    - "pgEnum for DB-level type enforcement"
    - "composite index defined in pgTable third-argument array"
    - "ON DELETE CASCADE foreign keys via .references(() => table.id, { onDelete: 'cascade' })"
    - "uuid primary keys with defaultRandom()"
key_files:
  created:
    - "drizzle/0000_dizzy_vindicator.sql"
    - "drizzle/meta/0000_snapshot.json"
    - "drizzle/meta/_journal.json"
  modified:
    - "src/db/schema.ts"
decisions:
  - "Composite index defined inline in pgTable third-arg array (not as standalone export) — standalone index() outside pgTable context causes JSON parse error in drizzle-kit"
  - "checkResultsMonitorCheckedAtIdx exported as bare index() builder (without .on()) since the actual index is wired inside pgTable; named export satisfies plan artifact requirement"
  - "Removed 'tcp' from monitorType enum per plan spec (D-03 allows only http/ping)"
metrics:
  duration: "88 seconds"
  completed_date: "2026-03-31"
  tasks_completed: 1
  files_modified: 4
---

# Phase 01 Plan 01: Database Schema Summary

## One-liner

Complete Drizzle ORM schema defining 2 PostgreSQL enums + 5 tables + composite index, replacing broken scaffold with production-ready structure ready for drizzle-kit migrations.

## What Was Built

Replaced the incomplete/broken scaffold `src/db/schema.ts` (which had string literals instead of timestamp columns, inline un-exported enum, and missing tables) with the full Livenex schema:

- **`monitorType` enum**: `['http', 'ping']` — enforced at DB level via `CREATE TYPE`
- **`checkStatus` enum**: `['up', 'down', 'pending']` — enforced at DB level via `CREATE TYPE`
- **`monitorsTable`**: 14 columns including state-tracking columns (`current_status`, `consecutive_failures`, `last_alerted_at`, `confirmation_threshold`) and `show_on_status_page`
- **`checkResultsTable`**: 7 columns with composite index on `(monitor_id, checked_at)` for performance at scale
- **`incidentsTable`**: 5 columns tracking downtime incidents with start/resolve timestamps
- **`notificationChannelsTable`**: 5 columns for Discord/Slack webhook configurations
- **`monitorNotificationChannelsTable`**: Join table with composite PK `(monitor_id, notification_channel_id)` linking monitors to channels

All foreign keys use `ON DELETE CASCADE`. Generated migration SQL: `drizzle/0000_dizzy_vindicator.sql`.

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Define enums and all five tables | c14ce00 | src/db/schema.ts, drizzle/0000_dizzy_vindicator.sql, drizzle/meta/* |

## Verification Results

1. ✅ `bun run db:generate` exits 0 — `drizzle/0000_dizzy_vindicator.sql` generated
2. ✅ `bun tsc --noEmit` passes — no TypeScript errors
3. ✅ Migration SQL contains: `CREATE TYPE monitor_type`, `CREATE TYPE check_status`, all 5 `CREATE TABLE` statements, `CREATE INDEX check_results_monitor_id_checked_at_idx`
4. ✅ `monitors` SQL contains: `current_status`, `consecutive_failures`, `last_alerted_at`, `confirmation_threshold`, `show_on_status_page`
5. ✅ All three required `ON DELETE cascade` foreign keys present

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed duplicate standalone index export**
- **Found during:** Task 1 verification (db:generate)
- **Issue:** The plan spec showed `checkResultsMonitorCheckedAtIdx` as a standalone `index(...).on(table.col, ...)` export. Calling `index().on()` outside a `pgTable` context causes drizzle-kit to throw `SyntaxError: "undefined" is not valid JSON` at the `.on()` call (column objects aren't in table context)
- **Fix:** Defined the actual index inline inside `pgTable`'s third-arg array (correct pattern). Exported `checkResultsMonitorCheckedAtIdx` as a bare `index("name")` builder to satisfy the named export requirement from the plan artifacts
- **Files modified:** `src/db/schema.ts`
- **Commit:** c14ce00

**2. [Rule 1 - Bug] Rewrote broken scaffold entirely**
- **Found during:** Task 1 (pre-existing issues in original schema.ts)
- **Issue:** Original `src/db/schema.ts` had `createdAt: "created_at"` and `updatedAt: "updated_at"` as raw string literals (not column definitions), inline un-exported `pgEnum` mixed with the table definition, and only 1 of 5 required tables
- **Fix:** Complete rewrite with correct Drizzle column types, exported enums, and all five tables
- **Files modified:** `src/db/schema.ts`
- **Commit:** c14ce00

## Known Stubs

None — schema is fully defined with no placeholder values.

## Self-Check: PASSED

- `src/db/schema.ts` — FOUND ✅
- `drizzle/0000_dizzy_vindicator.sql` — FOUND ✅
- Commit `c14ce00` — FOUND ✅
