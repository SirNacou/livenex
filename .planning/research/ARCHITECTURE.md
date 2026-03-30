# Architecture Patterns: Self-Hosted Uptime Monitoring

**Domain:** Self-hosted uptime monitoring (HTTP + ping, in-process scheduler, PostgreSQL)
**Researched:** 2026-03-30
**Confidence:** HIGH — based on Uptime Kuma source (direct), Gatus source (direct), Elysia docs (official), PostgreSQL docs (official), existing codebase analysis

---

## Recommended Architecture

A single-process application where the Elysia HTTP server and the monitoring scheduler live in the same Bun process. The scheduler manages per-monitor `setTimeout` loops (not cron); the HTTP API exposes CRUD for monitors, history queries, and notification config; TanStack Start renders both the admin dashboard (authenticated) and the public status page (unauthenticated).

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Bun Process (single)                          │
│                                                                      │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐   │
│  │   TanStack Start      │    │         Elysia API               │   │
│  │   (SSR + Routing)     │    │   /api/monitors                  │   │
│  │                       │    │   /api/checks                    │   │
│  │  /dashboard  (auth)   │    │   /api/incidents                 │   │
│  │  /status     (public) │◄───│   /api/notifications             │   │
│  │  /auth/*              │    │   /api/status-page               │   │
│  └──────────────────────┘    └──────────────┬───────────────────┘   │
│                                              │                        │
│  ┌───────────────────────────────────────────▼──────────────────┐   │
│  │                  Monitor Scheduler                            │   │
│  │  (started at server boot, one setTimeout loop per monitor)    │   │
│  │                                                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │   │
│  │  │ HTTP Checker│  │ Ping Checker│  │  State Machine       │ │   │
│  │  │ fetch()     │  │ Bun spawn   │  │  UP/DOWN/PENDING     │ │   │
│  │  └──────┬──────┘  └──────┬──────┘  │  (per monitor)      │ │   │
│  │         └────────────────┘         └──────────┬───────────┘ │   │
│  └──────────────────────────────────────────────┬┴─────────────┘   │
│                                                  │                   │
│  ┌───────────────────────────────────────────────▼──────────────┐   │
│  │                  Notification Dispatcher                      │   │
│  │  (called inline by scheduler on state transition only)        │   │
│  │                                                               │   │
│  │  Discord Webhook │ Slack Webhook │ Email (SMTP/nodemailer)   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                  Drizzle ORM + PostgreSQL                      │   │
│  │                                                               │   │
│  │  monitors │ check_results │ incidents │ notification_channels │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Monitor Scheduler** | Owns the heartbeat loop for every active monitor. Performs HTTP requests or ICMP ping. Writes check results. Detects state changes. Triggers notifications on transition. | Drizzle (write check_results), Notification Dispatcher (on state change), Elysia API (receives CRUD signals to start/stop/reload loops) |
| **HTTP Checker** | `fetch()` with timeout to target URL, records status code + response time + up/down | Monitor Scheduler |
| **Ping Checker** | `Bun.spawn(['ping', ...])` to target host, records RTT + up/down | Monitor Scheduler |
| **State Machine (per monitor)** | Tracks current status (UP/DOWN/PENDING), retry count, consecutive failures before confirming DOWN, last state-change time | Monitor Scheduler (embedded, not a separate class) |
| **Notification Dispatcher** | Fire-and-forget HTTP POSTs to Discord/Slack webhooks; SMTP send for email. Only called on UP→DOWN or DOWN→UP transitions. | External webhooks / SMTP server |
| **Elysia API** | CRUD for monitors, read-only for check history and incidents, notification channel CRUD, status page data | Drizzle (read/write), Monitor Scheduler (signal start/stop/reload) |
| **Admin Dashboard** (TanStack Start, auth-gated) | React UI for managing monitors, viewing history/response time charts, acknowledging incidents | Elysia API (via treaty) |
| **Public Status Page** (TanStack Start, no auth) | Public read-only view of current status + uptime percentages. Rendered SSR for fast first paint. | Elysia API (status-page endpoints, public) |
| **PostgreSQL** | Stores all persistent state: monitor config, check history, incidents, notification channels | Drizzle ORM |

---

## Data Flow

### Check Execution Flow

```
Scheduler timeout fires (per-monitor interval)
  → Checker runs (HTTP fetch or ping spawn)
  → Result: { status, responseTimeMs, httpStatusCode?, timestamp }
  → Write to check_results table
  → Compare with previous status (state machine)
  │
  ├─ Status unchanged → reschedule setTimeout, done
  │
  └─ Status changed (UP↔DOWN)
       → Upsert/close incident in incidents table
       → Call Notification Dispatcher (fire-and-forget)
       → Reschedule setTimeout
```

### API → Scheduler Signal Flow

```
POST /api/monitors      → create monitor in DB → scheduler.start(monitorId)
PUT  /api/monitors/:id  → update monitor in DB → scheduler.reload(monitorId)
DELETE /api/monitors/:id → delete from DB      → scheduler.stop(monitorId)
PUT  /api/monitors/:id/pause → update active=false → scheduler.stop(monitorId)
```

### Dashboard Data Flow

```
Browser navigates to /dashboard
  → TanStack Start SSR loader runs
  → Calls Elysia API via treaty (server-side direct call, not HTTP)
  → Loads monitor list + current status
  → Hydrates to client
  → React Query polls /api/monitors/status every 30s for live updates
  → Charts query /api/monitors/:id/checks?period=7d for history
```

### Public Status Page Data Flow

```
External browser requests /status
  → TanStack Start SSR renders with no auth check
  → Loads public-safe monitor data (name, current status, uptime %)
  → No polling needed for initial load; optional auto-refresh
```

---

## Scheduler Integration with Elysia

**Key insight from Uptime Kuma source:** Each monitor owns its own `setTimeout` loop, not a global cron tick. This avoids all monitors firing simultaneously at startup and handles per-monitor intervals naturally.

### How to Wire Into Elysia

The Elysia cron plugin (`@elysiajs/cron`) uses [croner](https://github.com/hexagon/croner) internally and is designed for fixed cron schedules — not dynamic per-monitor intervals. **Do not use `@elysiajs/cron` for the monitor scheduler.** Use plain `setTimeout` loops instead.

The correct approach: create a `MonitorScheduler` class that gets instantiated once and started in `src/index.ts` alongside the Elysia app. The scheduler uses `setTimeout` recursively per monitor.

```typescript
// src/lib/monitor-scheduler.ts
export class MonitorScheduler {
  private timers = new Map<string, ReturnType<typeof setTimeout>>()

  async start(monitorId: string) {
    const monitor = await db.query.monitors.findFirst(...)
    this.scheduleNext(monitor)
  }

  private scheduleNext(monitor: Monitor) {
    const timer = setTimeout(async () => {
      await this.runCheck(monitor)
      // Reload monitor config (interval may have changed)
      const fresh = await db.query.monitors.findFirst(...)
      if (fresh?.active) this.scheduleNext(fresh)
    }, monitor.intervalSeconds * 1000)

    this.timers.set(monitor.id, timer)
  }

  stop(monitorId: string) {
    const timer = this.timers.get(monitorId)
    if (timer) clearTimeout(timer)
    this.timers.delete(monitorId)
  }

  async startAll() {
    const monitors = await db.query.monitors.findMany({ where: eq(monitors.active, true) })
    await Promise.all(monitors.map(m => this.start(m.id)))
  }
}

// src/index.ts
import { Elysia } from 'elysia'
import { MonitorScheduler } from '#/lib/monitor-scheduler'

export const scheduler = new MonitorScheduler()

const app = new Elysia({ prefix: '/api' })
  .get('/', () => 'ok')
  // ... routes

// In the Nitro/TanStack Start server entry, call:
// scheduler.startAll()
// after DB migrations are confirmed
```

**Where to call `startAll()`:** The TanStack Start entry point (`src/server.ts` or equivalent Nitro handler) — after the process boots and before accepting requests. This cannot go inside Elysia's constructor because at construction time the Elysia app is not yet listening; it just needs to be called once, synchronously, after the process starts. Nitro's `nitroApp.hooks.hook('close', ...)` or a simple top-level `await scheduler.startAll()` in the server entry point both work.

**Graceful shutdown:** Register `process.on('SIGTERM')` and `process.on('SIGINT')` to call `scheduler.stopAll()` — clears all timers so the process exits cleanly. Critical for Docker.

```typescript
process.on('SIGTERM', async () => {
  scheduler.stopAll()
  process.exit(0)
})
```

---

## Patterns to Follow

### Pattern 1: Per-Monitor setTimeout Loop (not global tick)

**What:** Each monitor has its own `setTimeout` that reschedules itself after each check completes. The next check fires `interval` seconds after the *previous check finished*, not from when it was scheduled. This prevents drift and avoids thundering-herd at startup.

**When:** Always — for all monitor types.

```typescript
// After check completes:
const elapsed = Date.now() - checkStartTime
const remaining = Math.max(1000, monitor.intervalSeconds * 1000 - elapsed)
this.timers.set(monitor.id, setTimeout(() => this.runCheck(monitor), remaining))
```

### Pattern 2: State Machine with Retry Count (PENDING state)

**What:** Before marking a monitor DOWN, require N consecutive failures (configurable, default 1 for home lab). Uses a PENDING intermediate state.

**Why:** Prevents false-alarm notifications from transient network blips.

```
UP → (1 failure) → PENDING → (2nd failure, if retries=1) → DOWN → (1 success) → UP
```

**Implementation:** Store `retryCount` in memory on the scheduler instance (not in DB). On process restart, treat first check as authoritative (no memory of previous retries).

### Pattern 3: Incident Lifecycle (not just check results)

**What:** An "incident" is the span from first DOWN to recovery UP. Store incidents as a separate table with `started_at` / `resolved_at`. A check_result row with `status=DOWN` creates/extends an incident; a check_result with `status=UP` closes it.

**Why:** The dashboard needs "downtime incidents with duration" (from PROJECT.md requirements). Computing this from raw check results is expensive; storing it explicitly is cheap.

```sql
-- An incident row:
{ id, monitor_id, started_at, resolved_at (null=ongoing), duration_seconds }
```

### Pattern 4: Uptime % Computed from Check Results (not from incidents)

**What:** Uptime percentage is calculated by counting UP checks vs total checks within a time window, not from incident durations. This is more accurate when check intervals vary.

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'up') * 100.0 / COUNT(*) AS uptime_pct
FROM check_results
WHERE monitor_id = $1
  AND checked_at >= NOW() - INTERVAL '7 days'
```

### Pattern 5: Scheduler as Singleton Module (not Elysia plugin)

**What:** Export the scheduler instance from a module; import it in both `src/index.ts` (for API routes that signal start/stop) and the server entry point (for startAll).

**Why:** Elysia plugins are scoped to the Elysia instance. The scheduler needs to be accessible outside the request lifecycle (it runs background timers). A module-level singleton avoids the coupling.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Using `@elysiajs/cron` as the Monitor Scheduler

**What:** Registering each monitor as a cron job using `@elysiajs/cron`.

**Why bad:** Cron patterns are fixed strings (`*/30 * * * * *`). Per-monitor dynamic intervals (e.g., 45 seconds, 2 minutes) cannot be expressed as standard cron. Dynamically adding/removing monitors would require unregistering and re-registering cron jobs, which the plugin does not support gracefully. Also creates thundering herd (all monitors with same interval fire simultaneously).

**Instead:** Use `setTimeout` loops per monitor, as described in Pattern 1.

### Anti-Pattern 2: Blocking the Event Loop in Check Execution

**What:** Running synchronous operations (file I/O, blocking ping) inside the scheduler callback.

**Why bad:** Bun is single-threaded for JS. A blocking call delays all other checks and HTTP responses.

**Instead:** Use `fetch()` for HTTP (already async) and `Bun.spawn()` for ping (returns a Promise-based process handle). Both are non-blocking.

### Anti-Pattern 3: Storing All Check History in Memory

**What:** Keeping check results in a JavaScript Map or array in the scheduler, only flushing to DB periodically.

**Why bad:** Process restart loses all history. Memory grows unbounded for long-running processes. Breaks the invariant that the DB is the source of truth.

**Instead:** Write each check result to the DB immediately after the check. At 100 monitors × 1 check/min, that's 100 INSERTs/minute — trivial for PostgreSQL.

### Anti-Pattern 4: Single `check_results` Table Without Index on `(monitor_id, checked_at)`

**What:** Creating `check_results` as a plain table without a composite index.

**Why bad:** Every dashboard query (uptime %, response time chart, incident list) filters by `monitor_id` + time range. Without an index, these are full table scans that degrade as history grows.

**Instead:** Create `CREATE INDEX check_results_monitor_time_idx ON check_results (monitor_id, checked_at DESC)` as part of the initial migration. Add this in Drizzle schema definition.

### Anti-Pattern 5: Notifications Triggered on Every Check Result

**What:** Sending a Discord/Slack/email notification every time a DOWN check result is written.

**Why bad:** If a monitor checks every 30 seconds and is down for 10 minutes, you get 20 notifications. This is alert fatigue and is the #1 complaint about naive uptime monitors.

**Instead:** Only notify on state *transitions* (UP→DOWN and DOWN→UP). Track current state per monitor and compare with previous state before dispatching.

### Anti-Pattern 6: Fetching Full Check History for Uptime Calculation

**What:** `SELECT * FROM check_results WHERE monitor_id = $1` and computing uptime in JS.

**Why bad:** A monitor with 1-minute checks has 10,080 rows for 7 days. Loading them all into JS just to count is wasteful.

**Instead:** Use a single SQL aggregate query (see Pattern 4 above).

---

## Database Schema Implications

### Core Tables

```sql
-- Monitor configuration (source of truth for scheduler)
CREATE TABLE monitors (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('http', 'ping')),
  target        TEXT NOT NULL,         -- URL for http, hostname/IP for ping
  interval_secs INTEGER NOT NULL DEFAULT 60,
  timeout_secs  INTEGER NOT NULL DEFAULT 10,
  expected_status INTEGER,             -- HTTP only (e.g. 200)
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Raw check history (time-series, append-only)
CREATE TABLE check_results (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  monitor_id    TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  checked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL CHECK (status IN ('up', 'down', 'pending')),
  response_time_ms INTEGER,            -- null for failed checks
  http_status   INTEGER,               -- HTTP only
  error_message TEXT                   -- null on success
);

-- CRITICAL index for all dashboard queries:
CREATE INDEX check_results_monitor_time_idx
  ON check_results (monitor_id, checked_at DESC);

-- Incident tracking (derived from check_results transitions)
CREATE TABLE incidents (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  monitor_id        TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  started_at        TIMESTAMPTZ NOT NULL,
  resolved_at       TIMESTAMPTZ,       -- null = ongoing
  duration_secs     INTEGER            -- populated on close
);

CREATE INDEX incidents_monitor_idx ON incidents (monitor_id, started_at DESC);

-- Notification channels
CREATE TABLE notification_channels (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('discord', 'slack', 'email')),
  config      JSONB NOT NULL,          -- webhook URL, SMTP config, etc.
  enabled     BOOLEAN NOT NULL DEFAULT true
);

-- Many-to-many: which channels alert for which monitors
CREATE TABLE monitor_notification_channels (
  monitor_id  TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  channel_id  TEXT NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
  PRIMARY KEY (monitor_id, channel_id)
);
```

### PostgreSQL Partitioning Decision

**Verdict: Do NOT partition `check_results` for this project.**

Partitioning is beneficial when tables exceed physical RAM and queries must scan many millions of rows. At 20-100 monitors with 1-minute check intervals, `check_results` accumulates ~50,000-150,000 rows/day. After 90 days (the longest dashboard window), that's 4.5M–13.5M rows. With the composite index on `(monitor_id, checked_at DESC)`, queries on this scale complete in milliseconds without partitioning.

Adding range partitioning by month would add DDL complexity (partition management, automated partition creation) without meaningful query benefit given the index. Revisit only if retention periods extend beyond 1 year or monitor count grows past 500+.

**What to do instead:** Add a scheduled cleanup job (daily) that deletes check_results older than the configured retention period (e.g., 90 days). This keeps the table small. Implemented as a simple SQL DELETE with a timestamp filter, run from a `setInterval` in the scheduler or from a dedicated daily cron (can use `@elysiajs/cron` for this single fixed-schedule task).

```sql
-- Retention cleanup (run daily):
DELETE FROM check_results WHERE checked_at < NOW() - INTERVAL '90 days';
```

### Drizzle Schema Strategy

Define all tables in `src/db/schema.ts`. Use Drizzle's `timestamp('checked_at', { withTimezone: true, mode: 'date' })` for all timestamp columns so TypeScript gets `Date` objects. Use `pgEnum` for status and type columns to get both DB-level CHECK constraints and TypeScript union types.

```typescript
// src/db/schema.ts (key decisions)
import { pgTable, text, integer, boolean, bigint, timestamp, pgEnum, jsonb, index } from 'drizzle-orm/pg-core'

export const monitorTypeEnum = pgEnum('monitor_type', ['http', 'ping'])
export const checkStatusEnum = pgEnum('check_status', ['up', 'down', 'pending'])

export const checkResults = pgTable('check_results', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  monitorId: text('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  checkedAt: timestamp('checked_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  status: checkStatusEnum('status').notNull(),
  responseTimeMs: integer('response_time_ms'),
  httpStatus: integer('http_status'),
  errorMessage: text('error_message'),
}, (table) => ({
  monitorTimeIdx: index('check_results_monitor_time_idx').on(table.monitorId, table.checkedAt),
}))
```

---

## Scalability Considerations

| Concern | At 20-50 monitors (home lab) | At 100-500 monitors | At 1000+ monitors |
|---------|------------------------------|---------------------|-------------------|
| Scheduler concurrency | No concurrency needed; all checks complete well within any interval | Still fine; `setTimeout` loops are lightweight, async checks don't block | Need check pooling / concurrency limit to prevent too many simultaneous network calls |
| DB write throughput | ~50-100 INSERTs/min; trivial | ~500 INSERTs/min; still trivial | Consider batching inserts or dedicated write queue |
| History table size | Small; index sufficient | Medium; index sufficient | Consider partitioning by month |
| Notification latency | Inline in scheduler is fine | Inline still fine | Consider a queue to prevent notification failures from delaying check loops |
| Memory | Scheduler Map of timers is tiny | Tiny | Still small |

**For Livenex's target (20-100 monitors): no special scaling measures needed.**

---

## Suggested Build Order

The architecture has clear dependencies. Build in this order:

### Phase 1: Database Foundation
**Build first** — everything else depends on the schema.
- Drizzle schema for `monitors`, `check_results`, `incidents`, `notification_channels`, `monitor_notification_channels`
- Initial migration
- Seed script for local dev

### Phase 2: Monitor CRUD API + Admin UI
**Build second** — gives you something interactive to work with before the scheduler exists.
- Elysia routes: GET/POST/PUT/DELETE `/api/monitors`
- Admin dashboard: monitor list, add/edit/delete forms
- Better Auth gate on all admin routes (already integrated)
- At this point you can create monitors but they don't run yet

### Phase 3: Monitor Scheduler (Core Engine)
**Build third** — the heart of the system.
- `MonitorScheduler` class with `start()`, `stop()`, `reload()`, `startAll()`
- HTTP checker (fetch + timeout)
- Ping checker (Bun.spawn)
- State machine (UP/DOWN/PENDING with retry count)
- Write check_results to DB
- Open/close incidents on state transitions
- Wire into server entry point

### Phase 4: Dashboard History & Charts
**Build fourth** — scheduler must be running to generate data.
- Check history API: `GET /api/monitors/:id/checks?period=7d`
- Uptime % API: `GET /api/monitors/:id/uptime?period=7d|30d|90d`
- Incident list API: `GET /api/monitors/:id/incidents`
- Response time chart component (use Recharts or shadcn Chart)
- Downtime incident list in dashboard

### Phase 5: Notifications
**Build fifth** — independent of dashboard, depends only on scheduler.
- Notification channel CRUD (API + admin UI)
- Discord webhook dispatcher
- Slack webhook dispatcher
- Email dispatcher (nodemailer or Resend)
- Wire into scheduler state machine (call on UP→DOWN, DOWN→UP)

### Phase 6: Public Status Page
**Build last** — purely read-only, depends on having real data.
- Public API endpoints (no auth): `GET /api/status-page`
- Public route `/status` in TanStack Start (SSR, no auth wrapper)
- Status page UI: service list, current status, uptime history bars

**Why this order:**
- Phases 1-2 let you develop and test the data model interactively before writing the scheduler
- Phase 3 is the riskiest/most novel code — building it after the DB is settled reduces scope
- Phases 4-6 are additive features on top of a working core

---

## Sources

- Uptime Kuma `server/model/monitor.js` — scheduler pattern (setTimeout per monitor, state machine, notification on transition) — HIGH confidence (source code)
- Uptime Kuma `server/uptime-kuma-server.js` — singleton server pattern, monitor list in memory — HIGH confidence (source code)
- Gatus README + directory structure — alerting/storage/controller/watchdog separation, PostgreSQL storage support — HIGH confidence (source code)
- ElysiaJS Cron Plugin docs (https://elysiajs.com/plugins/cron.html) — `@elysiajs/cron` uses croner, fixed cron patterns — HIGH confidence (official docs)
- ElysiaJS Lifecycle docs (https://elysiajs.com/essential/life-cycle.html) — hook system, no built-in "on server start" hook — HIGH confidence (official docs)
- PostgreSQL Partitioning docs (https://www.postgresql.org/docs/current/ddl-partitioning.html) — partitioning only beneficial at scale exceeding physical memory — HIGH confidence (official docs)
- Existing codebase analysis (`src/index.ts`, `src/db/`, `src/routes/api/$.ts`) — Elysia as fetch handler, Drizzle with node-postgres, api routing pattern — HIGH confidence (direct read)
