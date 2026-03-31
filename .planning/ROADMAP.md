# Livenex Roadmap

**Project:** Livenex — self-hosted uptime monitoring for home lab  
**Granularity:** fine (10 phases)  
**Coverage:** 26/26 v1 requirements mapped ✓  
**Last updated:** 2026-03-31

---

## Phases

- [x] **Phase 1: Database Schema** — Define all tables, indexes, enums, and retention structure before any app logic
- [ ] **Phase 2: Monitor CRUD API** — Elysia endpoints for creating, reading, updating, and deleting monitors
- [ ] **Phase 3: Admin Dashboard Shell** — Auth-gated React UI with monitor list and add/edit/delete forms
- [ ] **Phase 4: Monitor Scheduler** — In-process check engine with per-monitor `setTimeout` loops, state machine, and incident tracking
- [ ] **Phase 5: Live Status & History API** — API endpoints that expose current status, uptime percentages, and incident lists
- [ ] **Phase 6: Charts & Incident History UI** — Response time charts and incident history panels in the admin dashboard
- [ ] **Phase 7: Notification Channels** — CRUD API and admin UI for managing Discord/Slack webhook notification channels
- [ ] **Phase 8: Alert Dispatching** — Wire notification channels into the scheduler's state machine for UP↔DOWN alerts
- [ ] **Phase 9: Public Status Page** — SSR public `/status` route with no auth requirement
- [ ] **Phase 10: Deployment** — Dockerfile, docker-compose, env validation, and auto-migration on startup

---

## Phase Details

### Phase 1: Database Schema
**Goal**: All database tables, indexes, enums, and retention scaffolding exist so every subsequent phase builds on a correct, permanent foundation.  
**Depends on**: Nothing — first phase  
**Requirements**: MON-04  
**Success Criteria** (what must be TRUE):
  1. Running `drizzle-kit migrate` (or the startup migration runner) creates all five tables: `monitors`, `check_results`, `incidents`, `notification_channels`, `monitor_notification_channels`
  2. The `check_results` table has a composite index on `(monitor_id, checked_at DESC)` — visible in `\d check_results` in psql
  3. The `monitors` table has `current_status` and `consecutive_failures` columns — confirm via schema introspection
  4. A seed script populates at least one HTTP monitor and one ping monitor for local development
  5. `drizzle-kit studio` shows all tables, columns, and enums with correct types and constraints
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Define all enums and tables in src/db/schema.ts (drizzle-kit generate verifies)
- [x] 01-02-PLAN.md — Write idempotent seed script, run migration, human-verify against live DB
**Key implementation notes**:
  - **CRITICAL — composite index from day one**: `CREATE INDEX check_results_monitor_id_checked_at_idx ON check_results (monitor_id, checked_at DESC)`. At 100 monitors × 60s interval this table grows ~144k rows/day. Without this index, queries degrade within weeks and it's painful to add after real data accumulates.
  - **CRITICAL — persistent monitor state**: Add `current_status` (enum: `up`, `down`, `pending`, `unknown`), `consecutive_failures` (integer, default 0), and `last_alerted_at` (timestamp, nullable) directly on the `monitors` table. These prevent duplicate DOWN alerts when the container restarts — without them, every restart re-fires alerts for all currently-down monitors.
  - **CRITICAL — retention job schema**: Add a `retention_days` config (default 90) to the schema or app config. The daily DELETE query (`DELETE FROM check_results WHERE checked_at < NOW() - INTERVAL '90 days'`) must be baked into the scheduler from Phase 4 — defining the intent at schema time prevents the "I'll add it later" trap.
  - **Incident table design**: `incidents` should have `monitor_id`, `started_at`, `resolved_at` (nullable), and `duration_seconds` (computed on close). This is cheaper at query time than computing incidents from raw check results.
  - **Drizzle enums**: Define `monitorType` (`http`, `ping`) and `checkStatus` (`up`, `down`, `pending`) as pgEnum — enforced at DB level, not just in TypeScript.
  - **STAT-05 flag on monitors**: Add a `show_on_status_page` boolean column (default `true`) to `monitors` now. STAT-05 is assigned to Phase 3 but the column must exist from the schema phase.
**UI hint**: no

---

### Phase 2: Monitor CRUD API
**Goal**: All API endpoints for managing monitors exist and return correctly typed responses, ready for the admin UI to consume.  
**Depends on**: Phase 1  
**Requirements**: MON-01, MON-02, MON-03, MON-05, MON-06, MON-07  
**Success Criteria** (what must be TRUE):
  1. `POST /api/monitors` with `{ type: "http", url: "https://example.com", name: "Example", interval: 60 }` creates a monitor and returns `201` with the full monitor object including generated ID
  2. `POST /api/monitors` with `{ type: "ping", host: "192.168.1.1", name: "Router", interval: 30 }` creates a ping monitor and returns `201`
  3. `PUT /api/monitors/:id` updates the monitor's name, URL/host, interval, or enabled state — confirmed with a `GET /api/monitors/:id` round-trip
  4. `PATCH /api/monitors/:id/toggle` flips the `enabled` field without touching other fields
  5. `DELETE /api/monitors/:id` removes the monitor row and all associated `check_results` and `incidents` rows — no orphaned foreign key rows remain
**Plans**: TBD
**Key implementation notes**:
  - **Cascade deletes**: Use `ON DELETE CASCADE` on `check_results.monitor_id` and `incidents.monitor_id` foreign keys. MON-07 requires history to be deleted with the monitor — cascades handle this cleanly without a multi-step delete in the handler.
  - **Interval validation**: Enforce a minimum interval (e.g., 10 seconds) in the Elysia input schema to prevent accidental hammering. Use Zod/Elysia's `t.Number({ minimum: 10 })`.
  - **HTTP vs. ping field validation**: HTTP monitors require `url`; ping monitors require `host`. Use a Zod discriminated union on `type` to enforce this at the API boundary.
  - **Scheduler signal hooks (stubs)**: Add no-op `scheduler.onMonitorCreated(id)`, `.onMonitorUpdated(id)`, `.onMonitorDeleted(id)`, `.onMonitorToggled(id)` stubs to the monitor CRUD handlers now. Phase 4 will implement these — having the call sites established avoids scatter-patching the API layer later.
  - **Do not implement auth gate here**: The Elysia API auth guard is wired in Phase 3 alongside the UI shell. The CRUD routes can exist without the guard during development; the guard is applied at the router/middleware level in Phase 3.
**UI hint**: no

---

### Phase 3: Admin Dashboard Shell
**Goal**: A developer can log in and reach a working admin dashboard that lists all monitors and supports adding, editing, toggling, and deleting them via the UI.  
**Depends on**: Phase 2  
**Requirements**: DASH-01, MON-01 (UI), MON-02 (UI), MON-05 (UI), MON-06 (UI), MON-07 (UI), STAT-05  
**Success Criteria** (what must be TRUE):
  1. Navigating to `/dashboard` without a session redirects to the login page — confirmed in an incognito window
  2. After logging in, the dashboard shows a list of all monitors with their name, type (HTTP/ping), interval, and enabled state
  3. User can open an "Add Monitor" form, fill in fields, submit, and the new monitor appears in the list without a page reload
  4. User can click "Edit" on a monitor, change the name or interval, save, and see the updated values in the list
  5. User can toggle a monitor's enabled state with a switch — the switch reflects the new state immediately
  6. User can delete a monitor with a confirmation prompt — monitor disappears from the list after deletion
  7. User can mark a monitor as "show on status page" or "hide from status page" per STAT-05 — toggle is visible in monitor edit form
**Plans**: TBD
**Key implementation notes**:
  - **Auth gate**: Apply the Better Auth session check as a `beforeLoad` guard on the `/dashboard` route (or parent layout route). Use `authClient.useSession()` on the client side for session-aware UI. Do NOT put auth logic inside individual page components — use the route loader.
  - **STAT-05 toggle placement**: The "show on status page" toggle should live in the monitor edit form (not a separate screen). The `show_on_status_page` column from Phase 1 is all that's needed.
  - **React Query for monitor list**: Use `useQuery(['monitors'])` polling at 30s for the monitor list. Mutations (create/update/delete) should call `queryClient.invalidateQueries(['monitors'])` to force a fresh fetch.
  - **Form validation**: Use `@tanstack/react-form` with Zod schema for the add/edit monitor forms — already in the stack. Discriminate HTTP vs. ping fields based on `type` selection to show/hide URL vs. host input.
  - **TanStack Start route guard pattern**: Follow the existing `src/routes/account/$accountView.tsx` pattern for auth-gated routes in this scaffold.
**UI hint**: yes

---

### Phase 4: Monitor Scheduler
**Goal**: The system actively checks all enabled monitors on their configured intervals, records results to the database, tracks state (UP/DOWN), and opens/closes incident records on state transitions.  
**Depends on**: Phase 2  
**Requirements**: MON-03 (runtime), MON-04 (writes)  
**Success Criteria** (what must be TRUE):
  1. After starting the server with one enabled HTTP monitor, `check_results` accumulates a new row every `interval` seconds — verified by querying the DB
  2. After starting the server with one enabled ping monitor, `check_results` accumulates rows with `type = 'ping'` — verified by querying the DB
  3. Taking a monitored HTTP endpoint offline causes its `monitors.current_status` to change from `up` to `down` after N consecutive failures (default 2) — verified by direct DB query
  4. When the endpoint comes back online, `monitors.current_status` returns to `up` and the `incidents` row's `resolved_at` is populated
  5. Sending `SIGTERM` to the process causes all in-flight checks to complete and no new checks to start — process exits cleanly within 5 seconds
  6. Server logs a clear `[WARN] ICMP ping requires NET_RAW capability` message if a ping check fails with `EPERM` rather than silently reporting the host as down
**Plans**: TBD
**Key implementation notes**:
  - **CRITICAL — schedule-after-complete, not setInterval**: Each monitor's loop must use `setTimeout` rescheduled in a `finally` block after the check completes. Pattern: `const runCheck = async () => { try { await doCheck(id); } finally { timer = setTimeout(runCheck, intervalMs); } }`. `setInterval` causes timer pileup when checks take longer than the interval — documented Uptime Kuma issue #2344, symptoms appear only after days of runtime.
  - **CRITICAL — graceful SIGTERM shutdown**: In `src/index.ts`, register `process.on('SIGTERM', () => scheduler.stopAll())` and `process.on('SIGINT', () => scheduler.stopAll())`. Elysia's `onStop` hook should also call `scheduler.stopAll()`. Without this, Docker `stop` hangs for 10 seconds (SIGKILL timeout) and in-flight DB writes may be interrupted.
  - **CRITICAL — load state from DB on startup**: Before starting any check loops, `scheduler.startAll()` must load `current_status` and `consecutive_failures` for every monitor from the DB. This prevents firing DOWN alerts for monitors that were already down before the restart.
  - **CRITICAL — ICMP Docker capability**: Add `cap_add: [NET_RAW]` to the app service in `docker-compose.yml` (this is Phase 10, but document it here). Add a startup probe: if the first ping check returns `EPERM`, log `[WARN] NET_RAW capability missing — ping monitors will fail in Docker without cap_add: [NET_RAW]`.
  - **CRITICAL — DNS error classification**: In the HTTP checker, catch `fetch` errors and classify: `ECONNREFUSED` → `error_type: connection_refused`, `EAI_AGAIN` or `ENOTFOUND` → `error_type: dns_error`, `AbortError` → `error_type: timeout`, non-200 status → `error_type: wrong_status`. Store `error_type` on `check_results`. Do NOT fire DOWN alerts for `dns_error` — Docker's internal DNS flaps and would spam.
  - **State machine logic**: `PENDING` → `DOWN` only after `consecutive_failures >= confirmationThreshold` (default 2, configurable per monitor). `DOWN` → `UP` on first successful check. Always reset `consecutive_failures = 0` on success.
  - **Scheduler singleton**: Export `MonitorScheduler` as a module-level singleton (not an Elysia plugin). This lets it be called from route handlers (CRUD mutations) without circular Elysia app dependencies.
  - **Daily retention DELETE**: Register a daily `croner` job in the scheduler that runs `DELETE FROM check_results WHERE checked_at < NOW() - INTERVAL '90 days'`. This is the right place — it's part of the scheduler's housekeeping responsibilities.
  - **croner for periodic jobs only**: Use `croner` for the daily retention cron job. Use plain `setTimeout` for per-monitor check loops. Do NOT use `@elysiajs/cron` — it's a thin wrapper with 27 stars that only supports fixed cron patterns.
**UI hint**: no

---

### Phase 5: Live Status & History API
**Goal**: API endpoints exist that expose current monitor statuses, uptime percentages, and incident history so the dashboard UI and public status page can fetch exactly the data they need.  
**Depends on**: Phase 4  
**Requirements**: DASH-02, DASH-03  
**Success Criteria** (what must be TRUE):
  1. `GET /api/monitors/status` returns a JSON array with one entry per monitor containing `id`, `name`, `type`, `current_status`, and `last_checked_at` — all fields populated with real data from the scheduler
  2. The response includes an overall system health field: `"system_status": "all_up"` when all monitors are up, `"any_down"` when one or more are down
  3. `GET /api/monitors/:id/uptime?period=7d` returns `{ period: "7d", uptime_pct: 99.2, total_checks: 10080, up_checks: 9991 }` — computed by SQL aggregate, not JS-side row iteration
  4. `GET /api/monitors/:id/uptime` supports `period=30d` and `period=90d` in addition to `7d`
  5. `GET /api/monitors/:id/incidents` returns a list of incidents with `started_at`, `resolved_at` (null if ongoing), and `duration_seconds` (null if ongoing)
**Plans**: TBD
**Key implementation notes**:
  - **Aggregate SQL for uptime %**: Use `SELECT COUNT(*) FILTER (WHERE status = 'up') AS up_checks, COUNT(*) AS total_checks FROM check_results WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL $2`. Never load all rows into JS and compute in memory — at 144k rows/day this is a full-table read.
  - **Period parameter parsing**: Accept `7d`, `30d`, `90d` as string parameters. Map to PostgreSQL intervals in the query. Return `400` for unknown periods.
  - **System health aggregate**: Compute `system_status` by querying `SELECT COUNT(*) FROM monitors WHERE current_status = 'down' AND enabled = true`. One DB query, no JS-side aggregation.
  - **Incident duration**: Compute `EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - started_at))::int AS duration_seconds` in the SQL query — avoid null handling in JS.
  - **Auth gate on these endpoints**: These endpoints back the admin dashboard, not the public status page. Apply the same Better Auth session guard as the other admin API routes. The public status page gets its own separate endpoints in Phase 9.
**UI hint**: no

---

### Phase 6: Charts & Incident History UI
**Goal**: The admin dashboard displays a response time line chart and downtime incident history for each monitor, alongside uptime percentage for 7d/30d/90d windows.  
**Depends on**: Phase 5  
**Requirements**: DASH-04, DASH-05, DASH-06  
**Success Criteria** (what must be TRUE):
  1. The dashboard shows a "7d uptime" percentage badge per monitor — selecting 30d or 90d updates the displayed value without a page reload
  2. The monitor detail view shows a line chart of response times over the last 24 hours with labeled axes (time on X, milliseconds on Y)
  3. The monitor detail view shows a table of recent downtime incidents with columns: start time, end time (or "Ongoing"), and duration (e.g., "4m 32s")
  4. The response time chart renders with no data gracefully — shows an empty state message ("No data yet — check will run shortly") rather than a blank or broken chart
  5. The uptime percentage chart/badge correctly reflects data from `GET /api/monitors/:id/uptime?period=Xd`
**Plans**: TBD
**Key implementation notes**:
  - **shadcn chart component**: Run `bunx shadcn add chart` to add the shadcn Chart component (which pulls in Recharts v3 automatically). Do NOT install Recharts manually — the shadcn chart component manages the dependency.
  - **Response time chart data endpoint**: Add `GET /api/monitors/:id/checks?period=24h&limit=500` (or similar) to Phase 5's API surface to return the timeseries data for the chart. The chart component consumes this via `useQuery`.
  - **Axis labels with units**: Always label the Y-axis with "ms" (milliseconds). Label the X-axis with readable timestamps. A common oversight is shipping unlabeled axes — Recharts `XAxis label={{ value: 'Time' }}` and `YAxis label={{ value: 'ms', angle: -90 }}`.
  - **Period selector UI state**: Uptime period selection (7d/30d/90d) should be local component state (`useState`), not URL state — it's ephemeral UI preference, not a shareable URL.
  - **Incident duration formatting**: Display `duration_seconds` as human-readable: `< 60` → "Xs", `60-3600` → "Xm Ys", `> 3600` → "Xh Ym". Implement as a `formatDuration(seconds: number): string` utility.
  - **Polling interval**: The dashboard status data already polls every 30s (Phase 5). The chart data can refresh less frequently — poll every 60s or on-demand with a "refresh" button.
**UI hint**: yes

---

### Phase 7: Notification Channels
**Goal**: A user can add, view, and remove Discord and Slack webhook URLs as named notification channels via the admin UI, with channels persisted to the database.  
**Depends on**: Phase 3  
**Requirements**: ALRT-04  
**Success Criteria** (what must be TRUE):
  1. User can navigate to a "Notifications" section in the admin dashboard and see a list of configured channels (empty state shown if none)
  2. User can add a new Discord channel by entering a name and a Discord webhook URL — the channel appears in the list after saving
  3. User can add a new Slack channel by entering a name and a Slack incoming webhook URL — the channel appears in the list after saving
  4. User can delete a notification channel — the channel disappears from the list and from any monitor-channel associations
  5. The add channel form validates that the URL looks like a valid Discord webhook (`https://discord.com/api/webhooks/...`) or Slack webhook (`https://hooks.slack.com/...`) — shows an inline error for invalid URLs
**Plans**: TBD
**Key implementation notes**:
  - **URL validation**: Use Zod `.url()` combined with a `.startsWith()` or `.regex()` check for known webhook prefixes. Discord: `https://discord.com/api/webhooks/` or `https://discordapp.com/api/webhooks/`. Slack: `https://hooks.slack.com/services/`. Return a descriptive validation error, not a generic "invalid URL".
  - **Cascade on channel delete**: When a notification channel is deleted, the join table `monitor_notification_channels` rows should cascade-delete (via `ON DELETE CASCADE` on the FK). No manual cleanup needed.
  - **Channel type enum**: Add a `channel_type` column to `notification_channels` with values `discord` and `slack`. This enables type-specific validation and future per-type formatting of notification messages.
  - **Test send button (optional)**: Consider a "Send test notification" button that fires a test webhook POST. This is a high-value UX feature for validating webhook configuration — low implementation cost (single fetch POST with canned message body).
**UI hint**: yes

---

### Phase 8: Alert Dispatching
**Goal**: When a monitor transitions from UP to DOWN (or DOWN to UP), the system sends a webhook notification to all configured Discord/Slack channels — and only fires after the confirmation threshold is reached, with no duplicate alerts on restart.  
**Depends on**: Phase 4 (scheduler state machine), Phase 7 (notification channels)  
**Requirements**: ALRT-01, ALRT-02, ALRT-03  
**Success Criteria** (what must be TRUE):
  1. Taking a monitored HTTP endpoint offline causes a Discord/Slack message to arrive in the configured channel after `confirmationThreshold` consecutive failures (default 2) — not after the first failure
  2. Bringing the endpoint back online causes a recovery message to arrive in the configured channel
  3. Restarting the server while a monitor is DOWN does not re-fire the DOWN alert — the alert suppression persists across restarts
  4. A monitor with `confirmationThreshold = 1` fires on the first failure; a monitor with `confirmationThreshold = 3` fires only after three consecutive failures — both configurable per monitor in the edit form
  5. If a webhook URL returns a non-2xx response, the error is logged with the channel name and response code — the scheduler continues running, the failure does not crash the check loop
**Plans**: TBD
**Key implementation notes**:
  - **CRITICAL — state-transition-only alerts**: The notification dispatcher must be called ONLY when `current_status` changes (UP→DOWN or DOWN→UP), not on every failed check. The state machine in Phase 4 tracks `consecutive_failures` — fire the notification exactly when the transition occurs, then set `last_alerted_at = NOW()`.
  - **CRITICAL — no duplicate alerts on restart**: Before firing any DOWN notification, check `monitors.current_status` loaded from DB on startup. If the monitor was already DOWN when the scheduler started, do not fire a DOWN alert — the user was already notified. This is why Phase 1 added `current_status` and `last_alerted_at` columns.
  - **CRITICAL — confirmation threshold in state machine**: The `confirmationThreshold` column (added in Phase 1/2) gates the DOWN transition. `PENDING → DOWN` only when `consecutive_failures >= confirmationThreshold`. Expose this in the monitor edit form as a numeric input (default 2, minimum 1).
  - **Discord message format**: Use a Discord embed for rich formatting — include monitor name, status (🔴 DOWN / 🟢 UP), timestamp, and URL/host. A plain `content` string also works but embeds are much more readable in Discord.
  - **Slack message format**: Use Slack Block Kit with a section block containing monitor name, status, and timestamp. A plain text `text` field also works as fallback.
  - **Fire-and-forget with error logging**: Wrap the webhook POST in a `try/catch`. Log failures with `console.error('[NotificationDispatcher] Discord webhook failed:', channelName, status)`. Never `await` the notification inside the check loop in a way that delays the next check.
  - **Rate limit guard**: Discord allows 30 requests per 30 seconds per webhook. At 100 monitors, a mass outage would exceed this. Add a simple cooldown: if `last_alerted_at` was within the last 60 seconds for this channel, skip and log the suppression.
**UI hint**: no

---

### Phase 9: Public Status Page
**Goal**: Anyone can visit `/status` without logging in and see the current up/down status, uptime history, and recent incidents for all monitors marked as public.  
**Depends on**: Phase 5 (history API), Phase 4 (live data)  
**Requirements**: STAT-01, STAT-02, STAT-03, STAT-04  
**Success Criteria** (what must be TRUE):
  1. Navigating to `/status` in a fresh incognito window loads the page with HTTP 200 — no redirect to login, no 401 response
  2. The status page shows the name and current status (UP/DOWN) for each monitor with `show_on_status_page = true` — no internal URLs or IP addresses appear anywhere on the page
  3. The status page shows a 90-day uptime history bar per monitor (series of colored blocks indicating daily up/down)
  4. The status page shows a list of recent downtime incidents per monitor (last 5 per monitor, or similar) with start time and duration
  5. Monitors with `show_on_status_page = false` do not appear on the public status page at all
**Plans**: TBD
**Key implementation notes**:
  - **CRITICAL — explicitly exclude from Better Auth middleware**: The `/status` route and its backing API endpoints (`/api/status-page`) must be explicitly excluded from any Better Auth auth guard. In Elysia, this means NOT applying the session-check middleware to `/api/status-page/*`. In TanStack Start, the `/status` route must NOT have the auth `beforeLoad` guard. Test this: open incognito, navigate to `/status`, expect the page — not a login redirect.
  - **Public-safe API shape**: `GET /api/status-page` returns ONLY: monitor `name`, `current_status`, uptime bars data, and recent incidents. It must NOT return `url`, `host`, IP addresses, or any internal network topology. Scrutinize every field in the response.
  - **SSR for initial load**: Render the status page server-side (TanStack Start loader calls the status-page API from the server). This ensures the page is immediately visible on load without a client-side fetch flash.
  - **Separate API endpoints**: Do not reuse the admin dashboard's `/api/monitors/status` endpoint for the public page. The admin endpoint returns fields (URL, host, interval) that must not be public. Write a purpose-built `/api/status-page` endpoint that returns only the public-safe subset.
  - **Uptime history bars**: The 90-day bar is typically rendered as a series of 90 colored `<div>` elements (green = up, red = down, grey = no data). Compute daily aggregates per monitor for the last 90 days: `SELECT DATE(checked_at), COUNT(*) FILTER (WHERE status='up'), COUNT(*) FROM check_results WHERE checked_at > NOW() - INTERVAL '90 days' GROUP BY DATE(checked_at)`.
**UI hint**: yes

---

### Phase 10: Deployment
**Goal**: The application can be deployed to any Docker-capable host with a single `docker compose up` command, with all configuration via environment variables and the database schema created automatically on first start.  
**Depends on**: All prior phases  
**Requirements**: DEPL-01, DEPL-02, DEPL-03, DEPL-04  
**Success Criteria** (what must be TRUE):
  1. Running `docker compose up` from a clean clone (with a populated `.env` file) starts the app and PostgreSQL — the app is reachable at `http://localhost:3000` within 60 seconds
  2. On first start, all database tables are created automatically without running any manual migration command — confirmed by checking the DB from psql
  3. `docker compose up` on a subsequent start (existing DB) does not fail or re-run destructive migrations — the app starts normally
  4. All secrets and configuration (DB URL, SMTP creds, webhook URLs) are read from environment variables — no secrets are hardcoded in any file committed to git
  5. A `.env.example` file documents every required and optional environment variable with placeholder values
**Plans**: TBD
**Key implementation notes**:
  - **Dockerfile**: Use a multi-stage build — `bun install --frozen-lockfile` in the build stage, copy only `node_modules` + built output to the runtime stage. Use `oven/bun:1-alpine` as the base image to keep the image small.
  - **docker-compose.yml services**: `app` (Livenex) + `db` (postgres:16-alpine). Set `depends_on: db: condition: service_healthy` with a PostgreSQL healthcheck (`pg_isready`). Without this, the app starts before Postgres is ready to accept connections.
  - **Auto-migration on startup**: Call `migrate(db, { migrationsFolder: './drizzle' })` from `drizzle-orm/pg-core/migrator` in the server entry point (`src/index.ts`) before starting the scheduler or accepting requests. This satisfies DEPL-04 with zero manual steps.
  - **DEPL-03 env validation**: The existing `@t3-oss/env-core` setup in the scaffold validates env vars at startup with Zod. Extend it to include all new vars: `DATABASE_URL`, `DISCORD_WEBHOOK_URL` (optional), `SLACK_WEBHOOK_URL` (optional), `SMTP_HOST` (optional), `SMTP_PORT` (optional), `SMTP_USER` (optional), `SMTP_PASS` (optional), `BETTER_AUTH_SECRET`. App refuses to start if required vars are missing.
  - **NET_RAW capability**: Add `cap_add: [NET_RAW]` to the `app` service in `docker-compose.yml`. This is required for ICMP ping checks (flagged in Phase 4). Document this in comments inline.
  - **Reverse proxy note**: Add a comment in `docker-compose.yml` indicating where to add Traefik/Caddy/nginx labels for external access — the user will need this for home lab access from outside.
**UI hint**: no

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database Schema | 2/2 | ✅ Complete | 2026-04-01 |
| 2. Monitor CRUD API | 0/? | Not started | - |
| 3. Admin Dashboard Shell | 0/? | Not started | - |
| 4. Monitor Scheduler | 0/? | Not started | - |
| 5. Live Status & History API | 0/? | Not started | - |
| 6. Charts & Incident History UI | 0/? | Not started | - |
| 7. Notification Channels | 0/? | Not started | - |
| 8. Alert Dispatching | 0/? | Not started | - |
| 9. Public Status Page | 0/? | Not started | - |
| 10. Deployment | 0/? | Not started | - |
