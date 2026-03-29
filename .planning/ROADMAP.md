# Roadmap: Livenex

## Overview

Livenex reaches v1 by first securing private access, then making monitor setup fast and manageable, then establishing trustworthy monitor-state evaluation, then layering incident and alert correctness on top, and finally exposing selected public status pages and uptime reporting from that trusted internal truth.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Private Access Foundation** - Secure the private-by-default dashboard and automation entry points.
- [ ] **Phase 2: Monitor Setup And Organization** - Let the user create, manage, and organize monitors quickly from one dashboard.
- [ ] **Phase 3: State Evaluation And Reliability Signals** - Turn raw checks into trustworthy monitor states, including confirmation and no-data handling.
- [ ] **Phase 4: Incidents, Notifications, And Maintenance** - Open and resolve incidents correctly, notify once per incident, and suppress planned noise.
- [ ] **Phase 5: Public Status And Uptime Reporting** - Share selected status externally and show reliable uptime summaries internally.

## Phase Details

### Phase 1: Private Access Foundation
**Goal**: Users can securely access the private dashboard and keep all monitoring data private by default while enabling automation through API keys.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, STAT-01
**Success Criteria** (what must be TRUE):
  1. User can sign in to the private dashboard with the single-user account.
  2. User can create, view, and revoke API keys for automation without exposing the rest of the dashboard publicly.
  3. Unauthenticated visitors cannot access private monitoring data or dashboard views.
**Plans**: TBD
**UI hint**: yes

### Phase 01.1: Project Structure & Organization (INSERTED)

**Goal:** Establish architectural foundation with project structure, database schema patterns, API route organization, naming conventions, and error handling for all downstream phases.

**Requirements**: None (foundational infrastructure, no user-facing requirements)

**Depends on:** Phase 1 (context from decisions)

**Plans:** 1 plan completed

Plans:
- [x] 01.1-01-PLAN.md — Project structure, database foundation, API envelope patterns, naming conventions

**Status:** Complete — ready for Phase 1 implementation

**Key deliverables:**
- Directory structure following TanStack Start + ElysiaJS conventions
- Database schema foundation (users, sessions, api_keys, audit_logs)
- API response envelope pattern (ApiResponse<T> | ApiError)
- Error handling hierarchy
- Naming conventions documentation
- Route and schema pattern templates for Phase 2+

### Phase 2: Monitor Setup And Organization
**Goal**: Users can create and manage the supported monitor types quickly from one private dashboard and keep them organized with simple tags/groups.
**Depends on**: Phase 1
**Requirements**: MON-01, MON-02, MON-03, MON-04, MON-05, MON-06, MON-07, RPT-02, RPT-03
**Success Criteria** (what must be TRUE):
  1. User can create HTTP, API, content, SSL expiry, and heartbeat monitors with the required per-type settings.
  2. User can edit, pause, resume, and delete any monitor from the dashboard.
  3. User can assign tags/groups to monitors and manage 20 to 50 monitors from the same dashboard without needing projects or environments.
  4. User can add a monitor and attach a notification channel using defaults in under 60 seconds.
**Plans**: TBD
**UI hint**: yes

### Phase 3: State Evaluation And Reliability Signals
**Goal**: Users can trust the monitor state shown in the dashboard because failures are confirmed correctly, heartbeat lateness is handled explicitly, and blind spots surface as `no_data`.
**Depends on**: Phase 2
**Requirements**: MON-08, RELY-01, RELY-02, RELY-03, RELY-04
**Success Criteria** (what must be TRUE):
  1. User can see each monitor move between `up`, `down`, `degraded`, `paused`, `maintenance`, and `no_data` based on actual monitoring conditions.
  2. User sees a monitor marked down only after the configured retry or confirmation threshold is met.
  3. User sees a heartbeat monitor marked down when expected pings stop arriving beyond its grace period.
  4. User can see `no_data` when checks stop arriving so worker or checker failures are visible instead of silently looking healthy.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Incidents, Notifications, And Maintenance
**Goal**: Users get one trustworthy incident lifecycle per confirmed outage, receive one down/resolved alert pair, and avoid alert noise during scheduled maintenance.
**Depends on**: Phase 3
**Requirements**: ALRT-01, ALRT-02, ALRT-03, ALRT-04, ALRT-05, INC-01, INC-02, INC-03, INC-04, INC-05
**Success Criteria** (what must be TRUE):
  1. User can create and test notification channels for email, Telegram, Discord, `ntfy`, and `Apprise`.
  2. A confirmed outage automatically creates one incident with visible start time, affected monitor, current status, and eventual resolution time.
  3. User receives exactly one `Down` alert when an incident begins and exactly one `Resolved` alert when it ends, with no repeat reminder alerts while it stays open.
  4. User can schedule maintenance for selected monitors or groups, and those monitors do not send outage alerts during the active maintenance window.
  5. User can distinguish scheduled maintenance from unplanned incidents in the private dashboard.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Public Status And Uptime Reporting
**Goal**: Users can selectively publish trusted status information and review uptime summaries built from the same incident and monitor-state truth used internally.
**Depends on**: Phase 4
**Requirements**: STAT-02, STAT-03, STAT-04, STAT-05, RPT-01
**Success Criteria** (what must be TRUE):
  1. User can create multiple public shareable status pages from selected tags/groups and choose which monitors appear on each page.
  2. A public status page shows current component status and incident history for the monitors assigned to it.
  3. Scheduled maintenance appears on affected public status pages separately from unplanned incidents.
  4. User can see uptime percentages for each monitor across the last 24 hours, 7 days, and 30 days.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1.1 → 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1.1 Project Structure | 1/1 | Complete | ✓ 2026-03-27 |
| 1. Private Access Foundation | 0/TBD | Not started | - |
| 2. Monitor Setup And Organization | 0/TBD | Not started | - |
| 3. State Evaluation And Reliability Signals | 0/TBD | Not started | - |
| 4. Incidents, Notifications, And Maintenance | 0/TBD | Not started | - |
| 5. Public Status And Uptime Reporting | 0/TBD | Not started | - |

## Backlog

### Phase 999.1: File-Based Monitor Configuration Like Gatus (BACKLOG)

**Goal:** [Captured for future planning]

**Description:** Allow saving and loading monitor configurations from files (like Gatus) so that if anything breaks, the configuration file can be preserved and used to auto-create monitors. This would enable two ways to create monitors: UI + file config.

**Requirements:** TBD

**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)
