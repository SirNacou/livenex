# Phase 1: Database Schema - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 01-database-schema
**Areas discussed:** Schema workflow

---

## Schema Workflow

| Option | Description | Selected |
|--------|-------------|----------|
| generate + migrate | Uses `drizzle-kit generate` to create SQL files in `./drizzle/`, then `drizzle-kit migrate` to apply them. Produces a permanent migration history required by Phase 10 auto-migration (`migrate(db, { migrationsFolder: './drizzle' })`). | ✓ |
| push (dev shortcut) | `drizzle-kit push` syncs schema directly to DB without generating migration files. Fast for early dev, but no migration history — Phase 10 auto-migration can't use `migrate()` without generated files. | |
| Push first, then switch | Use push now to iterate quickly, then generate + migrate once schema is settled before Phase 2. | |

**User's choice:** generate + migrate (Recommended)
**Notes:** DEPL-04 requires auto-migration on startup in Phase 10, which needs the generated migration files in `./drizzle/`. Using push would require a schema regeneration step before Phase 10.

---

## Agent's Discretion

- Column ordering within tables
- Primary key type (serial vs uuid)
- String column type (text vs varchar with length)
- Whether `updated_at` appears on all tables or just `monitors`

## Deferred Ideas

None.
