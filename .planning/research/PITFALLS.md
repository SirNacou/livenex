# Pitfalls Research

**Domain:** Self-hosted uptime monitoring (Bun / Elysia / PostgreSQL / Docker)
**Researched:** 2026-03-30
**Confidence:** HIGH (Docker/ICMP: official docs; scheduler/DB patterns: Uptime Kuma issue history + PostgreSQL docs; alert patterns: well-established monitoring domain knowledge)

---

## Critical Pitfalls

### Pitfall 1: ICMP Ping Silently Fails Inside Docker — Always Reports "Up"

**What goes wrong:**
Ping checks (`ICMP ECHO_REQUEST`) require raw socket access (`NET_RAW` Linux capability). Docker containers run without this capability by default. When the application calls a ping library using raw sockets, it either throws a permission error at startup, silently falls back to a TCP check, or reports all hosts as "up" (error caught, no response means the check completes without actually pinging anything).

**Why it happens:**
Developers test ping locally as root or on their dev machine where raw sockets are available. In Docker, the default seccomp profile and capability whitelist drops `NET_RAW`. The application appears to work — it doesn't crash — but is silently doing nothing useful.

**How to avoid:**
Two options (pick one):
1. **Add `NET_RAW` capability** explicitly in `docker-compose.yml`:
   ```yaml
   cap_add:
     - NET_RAW
   ```
   This is the minimal privilege add. Avoid `--privileged` (grants everything).
2. **Use TCP ping instead of ICMP** for host reachability checks. Connect to a known open port (e.g., port 80 or 22) instead. No capability needed, works in any container. Document this as the approach.

The Drizzle monitor schema should have a `check_type` field that distinguishes `http`, `tcp`, and `icmp` so the right strategy is used per monitor.

**Warning signs:**
- Ping monitors never go "down" even when hosts are demonstrably offline
- No errors logged during container startup or check execution
- Ping checks complete in < 1ms (suspiciously fast — not actually sending packets)

**Phase to address:**
Phase that introduces ping/host monitors. Add a capability check on startup: try a real ICMP ping to `127.0.0.1`; if it fails with EPERM, log a clear warning and either refuse to create ICMP monitors or fall back to TCP.

---

### Pitfall 2: Scheduler Accumulates Concurrent Checks Under Slow Targets — Timer Pileup

**What goes wrong:**
Using `setInterval(checkFn, intervalMs)` to schedule each monitor creates a new invocation every `intervalMs` regardless of whether the previous check finished. For a slow or unreachable target (30s timeout, 60s interval), the second check fires before the first resolves. Over time, dozens of concurrent in-flight checks accumulate for the same monitor. This causes response time graphs to skew high (the "monitors all slow down over time" pattern seen in Uptime Kuma issue #2344), memory growth, and eventual event loop congestion.

**Why it happens:**
`setInterval` is the obvious primitive to reach for. The bug is not obvious until you have slow hosts or network hiccups. With 100 monitors at 60s intervals and 30s timeouts, worst case is 100 concurrent in-flight fetch requests.

**How to avoid:**
Use **schedule-after-complete** pattern instead of fixed-interval:
```typescript
async function runCheck(monitor: Monitor) {
  const start = Date.now();
  try {
    const result = await performCheck(monitor); // has its own AbortController timeout
    await saveResult(monitor.id, result);
    await sendAlertsIfNeeded(monitor, result);
  } finally {
    // Schedule next check after this one completes
    setTimeout(() => runCheck(monitor), monitor.intervalMs);
  }
}
```
This means checks are spaced by `interval` *after* each completion, not on a wall-clock boundary. This is always correct for home lab scale.

**Warning signs:**
- Response time graphs trend upward over days without restarts
- Memory grows steadily (check node/process RSS)
- DB write rate higher than expected (monitor count × interval)
- Restart "fixes" slow response times temporarily

**Phase to address:**
Phase that implements the core scheduler. Bake this pattern in from day one — it's not a refactor you want to do after accumulating check history.

---

### Pitfall 3: No Confirmation Threshold — Single-Failure Alerts Fire Too Eagerly

**What goes wrong:**
A single failed check immediately triggers an alert. Network blips, DNS hiccups, momentary host restarts, and reverse proxy reloads all cause single-check failures. Without a confirmation window, you get paged for a service that recovered in 15 seconds. This is the definition of an alert storm: your Discord channel fills up with "DOWN / UP / DOWN / UP" pairs within minutes.

**Why it happens:**
The obvious implementation fires the alert directly in the check result handler. The confirmation threshold feels like "extra complexity for later" — but by the time you add it, you've already been paged 50 times for false positives.

**How to avoid:**
Store a `consecutive_failures` counter per monitor in the DB (or in memory, reset on success). Only transition state to "down" after N consecutive failures (default: 2 or 3). Only alert on state transition, not on every failure:
```typescript
// Schema addition: monitors.consecutiveFailures (int, default 0)
// Schema addition: monitors.currentStatus ('up' | 'down', default 'up')

if (checkFailed) {
  monitor.consecutiveFailures++;
  if (monitor.consecutiveFailures >= monitor.confirmationThreshold && monitor.currentStatus === 'up') {
    monitor.currentStatus = 'down';
    await sendDownAlert(monitor); // fires ONCE on transition
  }
} else {
  if (monitor.currentStatus === 'down') {
    await sendUpAlert(monitor); // fires ONCE on recovery
  }
  monitor.consecutiveFailures = 0;
  monitor.currentStatus = 'up';
}
```

**Warning signs:**
- Discord receiving paired DOWN/UP notifications minutes apart
- Alerts firing for services you know had only a momentary restart
- You start ignoring alerts (the worst outcome)

**Phase to address:**
Phase that implements alerting. Also expose `confirmationThreshold` as a per-monitor config in the DB schema from the start — it costs nothing to add and prevents a schema migration later.

---

### Pitfall 4: Database Grows Without Bounds — Check History Fills the Disk

**What goes wrong:**
At 60-second intervals for 100 monitors, you write ~1,440 rows per monitor per day = 144,000 rows/day. After 90 days: ~13 million rows. PostgreSQL handles this fine query-wise with proper indexes, but the table grows indefinitely. Unindexed or poorly indexed time-range queries (for the response time graph) scan millions of rows. Disk eventually fills.

**Why it happens:**
Storing every check result indefinitely feels "free" initially. Developers defer the retention question. By the time it matters, migration is painful because you now have months of data.

**How to avoid:**
Two-part strategy:
1. **Index aggressively from day one**: `(monitor_id, checked_at DESC)` composite index on the check results table. All time-range queries use both columns.
2. **Implement retention cleanup from the start**: A daily cleanup job deletes rows older than a configurable retention window (default: 90 days). Run it as a `setTimeout`-based background task on server startup.

```sql
-- Drizzle migration — add this index
CREATE INDEX idx_check_results_monitor_time 
  ON check_results (monitor_id, checked_at DESC);

-- Cleanup query (run daily)
DELETE FROM check_results 
WHERE checked_at < NOW() - INTERVAL '90 days';
```

At 90-day retention: ~13M rows total, ~300MB with a pg/drizzle typical row size. Manageable forever.

**Warning signs:**
- Dashboard response time graph queries taking > 500ms
- PostgreSQL table size growing linearly with no bound
- `EXPLAIN ANALYZE` on time-range queries shows Seq Scan

**Phase to address:**
Phase that creates the DB schema. Add the index and retention job at schema creation time — not "later."

---

### Pitfall 5: In-Process Scheduler Orphans Timers on Graceful Shutdown

**What goes wrong:**
When `docker compose restart` or a code-reload happens, the Bun/Elysia process receives SIGTERM. If `setTimeout`/`setInterval` handles are not cleared, Bun may keep the event loop alive waiting for timers. Worse: if the PostgreSQL connection is closed by the time timers fire (in Bun's shutdown sequence), DB writes from in-flight checks throw unhandled errors. Docker then force-kills the container after the stop grace period (default 10s), potentially mid-write.

**Why it happens:**
Elysia's lifecycle (`onStop`) exists but requires explicit wiring. Without registering a stop handler, there's no place to clear timers and abort in-flight checks.

**How to avoid:**
Maintain a `Map<monitorId, ReturnType<typeof setTimeout>>` of all active timer handles. Register an Elysia stop handler:
```typescript
const app = new Elysia()
  .onStop(async () => {
    // 1. Clear all scheduled timers
    for (const handle of schedulerHandles.values()) clearTimeout(handle);
    // 2. Abort all in-flight check AbortControllers
    for (const controller of inFlightChecks.values()) controller.abort();
    // 3. Wait briefly for DB writes to complete (or let them fail gracefully)
    await drainPendingWrites();
  })
```

**Warning signs:**
- "Cannot use closed connection" errors in Docker logs on restart
- Container takes > 10s to stop (Docker force-kills it)
- Check results missing for the restart period

**Phase to address:**
Phase that implements the core scheduler. Graceful shutdown is not a "later" concern — it must be wired at the same time the scheduler is built.

---

### Pitfall 6: DNS Resolution Failures Inside Docker Cause False Downtimes

**What goes wrong:**
Docker containers use the Docker internal DNS resolver (`127.0.0.11`) which in turn forwards to the host resolver. Under certain Docker network configurations (custom networks, Pi-hole in the same compose stack, or VPN tunnels on the host), DNS resolution for external domains intermittently fails with `EAI_AGAIN` (temporary DNS failure). This makes external HTTP monitors appear down when the services are actually up — as documented in Uptime Kuma issue #114 (pihole in same compose + monitors for google.com both failing).

**Why it happens:**
The monitoring container's network stack is isolated. When DNS fails (even briefly), `fetch()` throws immediately and looks like a service outage. Without distinguishing DNS failures from HTTP failures, both are recorded as "down."

**How to avoid:**
- **Check DNS separately from HTTP**: catch DNS-related errors (`EAI_AGAIN`, `ENOTFOUND`) and log them as a distinct `dns_error` status rather than `down`. Don't fire "service down" alerts for DNS failures — fire a separate "DNS warning" or suppress alert until N consecutive DNS failures.
- **Use explicit DNS server configuration** in Dockerfile/compose if you control DNS (e.g., `dns: 8.8.8.8` in compose service).
- For home lab where all targets are internal IPs, use IPs directly rather than hostnames in monitors.

**Warning signs:**
- Monitors going "down" briefly and recovering immediately, especially multiple at once
- Error messages containing `EAI_AGAIN`, `ENOTFOUND`
- All external monitors failing simultaneously (never internal ones) — strong DNS indicator

**Phase to address:**
Phase that implements HTTP checks. The check result should record `error_type` (timeout, dns, connection_refused, wrong_status) to enable better diagnosis in the dashboard.

---

### Pitfall 7: Alert Deduplication — Resending Alerts on Restart

**What goes wrong:**
If the application restarts while a monitor is in "down" state, it doesn't know the last alert was already sent. On startup, it checks all monitors, finds them "down," and fires the "down" alert again. If you're using per-monitor in-memory state instead of DB-persisted state, every restart triggers duplicate alerts for all currently-down monitors.

**Why it happens:**
In-memory state is simpler to implement initially. The restart scenario doesn't come up in dev testing. In production, container restarts happen regularly (deployments, OOM kills, host reboots).

**How to avoid:**
Persist monitor state in the DB: `monitors.current_status` ('up' | 'down') and `monitors.last_alerted_at`. On startup, load these from DB before starting checks. Only send an alert when `current_status` changes — not merely when a check fails.

This is the same schema addition as Pitfall 3 (consecutive failures counter). Both require persistent state — implement them together.

**Warning signs:**
- Discord getting flooded with "DOWN" alerts immediately after every deployment
- Duplicate DOWN alerts with no corresponding UP transition

**Phase to address:**
Phase that implements alerting. The DB schema for `monitors.current_status` must exist before alerts are wired.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `setInterval` instead of schedule-after-complete | Simpler to write | Timer pileup on slow/down targets; misleading response times | Never — schedule-after-complete is not harder to write |
| In-memory monitor state only | No DB migration needed | Duplicate alerts every restart | Only in early prototype before any alerting exists |
| No retention cleanup | Skip one feature | Unbounded DB growth; query slowdown in months | Never for production deployment |
| Skip `NET_RAW` cap_add with ICMP check | Avoids "privileged container" concerns | Ping checks silently always return "up" | Never — use TCP ping instead if NET_RAW is unacceptable |
| Status page uses same auth session check as admin | Reuse auth middleware | Public status page breaks if session cookie is missing or expired | Never — status page must be truly unauthenticated |
| No `AbortController` timeout on `fetch()` | Less code | HTTP checks hang indefinitely on unresponsive services, blocking event loop | Never — always set a fetch timeout |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Discord webhook | Sending one webhook call per check (not per state change) | Only send on `up→down` and `down→up` transitions; include monitor name + URL in body |
| Discord webhook | No rate limiting — rapid state flapping sends hundreds of messages | Implement cooldown: don't re-alert the same monitor within N minutes |
| Email (SMTP) | Using `nodemailer`-style fire-and-forget; errors silently swallowed | Await send, catch errors, log failure — don't crash the check worker |
| PostgreSQL / Drizzle | Opening a new pg connection per check | Use connection pool (pg's built-in pool); share across all concurrent checks |
| PostgreSQL / Drizzle | Running retention DELETE inside a transaction holding a table lock | Run retention as a standalone query outside any active transaction; use `pg_sleep` spread if deleting large volumes |
| Bun `fetch()` | Default fetch has no timeout — hangs indefinitely for unreachable hosts | Wrap every check in `AbortController` with `signal: AbortSignal.timeout(checkTimeoutMs)` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Querying all check history per monitor load | Dashboard slow to open; response time graph takes 2-5s | Use time-bounded queries: always `WHERE monitor_id = ? AND checked_at > NOW() - INTERVAL '30 days'`; add composite index | ~50 monitors after 30 days |
| Fetching full check rows for uptime % calculation | Uptime % query scans millions of rows for COUNT | Pre-aggregate into hourly/daily summary table, or use `COUNT(*) FILTER (WHERE status = 'up')` with index | ~100k rows in check_results |
| Loading all monitors at startup before scheduler begins | Startup blocks on large monitor list | Fine for 100 monitors; don't optimize prematurely | Not a concern at home lab scale |
| Returning all check history in a single API response | Frontend render freeze on large datasets | Paginate or limit to last N checks / time window in API | > 1000 rows returned |
| Public status page queries same heavy endpoints as admin | Public page slows under link-sharing traffic | Status page API should use simple, indexed, small queries: just current status + last 7 days aggregated | Any real external traffic |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Public status page endpoint behind `auth` middleware | Status page returns 401 to unauthenticated visitors — defeats purpose | Ensure status page routes bypass Better Auth middleware entirely; test with fresh incognito tab |
| Admin dashboard accessible without login | Anyone with the URL can see all monitors and manage them | Confirm Better Auth session check on all `/admin/*` routes; add e2e test for unauthenticated access returning 401/redirect |
| Webhook URLs (Discord, Slack) stored in plaintext in DB | URL exposure = anyone can send messages to your Discord | Acceptable at home lab scale; document that DB access = webhook access. Don't log webhook URLs in application logs |
| SMTP credentials in environment variables, logged on startup | Password exposed in container logs | Use `@t3-oss/env-core` (already in stack) for env validation but never log the raw value; mask in startup output |
| Monitor URLs visible on public status page | Internal hostnames/IPs exposed (e.g., `http://192.168.1.100:8080/admin`) | Public status page should show only monitor **name** and status — not the URL being checked |
| Status page without any CSRF protection | Unnecessary — it's read-only, no mutations | N/A — but admin dashboard mutations must have CSRF protection (Better Auth provides this) |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing "last checked 30s ago" without auto-refresh | Dashboard feels stale; user unsure if data is current | Auto-refresh dashboard every 30s, or use SSE/WebSocket for live status push |
| Displaying raw millisecond timestamps | "1711234567890" is unreadable | Use relative time ("2 minutes ago") + absolute on hover |
| No visual distinction between "never checked" and "currently down" | New monitors look broken before first check | Show a "pending" state for monitors that haven't completed their first check |
| Uptime % with no time range context | "99.9% uptime" means nothing without knowing the window | Always display time range label: "99.9% (last 30 days)" |
| Alert on every check failure, not on state transition | Notification fatigue — user stops reading alerts | As per Pitfall 3: alert on transition only, include downtime duration in recovery alert |
| Response time graph with no units labeled | Y-axis "400" — is that ms? seconds? | Label axes: "Response time (ms)" |

---

## "Looks Done But Isn't" Checklist

- [ ] **Ping monitors:** Verify actual ICMP packets are sent by checking with `tcpdump` inside container, OR verify TCP fallback is explicitly documented and intentional
- [ ] **Alerting:** Confirm alerts fire exactly once on DOWN, once on UP — not on every failed check; test by restarting container while a monitor is down
- [ ] **Public status page:** Test in fresh incognito window with no cookies — must load without any 401/redirect
- [ ] **DB retention:** Verify `DELETE` job actually runs (add log output) and check PostgreSQL table size after 7 days of operation
- [ ] **Graceful shutdown:** Run `docker compose restart` and verify no "connection closed" errors in logs; check no duplicate alerts fire post-restart
- [ ] **Scheduler:** Verify no timer pileup under slow targets — artificially add a 25s sleep to a check handler and confirm the scheduler doesn't launch a second concurrent check for the same monitor
- [ ] **Timeouts:** Confirm `fetch()` uses `AbortSignal.timeout()` — block a monitored URL at the firewall and verify the check fails in < `checkTimeout` seconds
- [ ] **Uptime %:** Manually calculate expected uptime for a monitor with known history; compare to displayed value

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Timer pileup discovered after 2 weeks | MEDIUM | Restart container (immediate fix); deploy schedule-after-complete; clean up any duplicate check results |
| DB too large (no retention) | MEDIUM | Add retention job; run `DELETE FROM check_results WHERE checked_at < NOW() - INTERVAL '90 days'` in batches; `VACUUM ANALYZE check_results` |
| Silent ICMP failure discovered | LOW | Add `NET_RAW` cap or switch to TCP ping; no data loss; existing DOWN/UP history is just wrong (shows always UP) |
| Alert storm after adding confirmation threshold | LOW | Set `consecutive_failures = 0` for all monitors; update threshold in config; no data migration needed |
| Duplicate alerts on restart | LOW | Set `current_status` in DB for all currently-known-down monitors before deploying fix |
| Public status page behind auth | LOW | Remove auth middleware from status routes; re-deploy |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| ICMP ping Docker permissions | Ping/host monitor implementation phase | `docker compose up` without NET_RAW → confirm clear error or TCP fallback; with NET_RAW → confirm real ICMP |
| Timer pileup (setInterval) | Core scheduler implementation phase | Inspect scheduler code for `setInterval`; confirm schedule-after-complete pattern |
| No confirmation threshold | Alerting phase | Test: one failed check does NOT send alert; two consecutive failures DO |
| Unbounded DB growth | DB schema phase | Schema review: retention job + composite index exist in initial migration |
| Orphaned timers on shutdown | Core scheduler implementation phase | `docker compose restart` produces no DB errors; alerts don't re-fire |
| DNS failures → false downtimes | HTTP check implementation phase | Error type is captured; DNS errors don't trigger DOWN alert |
| Duplicate alerts on restart | Alerting phase | `current_status` persisted in DB; restart with a monitor "down" doesn't re-alert |
| Status page exposes internal URLs | Public status page phase | Status page API response contains no URLs; only names + status |
| Status page behind auth | Public status page phase | Incognito access test passes |

---

## Sources

- Uptime Kuma issue #2344: "Monitors all slow down over time" — confirmed timer pileup root cause (https://github.com/louislam/uptime-kuma/issues/2344)
- Uptime Kuma issue #114: `EAI_AGAIN` DNS errors in Docker with Pi-hole in same compose stack (https://github.com/louislam/uptime-kuma/issues/114)
- Uptime Kuma issue #275: False timeouts in Docker for Desktop / WSL2 — SNAT exhaustion and network isolation confirmed (https://github.com/louislam/uptime-kuma/issues/275)
- Docker official docs: `NET_RAW` capability required for raw socket/ICMP access; not granted by default (https://docs.docker.com/engine/containers/run/#runtime-privilege-and-linux-capabilities)
- PostgreSQL docs: Table partitioning and retention patterns for time-series data (https://www.postgresql.org/docs/current/ddl-partitioning.html)
- Elysia lifecycle docs: `onStop` hook confirmed for graceful shutdown wiring (https://elysiajs.com/essential/life-cycle.html)

---
*Pitfalls research for: self-hosted uptime monitoring (Bun/Elysia/PostgreSQL/Docker)*
*Researched: 2026-03-30*
