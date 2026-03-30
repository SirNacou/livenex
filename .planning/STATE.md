# Project State

## Current Phase

Phase 1: Database Schema
Status: Not Started
Goal: Define all tables, indexes, enums, and retention scaffolding so every subsequent phase builds on a correct, permanent foundation.

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-30)

**Core value:** A single place to know what is up/down in the home lab, with alerts that fire before you notice manually.
**Current focus:** Phase 1

## Phase Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Database Schema | Not Started |
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
| Persistent monitor state (current_status, consecutive_failures) on DB | Phase 1 | Prevents duplicate DOWN alerts on container restart |
| Composite index on (monitor_id, checked_at DESC) | Phase 1 | Required from day one — table grows 144k rows/day at 100 monitors × 60s; expensive to add after real data |
| DNS error classification (dns_error type, no alert fired) | Phase 4 | Docker internal DNS flaps (EAI_AGAIN) would otherwise spam alerts |
| Separate /api/status-page endpoint (not reusing admin endpoint) | Phase 9 | Admin endpoint returns URLs/IPs that must never appear on public page |
| /status routes explicitly excluded from Better Auth middleware | Phase 9 | Public page must be accessible without login |
| cap_add: [NET_RAW] in docker-compose.yml | Phase 10 | ICMP ping silently always returns "up" in Docker without this capability |

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

Last action: ROADMAP.md and STATE.md initialized
Next action: Begin Phase 1 planning with /gsd-plan-phase 1
