# Architecture Research

**Domain:** Personal uptime monitoring, alerting, and status-page application
**Researched:** 2026-03-26
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                           Presentation Layer                              │
├────────────────────────────────────────────────────────────────────────────┤
│  Admin UI                 Public Status Page            API/Auth          │
│  - monitor CRUD           - component/group view        - session/API key │
│  - incidents              - incident timeline           - webhooks        │
│  - notifications          - uptime summaries            - heartbeat URLs  │
├────────────────────────────────────────────────────────────────────────────┤
│                            Application Layer                              │
├────────────────────────────────────────────────────────────────────────────┤
│  Monitor Config   Scheduler   Check Runner   Evaluator/Incident Engine    │
│  Maintenance      Heartbeats  Result Store   Notification Dispatcher      │
│  Status Mapper    Uptime Calc Audit Log      Status Page Publisher        │
├────────────────────────────────────────────────────────────────────────────┤
│                               Data Layer                                  │
├────────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL                 Redis / Queue                Objectless v1     │
│  - config/state             - due jobs                   - no blob store   │
│  - incidents                - async notifications        - not needed      │
│  - check results            - retry/backoff                                  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Admin/API | Owns monitor setup, group/tag mapping, incident review, maintenance windows, auth, and settings | Server-rendered app or SPA backed by HTTP API |
| Scheduler | Decides what check or timeout evaluation is due next | DB-backed poller or Redis-backed scheduled jobs |
| Check Runner | Executes HTTP, ping/TCP, keyword/content, SSL, and heartbeat evaluations | Background worker with per-monitor adapters |
| Result Evaluator | Converts raw check results into state transitions using retries, grace windows, and maintenance suppression | Explicit incident state machine in application code |
| Incident Manager | Opens/closes incidents and records timeline events exactly once | Transactional service over PostgreSQL |
| Notification Dispatcher | Sends one down and one resolved notification pair, with channel-specific retry | Async job queue worker |
| Status Page Publisher | Projects internal monitor/group state into public component status and incident feed | Read model or direct query layer with short cache |
| Uptime Calculator | Maintains 24h, 7d, and 30d uptime summaries | Incremental aggregation job over check results/incidents |

## Recommended Project Structure

```text
src/
├── app/                     # HTTP routes, auth, page handlers, API surface
├── modules/
│   ├── monitors/            # monitor definitions, validation, adapters
│   ├── scheduling/          # due-check selection, leases, worker triggers
│   ├── checks/              # protocol executors: http, tcp, ssl, heartbeat
│   ├── incidents/           # failure confirmation, incident lifecycle
│   ├── notifications/       # channels, templates, dispatch jobs
│   ├── status-pages/        # public projections, component status mapping
│   ├── maintenance/         # suppression windows and planned maintenance
│   └── reporting/           # uptime rollups and dashboard summaries
├── db/
│   ├── schema/              # migrations and table definitions
│   └── queries/             # shared query primitives
├── jobs/                    # worker entrypoints and queue consumers
├── lib/                     # time, retries, HTTP client, observability
└── tests/                   # module and end-to-end tests
```

### Structure Rationale

- **`modules/`:** Keep domain boundaries explicit so monitor execution logic does not leak into status-page rendering or notification delivery.
- **`jobs/`:** Background work needs separate entrypoints even if v1 ships as a modular monolith.
- **`db/`:** Incident correctness depends on careful schema design and transactional queries; isolating database code makes that visible early.

## Recommended Architecture

Use a **modular monolith with background workers** for v1.

That is the standard shape for personal and SMB uptime products because the hard part is correctness of the monitoring pipeline, not independent service scaling. One codebase and one PostgreSQL database keep development and debugging simple, while background workers isolate slow or failure-prone work such as outbound probes and notification delivery.

Do **not** start with microservices. At Livenex scale, the likely load is 20 to 50 monitors, and the primary risk is bad state transitions or alert duplication, not horizontal scaling limits.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Monitor Control Plane | CRUD for monitors, tags/groups, intervals, timeouts, retries, maintenance rules, notification bindings | Scheduler, Status Page Mapper, Admin UI |
| Scheduler | Selects due monitors and heartbeat deadlines; issues leases so work is claimed once | Check Runner, PostgreSQL, Redis/Queue |
| Check Runner | Performs actual probe execution and writes normalized check results | Result Evaluator, Result Store |
| Result Evaluator | Applies confirmation rules and turns sequences of results into `up/down/degraded/missed` transitions | Incident Manager, Uptime Calculator |
| Incident Manager | Creates/resolves incidents and timeline events idempotently | Notification Dispatcher, Status Page Publisher |
| Notification Dispatcher | Sends alerts after incident transitions, not directly from probes | Email/webhook/push providers |
| Status Page Projection | Maps internal monitor/tag state to public components and incident feed | Public Status UI/API |
| Uptime Reporting | Computes rolling uptime windows for private dashboard and public pages | Dashboard, Status Page Projection |

## Architectural Patterns

### Pattern 1: Scheduler + Leased Workers

**What:** One process determines due work; worker processes claim a lease before executing a check.
**When to use:** Always. Even small uptime systems need protection against duplicate probe execution.
**Trade-offs:** Slightly more code than in-process timers, but it prevents double alerts when multiple instances run.

**Example:**
```typescript
const due = await schedulingRepo.findDueMonitors(now);

for (const monitor of due) {
  const leased = await schedulingRepo.tryAcquireLease(monitor.id, workerId, now);
  if (!leased) continue;
  await queue.enqueue("run-check", { monitorId: monitor.id, leaseOwner: workerId });
}
```

### Pattern 2: Incident State Machine Separate From Probe Logic

**What:** Raw check results are facts; incident transitions are derived by a dedicated state machine.
**When to use:** Always. This is what lets retries, heartbeat grace periods, maintenance suppression, and one-shot alerts coexist cleanly.
**Trade-offs:** Requires more schema and tests, but avoids mixing transport errors with alert policy.

**Example:**
```typescript
if (result.kind === "failure" && state.consecutiveFailures + 1 >= monitor.failureThreshold) {
  return incidentService.confirmDown(monitor.id, result.observedAt);
}

if (result.kind === "success" && state.current === "down") {
  return incidentService.resolve(monitor.id, result.observedAt);
}
```

### Pattern 3: Status Page As A Read Model

**What:** Public status pages should read from projected component status plus incident history, not directly from raw probe rows.
**When to use:** As soon as public pages exist.
**Trade-offs:** Adds one more projection/update path, but keeps public rendering simple and cacheable.

## Data Flow

### Monitor Check Flow

```text
Admin/API
  ↓ create monitor
PostgreSQL (monitor config)
  ↓ queried by due time
Scheduler
  ↓ enqueue leased job
Check Runner
  ↓ normalized result
Result Store
  ↓ evaluate threshold / grace / maintenance
Result Evaluator
  ↓ open/resolve incident if state changed
Incident Manager
  ├─→ Notification Dispatcher → Email/Webhook/etc.
  ├─→ Uptime Calculator
  └─→ Status Page Projection
```

### Heartbeat Flow

```text
External job / cron
  ↓ ping unique heartbeat URL
Heartbeat Endpoint
  ↓ record last-seen and expected-next deadline
Heartbeat Store
  ↓ scheduler detects missed deadline
Result Evaluator
  ↓ incident + resolved lifecycle
Incident Manager
```

### Public Status Flow

```text
Monitor state + incident timeline + group/tag mapping
  ↓ projection
Status Page Read Model
  ↓ short cache
Public Status Page/API
```

### Key Data Flows

1. **Config to execution:** Monitor definitions flow from admin CRUD into the scheduler; workers never invent policy.
2. **Execution to truth:** Check runners emit normalized results only; incident logic lives downstream.
3. **Truth to alerts:** Notifications are triggered from incident transitions, not from each failed probe.
4. **Truth to public view:** Status pages consume projected component/incident state, not raw probe history.

## Suggested Build Order

### Phase 1: Monitoring Core

Build monitor CRUD, scheduler, leased worker execution, raw result storage, and a minimal private dashboard first.

This establishes the system of record. Without this layer, everything else is theater.

### Phase 2: Incident Engine And Alerting

Add confirmation thresholds, heartbeat grace periods, maintenance suppression, incident open/resolve logic, and notification dispatch.

This is the trust boundary for the product. The user requirement of zero missed outages and near-zero false positives depends more on this phase than on UI polish.

### Phase 3: Status Projection And Public Pages

Add tag/group to component mapping, public page rendering, incident feed, uptime windows, and optional sharing/custom slug handling.

Status pages should come after incident truth exists. Otherwise the public page will disagree with the real monitor state or communicate noisy false outages.

### Phase 4: Reporting, Soak Testing, And Hardening

Add uptime rollups, audit trails, delivery retry visibility, worker health metrics, and soak-test tooling.

This phase proves the architecture is operationally trustworthy before feature expansion.

### Build-Order Implications

- Build the **incident state machine before advanced notification channels**. Channel fan-out is easy; correct incident transitions are not.
- Build **heartbeat monitoring as a first-class check type**, not a side route. It shares the same incident engine but has different scheduling semantics.
- Build **status pages on top of a projection/read model** once monitor and incident truth exist; do not couple public rendering directly to probe rows.
- Defer **multi-region probes, subscriber management, and rich response-time analytics**. They widen the model and infrastructure surface without improving v1 trust enough.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k monitors | One app + one worker pool + PostgreSQL is enough; keep boundaries logical, not deploy-time separate |
| 1k-10k monitors | Add Redis-backed queue, stronger job leasing, partition check results by time, and separate web from worker processes |
| 10k+ monitors | Split scheduler, runners, notification delivery, and public read model into separately scaled services; consider regional probes |

### Scaling Priorities

1. **First bottleneck:** Check execution concurrency and timeout handling. Fix with worker isolation, queues, and per-check adapter limits.
2. **Second bottleneck:** Time-series result volume. Fix with retention policy, aggregated uptime tables, and partitioned result storage.

## Anti-Patterns

### Anti-Pattern 1: Alerts Directly From Failed Probes

**What people do:** A worker immediately sends alerts on any failed HTTP request.
**Why it's wrong:** It causes false positives, duplicates, and inconsistent incident history.
**Do this instead:** Persist the result, evaluate thresholds centrally, then emit an incident transition.

### Anti-Pattern 2: Status Page Reads Raw Checks

**What people do:** The public page queries recent probe rows and derives status inline.
**Why it's wrong:** Public rendering becomes expensive and can disagree with maintenance rules or incident state.
**Do this instead:** Maintain a projected public status model with component status and incident timeline.

### Anti-Pattern 3: One Giant “Monitor” Service Module

**What people do:** Put configuration, scheduling, probing, incident logic, and notifications in one module because the product is “small.”
**Why it's wrong:** Every new check type or alert rule becomes a cross-cutting rewrite.
**Do this instead:** Keep a modular monolith with explicit boundaries from day one.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Email provider | Async notification job | Delivery should be retried independently of incident writes |
| Webhook targets | Signed outbound POST from dispatcher | Idempotency key is useful for retried deliveries |
| Target URLs/APIs | Outbound probe adapters | Must enforce per-check timeout, redirect, and TLS rules |
| Cron/job systems | Heartbeat ping URL | Needs stable tokenized endpoint and deadline evaluation |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Monitor Control Plane ↔ Scheduler | Direct DB/query API | Scheduler reads canonical config only |
| Check Runner ↔ Result Evaluator | Persisted result/event | Keeps probe code simple and testable |
| Incident Manager ↔ Notification Dispatcher | Async job/event | Prevents provider failures from corrupting incident state |
| Incident Manager ↔ Status Page Projection | Transactional update or async projection | Prefer eventual consistency with idempotent rebuild |

## Sources

- Better Stack docs, Uptime monitoring overview and IA showing monitoring, incidents, status pages, heartbeats, and APIs in one product: https://betterstack.com/docs/uptime/start/ (HIGH)
- Better Stack docs, monitor lifecycle and incident creation from monitor failures: https://betterstack.com/docs/uptime/monitoring-start/ (HIGH)
- Better Stack API docs, monitor types across status, expected status, keyword, ping, TCP, UDP, etc.: https://betterstack.com/docs/uptime/api/create-a-new-monitor/ (HIGH)
- Healthchecks.io FAQ, heartbeat/dead-man’s-switch model and operational architecture notes: https://healthchecks.io/docs/faq/ (HIGH)
- Atlassian Statuspage docs, components as the public-facing unit of service status: https://support.atlassian.com/statuspage/docs/show-service-status-with-components/ (HIGH)
- Atlassian Statuspage docs, incidents and maintenance as explicit communication objects: https://support.atlassian.com/statuspage/docs/create-manage-and-communicate-incidents/ (HIGH)

---
*Architecture research for: personal uptime monitoring, alerting, and status-page application*
*Researched: 2026-03-26*
