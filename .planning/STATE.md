---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-04-01T00:00:00.000Z"
progress:
  total_phases: 10
  completed_phases: 1
  total_plans: 2
  completed_plans: 2
---

# Project State

## Current Phase

Phase 2: Monitor CRUD API
Status: Phase 01 Complete — Ready to begin Phase 02
Goal: All API endpoints for creating, reading, updating, and deleting monitors exist and return correctly typed responses, ready for the admin UI to consume.

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** A single place to know what is up/down in the home lab, with alerts that fire before you notice manually.
**Current focus:** Phase 02 — monitor-crud-api

## Phase Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Database Schema | ✅ Complete (both plans) |
| 2 | Monitor CRUD API | Not Started |
| 3 | Admin Dashboard Shell | Not Started |
| 4 | Monitor Scheduler | Not Started |
| 5 | Live Status & History API | Not Started |
| 6 | Charts & Incident History UI | Not Started |
| 7 | Notification Channels | Not Started |
| 8 | Alert Dispatching | Not Started |
| 9 | Public Status Page | Not Started |
| 10 | Deployment | Not Started |

## Accumulated Context

### Key Decisions

| Decision | Phase | Rationale |
|----------|-------|-----------|
| schedule-after-complete (setTimeout in finally) | Phase 4 | Prevents timer pileup — setInterval stacks concurrent checks when checks exceed the interval |
| Composite index defined inline in pgTable third-arg array (not standalone) | Phase 1 | standalone index().on() outside table context causes JSON parse error in drizzle-kit |
| Persistent monitor state (current_status, consecutive_failures) on DB | Phase 1 | Prevents duplicate DOWN alerts on container restart |
| Composite index on (monitor_id, checked_at DESC) | Phase 1 | Required from day one — table grows 144k rows/day at 100 monitors × 60s; expensive to add after real data |
| DNS error classification (dns_error type, no alert fired) | Phase 4 | Docker internal DNS flaps (EAI_AGAIN) would otherwise spam alerts |
| Separate /api/status-page endpoint (not reusing admin endpoint) | Phase 9 | Admin endpoint returns URLs/IPs that must never appear on public page |
| /status routes explicitly excluded from Better Auth middleware | Phase 9 | Public page must be accessible without login |
| cap_add: [NET_RAW] in docker-compose.yml | Phase 10 | ICMP ping silently always returns "up" in Docker without this capability |
| uuidv7 npm package not randomUUIDv7 from 'bun' | Phase 1 | drizzle-kit runs under Node.js — Bun-specific module imports cause MODULE_NOT_FOUND at generate time; uuidv7 npm package is cross-runtime and preserves v7 time-ordering |
| Relative imports in src/db/*.ts Bun scripts | Phase 1 | moduleResolution: bundler is a TypeScript hint only; Bun runtime in Docker does not resolve #/ alias |

### Pitfalls to Watch

- Timer pileup: NEVER use setInterval for monitor check loops — use setTimeout rescheduled in finally block
- Duplicate alerts on restart: load current_status from DB before starting any check loop
- Alert storm: notification fires ONLY on state transition (UP→DOWN, DOWN→UP), not on every failed check
- ICMP ping in Docker: requires NET_RAW cap_add; add startup probe that logs clear warning if EPERM
- Public status page: test with incognito window to confirm no auth redirect on /status
- Unbounded DB growth: daily retention DELETE job (90-day window) must be built into Phase 4 scheduler

### Notes

Initialized 2026-03-31
Roadmap: 10 phases, fine granularity
Coverage: 26/26 v1 requirements mapped

## Session Continuity

Last action: Completed Phase 01-02 — migrations verified in Docker, seed runs idempotently, all 5 tables live (commits 66a3008, e6e7912, d7595d5)
Next action: Begin Phase 02 — Monitor CRUD API (Elysia endpoints for create/read/update/delete monitors)
