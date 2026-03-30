# Project Research Summary

**Project:** Livenex
**Domain:** Self-hosted uptime monitoring (home lab, 20-100 monitors)
**Researched:** 2026-03-30
**Confidence:** HIGH

## Executive Summary

Livenex is a self-hosted uptime monitoring tool targeting home lab users who need real-time visibility into HTTP endpoints and network hosts. The research confirms this is a well-understood problem space with strong reference implementations (Uptime Kuma: 84k ⭐, Gatus: 10.5k ⭐) to learn from. The recommended approach is a single-process architecture — Elysia HTTP server + in-process scheduler running in the same Bun process — backed by PostgreSQL (already in stack). Only 3 new production dependencies are needed: `croner` for scheduling, `@louislam/ping` for ICMP checks, and `nodemailer` for SMTP alerts. Everything else (HTTP checks, Discord/Slack webhooks, charts) is covered by Bun native `fetch` and the existing shadcn+Recharts component ecosystem.

The key architectural insight from Uptime Kuma's source is that each monitor owns its own `setTimeout` loop (not a global cron tick), rescheduled after each check completes. This prevents thundering-herd startup, handles variable intervals naturally, and avoids the timer-pileup bug that plagues naive `setInterval` implementations. State changes (UP→DOWN, DOWN→UP) are the only trigger for notifications, with a configurable confirmation threshold to suppress false positives from transient network blips.

The main risks are operational rather than technical: ICMP ping silently failing in Docker without `NET_RAW` capability, alerts duplicating on process restart if state is not persisted to the DB, and the `check_results` table growing without bounds if retention is not built in from day one. All three are avoidable at schema/scheduler construction time — they become expensive to retrofit. Build the index, retention job, and DB-persisted monitor state in Phase 1; get them right and the rest flows cleanly.

---

## Key Findings

### Recommended Stack

The existing scaffold (TanStack Start, Elysia, Drizzle, PostgreSQL, Better Auth, shadcn) covers the entire web layer. The monitoring-specific additions are minimal and lean on production-validated choices from Uptime Kuma v2.2.1.

See full detail: [STACK.md](./STACK.md)

**New production dependencies (3 total):**
- `croner` ^10.0.1: Per-monitor interval scheduling — zero dependencies, Bun 1.0+ explicit support, overrun protection, used by Uptime Kuma. Do NOT use `@elysiajs/cron` (thin wrapper, 27 stars) or `node-cron` (133 open issues).
- `@louislam/ping` ^0.4.4-mod.1: ICMP ping via system `ping` binary — works without raw socket permissions in Docker when `NET_RAW` is added. The exact library used by Uptime Kuma.
- `nodemailer` ^8.0.4: SMTP email alerts — the undisputed standard (17.5k stars), Bun-compatible in v8.x. Add `@types/nodemailer` as dev dependency.

**No new dependencies needed for:**
- HTTP/HTTPS checks: Bun native `fetch` with `AbortController` timeout
- Discord/Slack webhook alerts: Bun native `fetch` (a single POST to a URL)
- Response time charts: `bunx shadcn add chart` (adds shadcn Chart component + Recharts v3 automatically)
- Time-series storage: PostgreSQL + composite index on `(monitor_id, checked_at DESC)` — no TimescaleDB needed at this scale

### Expected Features

Research based on direct inspection of Uptime Kuma, Gatus, Upptime, Better Stack, and community comparisons.

See full detail: [FEATURES.md](./FEATURES.md)

**Must have — table stakes for v1 launch:**
- HTTP/HTTPS endpoint monitoring (URL, interval, expected status code)
- ICMP ping host monitoring (hostname/IP, interval)
- Per-monitor configurable check intervals (not global)
- Check result storage: up/down, response time, timestamp
- State change detection (UP→DOWN, DOWN→UP transitions)
- Admin dashboard with current status for all monitors (auth-gated via Better Auth)
- Uptime % per monitor for 7d, 30d, 90d windows
- Response time graph per HTTP monitor
- Incident history with duration
- Public status page (no login required)
- Discord/Slack webhook alerts on state change
- Email (SMTP) alerts on state change
- Monitor enable/disable toggle
- Docker + docker-compose deployment

**Should have — v1.x after validation:**
- Monitor grouping / tagging (inflection point at ~10+ monitors)
- SSL certificate expiration check (derived from HTTP TLS handshake, low cost)
- Alert cooldown / deduplication (prevents spam on flapping services)
- Configurable expected HTTP status code beyond 200
- Manual "check now" trigger in the UI (low effort, high UX value)

**Defer to v2+:**
- Maintenance windows (adds scheduling complexity; disable monitors manually in the interim)
- Response time threshold alerting (condition logic on data model; add after core stabilizes)
- Status page incident announcements (content management; useful later for public-facing status pages)

**Explicitly out of scope (anti-features):**
- Multi-user / team accounts, SMS alerts, mobile app, agent-based / push monitoring, real-time WebSocket dashboard, distributed / multi-region checks

**Key observation:** Uptime Kuma is the closest reference for Livenex — GUI-driven, Docker-primary, broad notification support. Follow Uptime Kuma's UX philosophy (UI-first) while adopting Gatus's cleaner data model.

### Architecture Approach

Single-process: Elysia HTTP server + MonitorScheduler (per-monitor `setTimeout` loops) + Notification Dispatcher all running inside one Bun process, sharing a single Drizzle/PostgreSQL connection pool. TanStack Start renders both the auth-gated admin dashboard and the public status page via SSR.

See full detail: [ARCHITECTURE.md](./ARCHITECTURE.md)

**Major components and responsibilities:**
1. **MonitorScheduler** — owns the heartbeat loop for every active monitor; performs checks; writes `check_results`; detects state transitions; triggers notifications. Implemented as a module-level singleton (not an Elysia plugin) so it's accessible outside the request lifecycle.
2. **HTTP Checker** — `fetch()` with `AbortController` timeout; records status code, response time, error type (timeout / dns / connection_refused / wrong_status).
3. **Ping Checker** — `Bun.spawn(['ping', ...])` to system binary; records RTT + up/down.
4. **State Machine (per monitor)** — UP / DOWN / PENDING with `retryCount`; PENDING → DOWN only after N consecutive failures (default 2); state persisted to DB.
5. **Notification Dispatcher** — fire-and-forget; Discord/Slack (fetch POST) and email (nodemailer); called only on UP↔DOWN transitions.
6. **Elysia API** — CRUD for monitors, notification channels; read-only history/status endpoints; signals scheduler to start/stop/reload on monitor mutations.
7. **Admin Dashboard** (TanStack Start, auth-gated) — React UI; polls `/api/monitors/status` every 30s; charts via shadcn+Recharts.
8. **Public Status Page** (TanStack Start, no auth) — SSR-rendered; public-safe data only (monitor name + status, no URLs).
9. **PostgreSQL** — source of truth: `monitors`, `check_results`, `incidents`, `notification_channels`, `monitor_notification_channels`.

**Critical schema decisions:**
- `check_results`: composite index on `(monitor_id, checked_at DESC)` — must exist from day one
- `monitors`: `current_status` and `consecutive_failures` columns for persistent state (prevents duplicate alerts on restart)
- `incidents`: explicit table with `started_at` / `resolved_at` — cheaper than computing from raw check results at query time
- Uptime % computed from `COUNT(*) FILTER (WHERE status = 'up')` aggregate query — never load all rows into JS
- Daily retention DELETE job (90-day window) — built into scheduler alongside the initial schema

### Critical Pitfalls

Sourced from Uptime Kuma issue history, PostgreSQL docs, Docker official docs, and monitoring domain patterns.

See full detail: [PITFALLS.md](./PITFALLS.md)

1. **ICMP ping silently always returns "up" in Docker** — Docker drops `NET_RAW` by default; raw-socket ping libraries fail silently. Fix: add `cap_add: [NET_RAW]` in `docker-compose.yml`, OR use TCP port check as fallback. Add a startup capability probe that logs a clear error if ICMP ping fails with EPERM. *Address in: ping implementation phase.*

2. **Timer pileup using `setInterval`** — If a check takes longer than the interval, `setInterval` stacks concurrent in-flight checks. Symptoms: response times trend upward over days; memory grows; restart "fixes" it temporarily (documented Uptime Kuma issue #2344). Fix: use schedule-after-complete (`setTimeout` rescheduled in a `finally` block after each check). *Never use `setInterval` for monitor checks.*

3. **Alert storm from no confirmation threshold** — A single check failure immediately fires a notification. Network blips, DNS hiccups, and rolling restarts cause paired DOWN/UP spam within minutes. Fix: require N consecutive failures (default 2) before transitioning to DOWN state; only notify on state *transitions*. Expose `confirmationThreshold` as a per-monitor DB column from day one. *Address in: alerting phase.*

4. **Duplicate alerts on process restart** — If monitor state is in-memory only, every container restart fires DOWN alerts for all currently-down monitors. Fix: persist `current_status` and `last_alerted_at` to the `monitors` table; load from DB on startup before starting checks. *Address in: DB schema phase.*

5. **Unbounded `check_results` growth** — At 100 monitors × 60s interval, the table grows by ~144,000 rows/day. Without a composite index and retention job, queries degrade in weeks. Fix: composite index + daily DELETE job cleaning rows older than 90 days — built into the initial schema migration. *Address in: DB schema phase.*

6. **DNS failures → false downtimes in Docker** — Docker's internal DNS resolver can return `EAI_AGAIN` transiently, making all external monitors appear down simultaneously. Fix: distinguish `dns_error` from `down` in `check_results.error_type`; don't fire DOWN alerts for DNS failures; recommend using explicit DNS config (`dns: 8.8.8.8`) in compose. *Address in: HTTP check implementation phase.*

7. **Public status page inadvertently behind auth middleware** — If the status page route inherits the admin auth guard, unauthenticated visitors get 401. Fix: explicitly exclude `/status` routes from Better Auth middleware; test with a fresh incognito window. *Address in: status page phase.*

---

## Implications for Roadmap

Research reveals a clean, dependency-driven build order with no ambiguity. Architecture.md's suggested build order is confirmed by the pitfall analysis — the pitfalls that are most expensive to retrofit (schema, index, retention, state persistence) all belong in Phase 1.

### Phase 1: Database Foundation
**Rationale:** Everything else depends on the schema being right. All the "expensive-to-retrofit" pitfalls (missing index, no retention, no persistent monitor state) are fixed here. Build the schema once, correctly.
**Delivers:** Drizzle schema + initial migration; `monitors`, `check_results`, `incidents`, `notification_channels`, `monitor_notification_channels` tables; composite index on `(monitor_id, checked_at DESC)`; DB-level enums for monitor type and check status; seed script for local dev.
**Addresses features:** Underpins all v1 features.
**Avoids pitfalls:** Unbounded DB growth (index + retention job schema), duplicate alerts on restart (`current_status` column), uptime % query performance (aggregate query pattern).
**Research flag:** None — standard Drizzle/PostgreSQL patterns, well-documented.

### Phase 2: Monitor CRUD API + Admin Dashboard Shell
**Rationale:** Gives you an interactive surface before the scheduler exists. Lets you build and test the UI data model with real DB interactions. Confirms the admin auth gate works correctly before it matters.
**Delivers:** Elysia CRUD routes for monitors (`GET/POST/PUT/DELETE /api/monitors`); admin dashboard with monitor list + add/edit/delete forms; Better Auth gate on all admin routes; monitor enable/disable toggle.
**Addresses features:** Monitor management, auth-gated admin dashboard.
**Avoids pitfalls:** Status page / admin route auth boundary established early.
**Research flag:** None — standard Elysia + TanStack Start patterns.

### Phase 3: Monitor Scheduler (Core Engine)
**Rationale:** The heart of the system. Riskiest and most novel code — build it after the DB is settled to reduce scope. The schedule-after-complete pattern and graceful shutdown must be baked in here; retrofitting is painful.
**Delivers:** `MonitorScheduler` singleton with `start()`, `stop()`, `reload()`, `startAll()`, `stopAll()`; HTTP checker (fetch + AbortController timeout + error-type classification); ping checker (Bun.spawn + `@louislam/ping`); state machine (UP/DOWN/PENDING with `retryCount` and `confirmationThreshold`); writes `check_results` to DB; opens/closes `incidents` on state transitions; wired into server entry point; graceful SIGTERM/SIGINT shutdown.
**Addresses features:** HTTP monitoring, ICMP ping monitoring, per-monitor intervals, check result storage, state change detection, incident lifecycle.
**Avoids pitfalls:** Timer pileup (schedule-after-complete), orphaned timers on shutdown (Elysia `onStop` + SIGTERM handlers), ICMP Docker permissions (startup capability probe + NET_RAW in compose), DNS false downtimes (error-type classification).
**Research flag:** None — pattern well-documented from Uptime Kuma source and ARCHITECTURE.md.

### Phase 4: Dashboard History, Charts & Status Data
**Rationale:** Purely additive on top of a working scheduler. Requires real check data to be meaningful — build after the scheduler is running.
**Delivers:** Check history API (`GET /api/monitors/:id/checks?period=7d`); uptime % API with 7d/30d/90d windows; incident list API; response time chart component (shadcn Chart + Recharts, `bunx shadcn add chart`); downtime incident list in dashboard; React Query polling every 30s for live status updates.
**Addresses features:** Uptime % display, response time graphs, incident history.
**Avoids pitfalls:** Full-table scan for uptime % (SQL aggregate query, never JS-side), returning all check history in one API response (time-bounded queries + pagination), response time graph axes labeled with units.
**Research flag:** None — standard charting and query patterns.

### Phase 5: Notifications
**Rationale:** Independent of the dashboard. Depends only on the scheduler's state machine (Phase 3). Can be built in parallel with Phase 4 if desired, but logically sequential.
**Delivers:** Notification channel CRUD (API + admin UI); Discord webhook dispatcher; Slack webhook dispatcher; email dispatcher (nodemailer + SMTP); wired into scheduler state machine (UP→DOWN and DOWN→UP transitions only); `confirmationThreshold` per-monitor config exposed in UI.
**Addresses features:** Discord/Slack webhook alerts, email alerts, alert deduplication.
**Avoids pitfalls:** Alert storm (notification only on state transitions), duplicate alerts on restart (load `current_status` from DB before first check), Discord webhook rate limits (built-in cooldown guard).
**Research flag:** None — well-established webhook + SMTP patterns.

### Phase 6: Public Status Page
**Rationale:** Purely read-only. No new write logic. Requires real data (all prior phases). Build last to avoid premature public API design.
**Delivers:** Public-safe API endpoints (`GET /api/status-page`, no auth); public `/status` route in TanStack Start (SSR, no auth wrapper); status page UI showing service names, current status, uptime history bars; explicitly excludes internal URLs from public response.
**Addresses features:** Public status page (no login required).
**Avoids pitfalls:** Status page behind auth middleware (test with fresh incognito window), internal URLs/IPs exposed on public page (API returns only name + status), public page queries using simple indexed queries (not the heavy admin dashboard endpoints).
**Research flag:** None — standard SSR read-only route, no novel patterns.

### Phase Ordering Rationale

- **Schema first (Phase 1):** The "expensive to retrofit" pitfalls (index, retention, persistent state columns) all live here. One migration now vs. painful migration after accumulating real data.
- **CRUD before scheduler (Phase 2 before Phase 3):** Interactive feedback loop for testing the data model before writing background logic. Reduces scheduler debugging complexity.
- **Scheduler before dashboard data (Phase 3 before Phase 4):** Dashboard charts need real check history to be meaningful — can't fully test chart rendering without the scheduler running.
- **Notifications after scheduler (Phase 5 after Phase 3):** State machine must exist before notifications can be wired in. Confirmation threshold logic lives in the same phase as the alert dispatcher.
- **Status page last (Phase 6):** Read-only; zero risk of getting it wrong affects core functionality. Also last to design means the API shape for public data is informed by what the admin dashboard already exposes.

### Research Flags

Phases with standard patterns — skip deep research:
- **Phase 1:** Standard Drizzle schema + PostgreSQL indexing — extensive documentation available.
- **Phase 2:** Standard Elysia CRUD + TanStack Start routing — scaffold already demonstrates these patterns.
- **Phase 3:** Pattern fully documented in ARCHITECTURE.md from Uptime Kuma source analysis.
- **Phase 4:** Standard Recharts + shadcn chart + React Query — all official docs sufficient.
- **Phase 5:** Discord/Slack webhook is a single POST; nodemailer is battle-tested.
- **Phase 6:** Standard SSR read-only route; no novel patterns.

**No phases require `/gsd-research-phase` during planning.** The research was comprehensive and the domain is well-understood. If a gap emerges during implementation, the most likely candidate is Phase 3 (scheduler/state machine edge cases in Bun's event loop behavior vs. Node.js).

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries verified via official GitHub repos and Uptime Kuma v2.2.1 `package.json` (production reference). Bun compatibility confirmed via official Bun docs. One LOW note: Tremor v4 pricing — not independently verified, but irrelevant since shadcn+Recharts is the correct choice regardless. |
| Features | HIGH | Sourced from direct inspection of Uptime Kuma (84k ⭐), Gatus (10.5k ⭐), Upptime (17k ⭐), and Better Stack. Feature matrix covers all major competitors. |
| Architecture | HIGH | Based on Uptime Kuma source code (direct read), Gatus structure, ElysiaJS official lifecycle docs, PostgreSQL official partitioning docs, and direct codebase analysis of the existing scaffold. |
| Pitfalls | HIGH | Docker/ICMP from official Docker docs; timer pileup traced to specific Uptime Kuma issue #2344; DNS failures from Uptime Kuma issue #114; all other pitfalls are well-established monitoring domain knowledge. |

**Overall confidence: HIGH**

### Gaps to Address

- **Tremor v4 pricing:** Cited as a reason not to use Tremor, but sourced from training data (LOW confidence). Moot — shadcn+Recharts is the correct choice for this stack regardless of Tremor's pricing. No action needed.
- **Bun `Bun.spawn` vs. `@louislam/ping` for ICMP:** ARCHITECTURE.md notes `Bun.spawn(['ping', ...])` directly while STACK.md recommends `@louislam/ping` (which wraps the system ping binary). Both use the system `ping` binary — the difference is API ergonomics. Decision: use `@louislam/ping` for the structured response format (RTT parsing, alive flag) it provides; `Bun.spawn` directly only if the library causes issues.
- **TanStack Start server entry point for `scheduler.startAll()`:** Where exactly to hook `startAll()` in the Nitro/TanStack Start lifecycle is not definitively pinned down in the research (Nitro hooks vs. top-level `await`). Low-risk gap — either approach works for a single-process app; validate in Phase 3 implementation.

---

## Sources

### Primary (HIGH confidence)
- [github.com/louislam/uptime-kuma](https://github.com/louislam/uptime-kuma) — v2.2.1 `package.json` (production stack reference), scheduler pattern from `server/model/monitor.js`, state machine, notification dispatch
- [github.com/TwiN/gatus](https://github.com/TwiN/gatus) — feature set, alerting model, condition system, group concept
- [github.com/upptime/upptime](https://github.com/upptime/upptime) — feature comparison
- [github.com/Hexagon/croner](https://github.com/Hexagon/croner) — v10.0.1 latest (Feb 2026), Bun 1.0+ explicit support confirmed
- [github.com/nodemailer/nodemailer](https://github.com/nodemailer/nodemailer) — v8.0.4 latest (Mar 2026), MIT No Attribution license
- [github.com/recharts/recharts](https://github.com/recharts/recharts) — v3.8.1 latest (Mar 2026), 26.9k stars
- [ui.shadcn.com/docs/components/chart](https://ui.shadcn.com/docs/components/chart) — confirmed Recharts v3 integration, copy-paste component
- [bun.sh/docs/runtime/nodejs-compat](https://bun.sh/docs/runtime/nodejs-compat) — `node:child_process`, `node:net`, `node:tls` fully implemented
- [discord.com/developers/docs/resources/webhook](https://discord.com/developers/docs/resources/webhook) — incoming webhook confirmed as single POST
- [elysiajs.com/plugins/cron.html](https://elysiajs.com/plugins/cron.html) — `@elysiajs/cron` uses croner, fixed cron patterns only
- [elysiajs.com/essential/life-cycle.html](https://elysiajs.com/essential/life-cycle.html) — `onStop` hook for graceful shutdown
- [postgresql.org/docs/current/ddl-partitioning.html](https://www.postgresql.org/docs/current/ddl-partitioning.html) — partitioning only beneficial at scale exceeding physical memory
- [docs.docker.com/engine/containers/run](https://docs.docker.com/engine/containers/run/#runtime-privilege-and-linux-capabilities) — `NET_RAW` not granted by default

### Secondary (MEDIUM confidence)
- Uptime Kuma issue #2344 — timer pileup root cause confirmed
- Uptime Kuma issue #114 — `EAI_AGAIN` DNS errors with Pi-hole in same compose stack
- Uptime Kuma issue #275 — false timeouts in Docker Desktop / WSL2
- [betterstack.com/uptime](https://betterstack.com/uptime) — commercial feature comparison baseline

### Tertiary (LOW confidence)
- Tremor v4 pricing (training data only) — not independently verified; moot given shadcn+Recharts is the correct choice

---
*Research completed: 2026-03-30*
*Ready for roadmap: yes*
