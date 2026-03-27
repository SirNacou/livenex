# Phase 1 Implementation Plan - Task Dependency Chart

**Created:** 2026-03-27

---

## Visual Dependency Graph

```
WAVE 1: Foundation Setup
═══════════════════════════════════════════════════════════════
┌─────────────────────┐
│ 1-01: Project Init  │  npm install, TypeScript config
│ (2-3 hours)         │
└────────────┬────────┘
             │
    ┌────────┼────────┐
    │        │        │
┌───▼──┐ ┌──▼──┐ ┌──▼──────────┐
│ 1-02 │ │1-03 │ │ Ready: All  │
│ DB   │ │Env  │ │ dependencies│
│ (2h) │ │(1h) │ │ installed   │
└───┬──┘ └──┬──┘ └─────────────┘
    │       │
    └───┬───┘
        │
        ▼
WAVE 2: Backend Core (Left) & Frontend Core (Right)
═══════════════════════════════════════════════════════════════
  BACKEND PATH              FRONTEND PATH
  ────────────              ──────────────
┌──────────────┐          ┌───────────────┐
│ 2-01: Auth   │          │ 2-04: TS      │
│ Integration  │          │ Start Setup   │
│ (3 hours)    │          │ (3 hours)     │
└──────┬───────┘          └───────┬───────┘
       │                          │
    ┌──▼──┐                    ┌──▼──┐
    │2-02 │                    │2-05 │
    │DB   │                    │Login│
    │Migs │                    │Page │
    │(2h) │                    │(3h) │
    └──┬──┘                    └──┬──┘
       │                          │
    ┌──▼──┐                    ┌──▼──────┐
    │2-03 │                    │ 2-06    │
    │Auth │                    │Dashboard│
    │Routes                     │Skeleton │
    │(3h) │                    │  (2h)   │
    └──┬──┘                    └──┬──────┘
       │                          │
       └──────────────┬───────────┘
                      │
                      ▼
WAVE 3: API Key System
═══════════════════════════════════════════════════════════════
┌─────────────────────────┐
│ 3-01: API Key Gen &     │  Secret hashing, validation logic
│ Validation Logic        │
│ (2-3 hours)             │
└──────────────┬──────────┘
               │
    ┌──────────┤
    │          │
┌───▼────┐ ┌──▼─────┐
│ 3-02   │ │ 3-01   │
│ Routes │ │(cont)  │
│ (3h)   │ │        │
└───┬────┘ └────────┘
    │
    ▼
┌──────────────┐
│ 3-03: UI     │  List, create, regenerate, revoke dialogs
│ Page         │
│ (3 hours)    │
└──────┬───────┘
       │
       ▼
WAVE 4: Integration & Testing
═══════════════════════════════════════════════════════════════
   LEFT PATH                   RIGHT PATH
   ──────────                  ──────────
┌──────────────┐            ┌───────────────┐
│ 4-01: Auth   │            │ 4-03: Auth    │
│ Middleware   │            │ Tests         │
│ (2 hours)    │            │ (4 hours)     │
└──────┬───────┘            └───────┬───────┘
       │                           │
    ┌──▼──┐                     ┌──▼──┐
    │4-02 │                     │4-04 │
    │Errors                     │API  │
    │(2h) │                     │Tests│
    └──┬──┘                     │(3h) │
       │                        └──┬──┘
       └──────────────┬───────────┘
                      │
                      ▼
WAVE 5: Final Integration
═══════════════════════════════════════════════════════════════
┌──────────────┐
│ 5-01: E2E    │  Browser automation, full workflows
│ Tests        │
│ (3 hours)    │
└──────┬───────┘
       │
    ┌──▼──┐
    │5-02 │
    │Docs │
    │(2h) │
    └──┬──┘
       │
    ┌──▼──┐
    │5-03 │
    │Sec  │
    │Review
    │(2h) │
    └──────┘

✅ Phase 1 Complete
```

---

## Task Dependency Matrix

| Task | ID | Depends On | Feeds Into | Duration | Wave |
|------|-----|-----------|-----------|----------|------|
| Project Init | 1-01 | None | All | 2-3h | 1 |
| DB Schema | 1-02 | 1-01 | 2-01,2-02 | 2-3h | 1 |
| Env Config | 1-03 | 1-01 | 2-01,2-02 | 1-2h | 1 |
| better-auth | 2-01 | 1-02, 1-03 | 2-03, 3-02 | 3h | 2 |
| DB Migrate | 2-02 | 1-02, 1-03 | 2-01 | 2h | 2 |
| Auth Routes | 2-03 | 2-01, 2-02 | 4-01, 4-03 | 3h | 2 |
| TS Start | 2-04 | 1-01 | 2-05, 2-06 | 3h | 2 |
| Login Page | 2-05 | 2-04, 2-03 | 4-03 | 3h | 2 |
| Dashboard | 2-06 | 2-04, 2-03 | 4-01 | 2h | 2 |
| API Key Gen | 3-01 | 2-02 | 3-02 | 2-3h | 3 |
| API Key Routes | 3-02 | 2-03, 3-01 | 3-03, 4-04 | 3h | 3 |
| API Keys UI | 3-03 | 2-04, 3-02 | 4-01, 5-01 | 3h | 3 |
| Auth Middleware | 4-01 | 2-03, 3-03 | 5-01 | 2h | 4 |
| Error Handling | 4-02 | 2-03, 3-02 | 5-01 | 2h | 4 |
| Auth Tests | 4-03 | 2-03, 3-02 | 5-01 | 4h | 4 |
| API Key Tests | 4-04 | 3-02, 3-03 | 5-01 | 3h | 4 |
| E2E Tests | 5-01 | 4-01, 4-03, 4-04 | (verify) | 3h | 5 |
| Documentation | 5-02 | All | Phase 2 | 2h | 5 |
| Security Review | 5-03 | All | (approval) | 2h | 5 |

---

## Parallelization Opportunities

### Wave 2 (Best Parallelization)
- **Backend Path:** better-auth (2-01), DB Migration (2-02), Auth Routes (2-03)
- **Frontend Path:** TS Start (2-04), Login Page (2-05), Dashboard (2-06)
- **Time Saved:** ~3 hours (sequential: 13h, parallel: 10h)

### Wave 4 (Good Parallelization)
- **Integration Path:** Middleware (4-01), Error Handling (4-02)
- **Testing Path:** Auth Tests (4-03), API Key Tests (4-04)
- **Time Saved:** ~2 hours (sequential: 11h, parallel: 9h)

**Total Parallel Benefit:** ~5 hours saved when using two concurrent execution streams

---

## Critical Path Analysis

**Longest sequential path (33 hours total):**

```
1-01 (2h)
   ↓
1-02 (2h) + 1-03 (1h) = 3h
   ↓
2-01 (3h) + 2-02 (2h)
   ↓
2-03 (3h) + 2-04 (3h)
   ↓
3-01 (3h) + 3-02 (3h)
   ↓
3-03 (3h)
   ↓
4-01 (2h) + 4-03 (4h)
   ↓
5-01 (3h) + 5-02 (2h) + 5-03 (2h)
```

**Items that delay phase (critical path):**
1. Database schema (1-02) — 0 slack time
2. better-auth integration (2-01) — 0 slack time
3. API key schema (3-01) — 0 slack time
4. Auth tests (4-03) — 0 slack time
5. E2E tests (5-01) — 0 slack time

**Items with slack time (can delay without impacting phase):**
- Env config (1-03) — 1 hour slack
- DB migration (2-02) — 1 hour slack
- Frontend setup can be 2 hours slower without impact

---

## Resource Requirements

### Backend Developer
**Time commitment:** ~20 hours
- Wave 1: Setup (2-3h)
- Wave 2: better-auth, DB, routes (8h)
- Wave 3: API keys (6h)
- Wave 4: Testing, middleware (4h)
- Wave 5: Docs, security (2h)

### Frontend Developer
**Time commitment:** ~12 hours
- Wave 1: Setup (1h)
- Wave 2: TS Start, login, dashboard (8h)
- Wave 3: API keys UI (3h)
- Wave 4: Testing (2h)
- Wave 5: Docs (1h)

### Total Team Effort
**With single developer:** 33 hours (sequential execution)  
**With two developers:** ~25-27 hours (parallel execution, Wave 1-5)

---

## Task Execution Checklist

### Wave 1: Foundation
- [ ] 1-01: Project initialized, dependencies installed
- [ ] 1-02: Database schema created, migrations generated
- [ ] 1-03: Environment configured, validation working

### Wave 2: Core Systems
- [ ] 2-01: better-auth integrated, sessions working
- [ ] 2-02: Database connected, migrations applied
- [ ] 2-03: Auth endpoints (signin, logout, session) working
- [ ] 2-04: TanStack Start configured, components available
- [ ] 2-05: Login page functional, form submission works
- [ ] 2-06: Dashboard skeleton created, layout working

### Wave 3: API Keys
- [ ] 3-01: Key generation logic working, secrets hashed
- [ ] 3-02: All API key routes (CRUD) functional
- [ ] 3-03: API keys UI page created, dialogs working

### Wave 4: Integration & Testing
- [ ] 4-01: Auth middleware protecting private routes
- [ ] 4-02: Error handling consistent, user feedback clear
- [ ] 4-03: Auth tests passing (password, sessions, logout)
- [ ] 4-04: API key tests passing (creation, validation, revocation)

### Wave 5: Final Polish
- [ ] 5-01: E2E tests passing (all user scenarios)
- [ ] 5-02: Documentation complete (setup, auth, API keys)
- [ ] 5-03: Security review complete, hardening applied

---

## Decision Implementation Timeline

| Decision Group | Decisions | Wave(s) | Status |
|----------------|-----------|---------|--------|
| Authentication Strategy | D-01 through D-07 | Wave 2 (2-01, 2-05) | Sequential |
| Session Management | D-08 through D-17 | Wave 2 (2-01, 2-03) | With Auth |
| API Key System | D-18 through D-30 | Wave 3 (3-01, 3-02) | Sequential |
| Security Hardening | All decisions | Wave 5 (5-03) | Final pass |

---

## Estimated Schedule (Sequential Execution)

```
Week 1:
  Mon 3/27: Wave 1 (5-6h) → project setup, database schema
  Tue 3/28: Wave 2 (10-11h) → split: backend & frontend parallel
  Wed 3/29: Wave 3 (8-9h) → API key system

Week 2:
  Thu 3/30: Wave 4 (7-8h) → testing & integration
  Fri 3/31: Wave 5 (4-5h) → docs & security review

→ Phase 1 complete by end of Friday
→ Ready to start Phase 2 the following Monday
```

**With Parallel Execution (2 developers):**
```
Week 1:
  Mon 3/27: Wave 1 (5-6h, full team)
  Tue 3/28: Wave 2 (5-6h, both parallel)
  Wed 3/29: Wave 3 (6-7h, backend priority)
  Thu 3/30: Wave 4 (5-6h, both parallel)
  Fri 3/31: Wave 5 (3-4h, full team)

→ Phase 1 complete by Friday
```

---

**Chart Created:** 2026-03-27  
**For Detailed Tasks:** See `01-PLAN.md` (2035 lines)  
**For Quick Summary:** See `PLAN-SUMMARY.md` (266 lines)
