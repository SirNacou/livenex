# Feature Research

**Domain:** Self-hosted uptime monitoring (personal home lab)
**Researched:** 2026-03-30
**Confidence:** HIGH — sourced from direct inspection of Uptime Kuma (84k ⭐), Gatus (10.5k ⭐), Upptime (17k ⭐), Better Stack, Statping, Cachet, and community comparisons.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist from day one. Missing any of these causes the tool to feel broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| HTTP/HTTPS endpoint monitoring | Core purpose — checking if a URL returns a healthy response | LOW | Poll URL, check status code, record result. Uptime Kuma, Gatus, Statping all do this as the very first feature. |
| ICMP ping (host monitoring) | Home labs have devices that don't expose HTTP — NAS, router, switches, VMs | LOW | Raw ICMP ping requires elevated privileges or a library like `node-ping`; Bun has access to system calls |
| Configurable per-monitor check interval | Home lab services vary wildly in criticality; 30s for the router, 5m for a backup | LOW | A global interval is a deal-breaker; Uptime Kuma popularized per-monitor intervals |
| Up/down state tracking with timestamps | Without knowing when it went down and for how long, monitoring is useless | LOW | State transitions are the core data model: store `is_up`, `changed_at`, `duration` |
| Response time recording | Users want to see if a service is degrading before it goes down | LOW | Record `response_time_ms` alongside every check result |
| Uptime percentage display (7d, 30d, 90d) | The industry-standard "SLA view" — every comparable tool surfaces this | MEDIUM | Aggregate window queries on check history; Uptime Kuma, Gatus, Upptime all show these periods |
| Response time graph (sparkline or chart) | Trend visibility — is response time climbing? | MEDIUM | Time-series chart per monitor; Uptime Kuma and Gatus both render these prominently |
| Down/up alert via webhook (Discord, Slack) | Home lab users live in Discord/Slack; email alone feels like 2005 | LOW | POST to a webhook URL on state change; Uptime Kuma, Gatus both support this |
| Email alert on state change | Fallback channel; many users still want email for "real" incidents | LOW | SMTP send on state change; essentially every tool in this space supports it |
| Public status page (no auth required) | Shareable view for "is my stuff up?" from outside the network | MEDIUM | Separate read-only route; Uptime Kuma, Upptime, Gatus, Better Stack all feature this |
| Protected admin dashboard (login required) | Monitoring config must not be publicly writable | LOW | Already handled by Better Auth in the scaffold — gate the dashboard behind session |
| Incident history (list of past outages with duration) | Users want to review what went down, when, and for how long | MEDIUM | Derive from state change events; Uptime Kuma calls these "heartbeat" events |
| Monitor enable/disable toggle | Temporarily silencing a monitor during maintenance is essential UX | LOW | A single boolean on the monitor record; avoids alert spam during planned work |
| Docker-compose deployment | Home lab users deploy everything in Docker; must be a single `docker compose up` | LOW | Dockerfile + compose.yaml; Uptime Kuma, Gatus both ship this as their primary install method |

---

### Differentiators (Competitive Advantage)

Features that aren't expected but create meaningful value for this project's use case.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Monitor grouping / tagging | With 20-100 monitors, flat lists become unmanageable; groups let you see "Network," "Services," "Media" at a glance | MEDIUM | Gatus does this with `group` field; Uptime Kuma supports tags; a simple `group` string column with group-level summary on the dashboard |
| SSL certificate expiration check | Home labs often run self-signed or Let's Encrypt certs — forgetting to renew kills services silently | LOW-MEDIUM | Gatus has `[CERTIFICATE_EXPIRATION]` condition; check cert expiry as a derived field on HTTP monitors and warn N days before |
| Configurable expected HTTP status code | Not all healthy services return 200; redirects (301/302), authenticated endpoints (401), or health endpoints might return 204 | LOW | Add `expected_status` field to monitor; default 200; Gatus builds an entire condition system around this |
| Alert cooldown / repeat interval | Without a cooldown, a flapping service spams alerts; Uptime Kuma's users cite this as critical | LOW-MEDIUM | Don't re-alert if already in a known-down state; only alert on state transitions |
| Maintenance window (suppress alerts) | Scheduled restarts or updates should not page you; every serious tool has this | MEDIUM | Gatus and Uptime Kuma both have maintenance window scheduling; time-range based alert suppression |
| Response time threshold alerting | Slow is sometimes worse than down; alerting when response time exceeds a threshold catches degradation early | MEDIUM | Gatus supports `[RESPONSE_TIME] < 300ms` conditions; adds a `warn_threshold_ms` field to monitors |
| Monitor reachability from the dashboard | "Is this down for me or down for everyone?" — one-click manual check without waiting for the next interval | LOW | Trigger an immediate ad-hoc check from the UI; doesn't change the scheduler, just returns a live result |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly not build for this scope.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multi-user / team accounts | "My family wants to check status too" | Adds auth complexity (roles, permissions, invites) that dwarfs everything else; scope says single-admin | Public status page already covers the read-only case for other viewers |
| SMS alerts | Feels like the "real" escalation channel | Requires third-party API (Twilio, etc.), cost, and phone number management; Discord/email is sufficient for home lab | Discord webhook is near-instant and zero-cost |
| Mobile app | Want notifications on phone | Web is responsive and PWA-capable; a native app is months of out-of-scope work | Browser notifications via a PWA or just Discord DMs |
| Agent-based / push monitoring | "I want to monitor services I can't reach from the server" | Fundamentally changes the architecture from pull-only to push+pull hybrid; significant protocol complexity | Keep all checks pull-only from the same host; cover internal hosts via the LAN |
| Real-time WebSocket dashboard | "I want live updates without refresh" | Adds a persistent connection layer to every client, complicates SSR architecture (TanStack Start + Elysia), and the value at home-lab check intervals (30s–5m) is minimal | Poll at 30-second intervals with a simple client-side timer or server-sent events as a later enhancement |
| Distributed / multi-region checks | "Is it down globally or just from my location?" | Requires external cloud agents or a fleet of VMs — entirely out of scope for a home lab tool | Single-node is the right fit for 20-100 home-lab monitors; note false positives are a risk of being on the same network |
| Status page subscriber emails | "Let users subscribe to outage notifications by email" | Requires email list management, unsubscribe flows, and GDPR-style consent tracking | Share the status page URL; Discord/webhook alerts cover all notification needs for this use case |
| Custom metrics / arbitrary data push (Prometheus-style) | "I want to show CPU graphs alongside uptime" | Turns the tool into a general observability platform; massive scope creep | Use Grafana or Prometheus for infrastructure metrics; this tool is uptime-only |

---

## Feature Dependencies

```
HTTP Monitor (URL, interval, expected_status)
    └──requires──> Check Scheduler (background poller)
                       └──requires──> Check Result Storage (DB)
                                          └──enables──> Uptime % Calculation
                                          └──enables──> Response Time Graph
                                          └──enables──> Incident History
                                          └──enables──> Public Status Page (read-only view)

Host Monitor (IP/hostname, ping)
    └──requires──> Check Scheduler (same scheduler)

State Change Detection (up→down, down→up)
    └──requires──> Check Result Storage
    └──enables──> Alert on State Change (Discord/Slack webhook)
    └──enables──> Alert on State Change (email/SMTP)
    └──enables──> Incident Duration Tracking

Admin Dashboard
    └──requires──> Authentication (Better Auth — already in scaffold)
    └──requires──> Check Result Storage (to display data)

Monitor Enable/Disable
    └──enhances──> Check Scheduler (skip disabled monitors)
    └──enhances──> Alert on State Change (no alerts for disabled monitors)

SSL Certificate Check
    └──enhances──> HTTP Monitor (derived from the TLS handshake)

Alert Cooldown
    └──enhances──> Alert on State Change (prevents spam on flapping services)

Monitor Groups
    └──enhances──> Admin Dashboard (grouped display)
    └──enhances──> Public Status Page (group-level summary rows)

Maintenance Window
    └──requires──> Monitor record (time window metadata)
    └──enhances──> Alert on State Change (suppresses alerts during window)
```

### Dependency Notes

- **Check Scheduler requires Check Result Storage:** Scheduler is meaningless without persistence; these must ship in the same phase.
- **State Change Detection requires Check Result Storage:** You need the previous state to know if something changed; this is the first derived concept on top of raw check results.
- **Alert channels enhance State Change Detection:** They're opt-in — the core is working without them, but they are the killer feature.
- **Public Status Page requires Check Result Storage:** It's a read view of existing data; no new write logic needed.
- **Admin Dashboard requires Authentication:** The scaffold already has Better Auth; this is mostly a routing concern.
- **SSL Certificate Check enhances HTTP Monitor:** Not a separate monitor type — it's additional metadata from the same request, available at low cost.

---

## MVP Definition

### Launch With (v1)

The absolute minimum that makes the tool useful for day-to-day home lab monitoring.

- [x] HTTP/HTTPS endpoint monitoring (URL, interval, expected status code)
- [x] ICMP ping host monitoring (hostname/IP, interval)
- [x] Per-monitor check intervals (not global)
- [x] Check result storage (up/down, response time, timestamp)
- [x] State change detection (up→down, down→up transitions)
- [x] Admin dashboard with current status for all monitors (auth-gated)
- [x] Uptime % per monitor for 7d, 30d, 90d windows
- [x] Response time graph per HTTP monitor
- [x] Incident history with duration
- [x] Public status page (no login)
- [x] Discord/Slack webhook alerts on state change
- [x] Email (SMTP) alerts on state change
- [x] Monitor enable/disable toggle
- [x] Docker + docker-compose deployment

### Add After Validation (v1.x)

Features to add once the core is stable and in daily use.

- [ ] Monitor grouping — add once you have enough monitors that flat lists become noisy (10+ monitors is the inflection point)
- [ ] SSL certificate expiration check — add once you've caught a forgotten cert expiry
- [ ] Alert cooldown / deduplication — add if you experience alert spam from a flapping service
- [ ] Configurable expected HTTP status code — add when you add a monitor that doesn't return 200
- [ ] Manual "check now" trigger in the UI — low effort, high UX value

### Future Consideration (v2+)

Defer these until the tool is in regular use and gaps emerge naturally.

- [ ] Maintenance windows — adds scheduling complexity; start by just disabling monitors during maintenance
- [ ] Response time threshold alerting — genuinely useful but adds condition logic to the data model; add after the core stabilizes
- [ ] Status page incident announcements (manual text updates during an outage) — adds content management; useful for sharing the status page publicly

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| HTTP endpoint monitoring | HIGH | LOW | P1 |
| ICMP ping monitoring | HIGH | LOW | P1 |
| Check result storage + scheduler | HIGH | MEDIUM | P1 |
| State change detection | HIGH | LOW | P1 |
| Admin dashboard (current status) | HIGH | MEDIUM | P1 |
| Uptime % (7d/30d/90d) | HIGH | MEDIUM | P1 |
| Discord/Slack webhook alert | HIGH | LOW | P1 |
| Email alert | HIGH | LOW | P1 |
| Public status page | HIGH | MEDIUM | P1 |
| Auth-gated admin | HIGH | LOW | P1 (scaffold already has Better Auth) |
| Response time graph | MEDIUM | MEDIUM | P1 |
| Incident history list | MEDIUM | LOW | P1 |
| Monitor enable/disable | MEDIUM | LOW | P1 |
| Docker deploy | HIGH | LOW | P1 |
| Monitor grouping | MEDIUM | LOW | P2 |
| SSL cert expiry check | MEDIUM | LOW | P2 |
| Alert cooldown | MEDIUM | LOW | P2 |
| Configurable expected status code | MEDIUM | LOW | P2 |
| Manual check-now trigger | LOW | LOW | P2 |
| Maintenance windows | MEDIUM | MEDIUM | P3 |
| Response time threshold alerts | MEDIUM | MEDIUM | P3 |
| Status page incident announcements | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Uptime Kuma | Gatus | Upptime | Livenex approach |
|---------|-------------|-------|---------|-----------------|
| HTTP monitoring | ✅ | ✅ | ✅ | ✅ Build first |
| Ping monitoring | ✅ | ✅ (ICMP) | ❌ | ✅ Core scope |
| Per-monitor intervals | ✅ | ✅ | ❌ (GitHub Actions minimum 5m) | ✅ Critical for home lab |
| Uptime % display | ✅ 24h/7d/30d | ✅ | ✅ | ✅ 7d/30d/90d windows |
| Response time graphs | ✅ | ✅ | ✅ (generated) | ✅ Per HTTP monitor |
| Public status page | ✅ Multiple | ✅ | ✅ | ✅ Single page, no auth |
| Discord/Slack alerts | ✅ | ✅ | ✅ (GitHub Issues) | ✅ Webhook-based |
| Email alerts | ✅ SMTP | ✅ AWS SES / SMTP | ❌ | ✅ SMTP |
| Incident history | ✅ | ✅ | ✅ (GitHub Issues) | ✅ |
| Monitor groups | ✅ tags | ✅ groups | ❌ | P2 (v1.x) |
| SSL cert check | ✅ info panel | ✅ condition | ❌ | P2 (v1.x) |
| Maintenance windows | ✅ | ✅ | ❌ | P3 (v2+) |
| Alert cooldown | ✅ | ✅ (failure threshold) | ❌ | P2 (v1.x) |
| Multi-user | ✅ (v2) | ❌ | ❌ | ❌ Out of scope |
| Config-file driven | ❌ (GUI only) | ✅ YAML | ❌ | GUI-first like Uptime Kuma — config-file approach suits ops teams, not home lab users who want a UI |
| Docker deploy | ✅ Primary install | ✅ | ❌ (GitHub-hosted) | ✅ Must ship Dockerfile + compose |

**Key observation:** Uptime Kuma is the most direct reference for Livenex — GUI-driven, Docker-primary, broad notification support. Gatus is more developer/ops-oriented (config-file YAML). Livenex should follow Uptime Kuma's UX philosophy with a proper UI while adopting Gatus's sensible data model.

---

## Sources

- Uptime Kuma README + Wiki: https://github.com/louislam/uptime-kuma (84.7k ⭐, 100M+ Docker pulls)
- Gatus README (comprehensive): https://github.com/TwiN/gatus (10.5k ⭐)
- Upptime README: https://github.com/upptime/upptime (17k ⭐)
- Better Stack Uptime features: https://betterstack.com/uptime
- Better Stack status page comparison (2026): https://betterstack.com/community/comparisons/free-status-page-tools/
- Livenex PROJECT.md: .planning/PROJECT.md

---
*Feature research for: self-hosted uptime monitoring (home lab, 20-100 monitors)*
*Researched: 2026-03-30*
