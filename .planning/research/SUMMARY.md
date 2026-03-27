# Project Research Summary

**Project:** Livenex
**Domain:** Personal uptime monitoring, alerting, and status-page application
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

Livenex is a worker-first monitoring product wrapped in a web app. The research is consistent on the core shape: build a private dashboard plus optional public status pages on top of a durable monitoring pipeline composed of monitor config, leased scheduling, background check execution, an explicit incident state machine, and asynchronous notification delivery. The recommended v1 is a modular monolith with one Next.js app, one long-lived Node worker, PostgreSQL as the system of record, and Redis plus BullMQ for scheduling, retries, and dispatch coordination.

The strongest recommendation is to optimize for trust, not breadth. Launch with HTTP/API, keyword, SSL, and heartbeat monitors; confirmed-failure alerting; automatic incidents; maintenance windows; uptime summaries; and tag/group-based status pages. Defer enterprise and analytics sprawl. The product wins if it produces one real outage incident with one down/resolved pair, stays quiet during maintenance, and remains understandable for a single operator managing 20 to 50 monitors.

The main risks are also clear across the research: false positives from single-check failures, duplicated or flapping incidents without a state machine, silent blindness when the worker or scheduler dies, and mathematically dishonest uptime reporting. Mitigation is architectural, not cosmetic: separate probe execution from incident evaluation, model `maintenance`, `paused`, and `no_data` explicitly, treat heartbeats as deadline tracking instead of polling, project public status from a read model, and reserve a full hardening phase for soak testing and reconciliation.

## Key Findings

### Recommended Stack

The stack recommendation is conventional for this domain because the problem is operational correctness, not novel infrastructure. Next.js 16 and React 19 cover the admin UI, API surface, and public status pages in one codebase. Node 22 is the correct runtime for long-lived workers and network probes. PostgreSQL 17 should remain the single durable source of truth in v1, while Redis 8 and BullMQ 5 provide the minimum reliable coordination layer once checks, retries, and alert delivery leave the request cycle.

Drizzle keeps the database layer close to SQL, which matters for incident constraints, rollups, and explicit migrations. Zod is mandatory for monitor configs and inbound payloads. Better Auth is sufficient for single-user access. Tailwind, Biome, Vitest, and Playwright are delivery-speed choices, not strategic differentiators.

**Core technologies:**
- Next.js 16 + React 19: dashboard, admin API, and public status pages — one full-stack frontend surface without splitting apps early
- Node.js 22: app and worker runtime — long-lived background execution fits Node, not serverless or edge
- PostgreSQL 17: primary data store — durable incident, check, maintenance, and uptime history in one database
- Redis 8 + BullMQ 5: scheduling and async coordination — leased jobs, retries, dedupe, and dispatch recovery
- Drizzle + drizzle-kit: schema and query layer — SQL-first control for correctness-heavy domain logic
- Zod: runtime validation — required for monitor definitions, webhooks, and channel configs

### Expected Features

The research is aligned on a lean but complete v1. Table stakes are not optional here: without trustworthy checks, confirmed alerts, incidents, maintenance, and status pages, the product feels unfinished. Differentiation should come from ergonomics and low-noise behavior, not feature count. The clearest product stance is "personal-scale, trust-first monitoring."

**Must have (table stakes):**
- HTTP/API checks with method, timeout, expected status, and optional headers/auth
- Keyword/content checks to catch soft failures
- SSL expiry checks with configurable alert lead time
- Heartbeat monitoring with grace periods and unique ping URLs
- Confirmed-failure alerting with one down and one resolved notification per incident
- Automatic incident history with lightweight timeline support
- Scheduled maintenance windows that suppress alerts and uptime impact
- Private dashboard plus optional public status pages by tag/group
- Uptime summaries for 24h, 7d, and 30d
- Flat tags/groups for organization

**Should have (competitive):**
- Trust-first incident behavior as an explicit product promise
- Sub-60-second setup flow with strong defaults
- Selective public sharing by tag/group
- Personal-scale alert ergonomics with no reminder spam
- Practical controls without enterprise clutter

**Defer (v2+):**
- Additional notification channels beyond a small reliable set
- Status-page subscriptions and announcement workflows until public-page usage is proven
- Response-time charts and deeper analytics
- Multi-location and browser/synthetic checks
- Multi-user collaboration, RBAC, on-call schedules, and escalations

### Architecture Approach

The architecture recommendation is high confidence and should directly drive the roadmap: use a modular monolith with explicit domain modules and separate worker entrypoints. The control plane owns config; the scheduler owns due work and leases; the check runner writes normalized facts; the evaluator owns confirmation and state transitions; the incident manager owns idempotent incident truth; the dispatcher sends notifications asynchronously; the status-page layer reads from a projection, not raw check rows; and reporting computes rolling uptime from normalized state history.

**Major components:**
1. Monitor control plane — CRUD for monitors, tags/groups, notification bindings, and maintenance rules
2. Scheduler and leased workers — select due checks and prevent duplicate execution
3. Check runner and result store — execute monitor adapters and persist normalized outcomes
4. Incident engine — apply confirmation rules and open/resolve incidents exactly once
5. Notification dispatcher — send channel notifications after incident transitions with retry and logging
6. Status projection — map internal monitor state into public components and incident feeds
7. Reporting and self-observability — compute uptime windows and detect stale/no-data conditions

### Critical Pitfalls

1. **Single failed probe treated as outage** — require explicit confirmation thresholds or grace windows before incident creation
2. **No durable incident state machine** — model state transitions, unique open incidents, and idempotent notifications
3. **Maintenance, paused, and no-data collapsed into ordinary health** — make these first-class states and exclude them correctly from alerting and uptime math
4. **Heartbeats implemented as poll checks** — treat them as deadline evaluation with lateness and recovery semantics
5. **Status page mirrors internal monitors** — project user-facing components from mapping rules instead of exposing raw monitor topology
6. **Monitoring system is not self-monitored** — track scheduler lag, worker heartbeat, queue depth, stale checks, and visible `no_data` degradation

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Monitoring Core
**Rationale:** Everything else depends on canonical monitor configuration, due-work selection, and raw result capture.
**Delivers:** Monitor CRUD, tags/groups, HTTP/API, keyword, SSL, and heartbeat monitor primitives, leased scheduler, worker execution, raw result storage, and minimal private dashboard freshness/status views.
**Addresses:** Core monitor types, organization, sub-60-second setup foundation.
**Avoids:** Single-check false positives, heartbeat mis-modeling, silent duplicate execution, and silent monitor blindness if freshness is exposed from day one.

### Phase 2: Incident Truth And Alerting
**Rationale:** Trust is the product boundary; incident correctness must exist before richer status or communication features.
**Delivers:** Confirmation thresholds, heartbeat grace evaluation, `maintenance`/`paused`/`no_data` handling, incident state machine, automatic open/resolve flows, deduplicated one down/resolved notifications, channel test sends, retry logging, and initial uptime event model.
**Uses:** PostgreSQL constraints, Redis/BullMQ jobs, Zod validation, async dispatch.
**Implements:** Result evaluator, incident manager, notification dispatcher, uptime contract.

### Phase 3: Status Projection And Public Pages
**Rationale:** Public communication should sit on top of trusted incident and component state, not raw checks.
**Delivers:** Tag/group-to-component mapping, projected public read model, shareable status pages, incident timeline, maintenance display, visibility controls, and optionally the first lightweight incident communication workflow.
**Addresses:** Optional public pages, private-by-default visibility, incident history as a public surface.
**Avoids:** Leaking internal monitor structure, inconsistent public/private state, and noisy component modeling.

### Phase 4: Reporting, Self-Observability, And Soak Hardening
**Rationale:** The project’s success criterion is a 7-day soak with zero missed outages and zero false positives; that requires explicit hardening work.
**Delivers:** Deterministic 24h/7d/30d uptime rollups, stale-data detection, worker/scheduler watchdogs, queue health visibility, reconciliation tooling, incident replay fixtures, and soak-test verification.
**Addresses:** Uptime summaries, reliability proof, operational confidence.
**Avoids:** Dishonest uptime math, silent worker failure, hidden delivery gaps, and unverified edge cases.

### Phase Ordering Rationale

- Monitoring primitives come first because incident evaluation, maintenance, heartbeats, and status pages all depend on normalized check data.
- Incident logic is isolated in its own phase because notification channels are easy to add later, but state-machine errors poison the whole product.
- Public status pages are intentionally delayed until internal truth exists, preventing a fragile public UX built on raw checks.
- Hardening is a real phase, not cleanup. The research repeatedly points to soak testing, self-observability, and uptime reconciliation as launch gates.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Notification provider selection and fallback behavior need targeted implementation research once the exact first channels are chosen.
- **Phase 3:** Custom-domain status pages, subscriber workflows, and public incident communication patterns need deeper research if included in scope.
- **Phase 4:** Uptime rollup methodology and long-window reconciliation deserve focused validation before numbers are treated as product truth.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Monitor CRUD, Node worker topology, BullMQ scheduling, and typed database setup are well-documented and should move straight to planning.
- **Core of Phase 2:** Incident state machines, idempotent notification jobs, and maintenance suppression have strong precedent in the source set.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Mostly grounded in current official docs, release notes, and mature ecosystem defaults; recommendations are conventional and specific. |
| Features | MEDIUM | Strong competitive pattern alignment, but some prioritization is opinionated because this is a personal-use product rather than a direct clone. |
| Architecture | HIGH | Multiple sources converge on the same product shape: worker-driven monitoring, incidents, and status pages in one system. |
| Pitfalls | HIGH | Risks are well-supported by vendor docs, SRE guidance, and operational experience patterns; these are the most stable findings. |

**Overall confidence:** HIGH

### Gaps to Address

- First notification-channel set is not fully resolved beyond email and a generic push/chat path; lock this during phase planning to avoid overbuilding dispatch abstractions.
- Status-page subscriber workflows are still optional; decide whether they are in-scope before planning Phase 3 to avoid reworking the incident communication model.
- Uptime calculation contract needs explicit implementation rules for monitor edits, partial intervals, and `no_data` handling before reporting code starts.
- Heartbeat payload validation and recovery semantics are not deeply specified yet; define these before the monitor schema is finalized.

## Sources

### Primary (HIGH confidence)
- Next.js 16 release notes and docs — version compatibility, current full-stack patterns
- React 19 release notes — current runtime baseline
- Node.js release schedule — Node 22 LTS production baseline
- PostgreSQL 17 release notes — current durable relational default
- BullMQ docs — scheduled jobs, retries, concurrency, recovery
- Redis Node client docs — recommended direct Redis client
- SQLite guidance on when not to use SQLite — rationale against v1 production choice
- Better Stack Uptime docs — monitor, incident, maintenance, heartbeat, and status-page patterns
- Atlassian Statuspage docs — public component/status modeling and incident communication
- Google SRE monitoring and alerting chapters — alert noise and confirmation guidance

### Secondary (MEDIUM confidence)
- Drizzle ORM and drizzle-kit docs/npm metadata — current versioning and SQL-first positioning
- Better Auth docs/npm metadata — auth fit for single-user dashboard
- UptimeRobot docs — expected monitor categories and maintenance/status-page table stakes
- Healthchecks.io docs — heartbeat/dead-man’s-switch behavior patterns
- Uptime Kuma wiki — self-hosted status-page and notification implementation gotchas

### Tertiary (LOW confidence)
- Supplemental field writeups on false alerts — directional support for common probe-noise causes, useful but not decisive

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
