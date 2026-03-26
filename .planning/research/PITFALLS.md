# Pitfalls Research

**Domain:** Personal uptime monitoring, alerting, and status-page app
**Researched:** 2026-03-26
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Treating one failed probe as a real outage

**What goes wrong:**
Transient network issues, slow responses, WAF challenges, or a single bad route create false incidents and noisy alerts. Users stop trusting the product because "down" often means "one probe had a bad minute."

**Why it happens:**
Greenfield monitoring apps often equate one failed check with service failure because it is easy to implement and easy to demo. Real systems need confirmation logic across time and, when available, across vantage points.

**How to avoid:**
Use an explicit confirmation policy per monitor type:
- HTTP/API/content checks: require `N` consecutive failed runs before opening an incident.
- Heartbeats: require a grace window larger than expected job jitter.
- SSL expiry: treat as scheduled threshold evaluation, not outage detection.
- Separate `timeout`, `hard down`, and `content mismatch` as distinct failure reasons.
- Record each check attempt, but only change incident state after the confirmation rule passes.

**Warning signs:**
- Many incidents auto-resolve on the very next check.
- Most outages last exactly one interval.
- Users begin ignoring alerts or muting channels.
- Failures correlate with 403/429/timeout spikes rather than real service loss.

**Phase to address:**
Phase 1: Monitor engine and check-result model

---

### Pitfall 2: No explicit incident state machine, so alerts duplicate or flap

**What goes wrong:**
The system emits repeated "down" alerts, sends multiple resolve messages for one event, or creates separate incidents for the same outage. Incident history becomes unusable and notification spam violates the product's own promise of one down/resolved pair per incident.

**Why it happens:**
Developers model monitoring as isolated check results instead of a long-lived incident lifecycle. Without state transitions, deduping, idempotency, and reopen rules, every scheduler tick can behave like a new outage.

**How to avoid:**
Implement an incident state machine with durable transitions such as:
`healthy -> pending_failure -> down -> recovering -> resolved`
Add:
- A unique open-incident constraint per monitor.
- Idempotent notification jobs keyed by incident ID and transition type.
- Explicit reopen rules if a service fails again shortly after recovery.
- Separation between raw check history and incident history.

**Warning signs:**
- More incidents than actual outages.
- Multiple notifications with identical timestamps or cause text.
- Race conditions when checks and notification workers run concurrently.
- Manual cleanup is needed to keep incident timelines coherent.

**Phase to address:**
Phase 2: Incident and alerting state machine

---

### Pitfall 3: Maintenance, paused, and no-data states are collapsed into "up" or "down"

**What goes wrong:**
Planned work triggers alerts, paused monitors distort uptime, and scheduler failures are misreported as healthy or unhealthy service behavior. The app cannot distinguish "service is broken" from "the monitoring system intentionally or accidentally stopped checking."

**Why it happens:**
These states look secondary in MVPs, but they are operationally central. Official tools treat maintenance and paused states separately because alert suppression and public communication depend on them.

**How to avoid:**
Model these as first-class states:
- `paused`
- `maintenance`
- `no_data`
- `healthy`
- `degraded/down`
Rules:
- Maintenance suppresses incident creation and outbound alerts.
- Paused monitors are excluded from uptime calculations.
- `no_data` means the checker or scheduler failed, not that the target is healthy.
- Public status pages can show maintenance separately from outages.

**Warning signs:**
- Planned deploys generate incidents.
- A stopped worker makes monitors appear stable.
- Uptime percentages improve when monitors are paused.
- Users cannot tell whether a missing datapoint is target failure or internal failure.

**Phase to address:**
Phase 1.5 or Phase 2: Operational states and suppression rules

---

### Pitfall 4: Heartbeats are implemented like HTTP checks instead of deadline checks

**What goes wrong:**
Cron jobs and async workers either alert too early or too late. A late backup triggers false alarms, or a missed job is not detected until much later than expected.

**Why it happens:**
Heartbeat monitoring is not poll-based health checking. It is deadline tracking with jitter, grace periods, and optional payload validation. Teams often force it into the same logic as HTTP polling.

**How to avoid:**
Build heartbeat monitoring as its own monitor class:
- Store expected cadence and grace period separately.
- Open incidents when the expected signal is absent past the deadline.
- Support manual reset/recovery when the next valid heartbeat arrives.
- Show last expected time, last received time, and lateness duration in the UI.

**Warning signs:**
- Heartbeat alerts cluster around cron drift or deploy windows.
- Users compensate by setting huge grace periods everywhere.
- "Missed" jobs are only noticed after manual inspection.
- The UI cannot explain why a heartbeat is considered late.

**Phase to address:**
Phase 1: Monitor-type primitives, with validation in Phase 4 soak testing

---

### Pitfall 5: Status-page components mirror internal monitors instead of user-facing services

**What goes wrong:**
The public page becomes either too noisy or too vague. Exposing every low-level monitor confuses viewers, while collapsing everything into one "API" component hides affected scope and damages trust.

**Why it happens:**
It is tempting to make status pages a thin view over monitor records. But status communication is a product surface with a different audience and different grouping needs than internal monitoring.

**How to avoid:**
Separate internal monitors from public components/groups:
- A public component can depend on multiple monitors.
- One monitor can remain private and never appear publicly.
- Component state should derive from explicit mapping rules, not accidental one-to-one coupling.
- Keep tags/groups user-facing and stable even if monitor internals change.

**Warning signs:**
- The public page exposes implementation details users do not understand.
- Renaming or splitting a monitor breaks historical status presentation.
- A minor internal dependency outage turns the whole page red.
- Users ask "what does this component name mean?"

**Phase to address:**
Phase 3: Public status-page model and component mapping

---

### Pitfall 6: Status-page communication has no incident workflow, template, or update cadence

**What goes wrong:**
During a real incident, the team posts late, posts inconsistently, or posts nothing after the first message. Customers lose the single source of truth and support load spikes.

**Why it happens:**
Builders focus on detection and notification, assuming status pages are mostly static. In practice, the communication workflow is part of incident handling, not a cosmetic add-on.

**How to avoid:**
Ship explicit incident communication support:
- Incident statuses such as `investigating`, `identified`, `monitoring`, `resolved`.
- Message templates for common outage classes.
- A required "next update by" field or reminder.
- Clear distinction between subscriber notifications and page-only updates.
- A visible incident timeline on the status page.

**Warning signs:**
- Incidents jump from first alert straight to resolved.
- Operators edit raw markdown ad hoc during outages.
- Support channels receive "any update?" messages despite a status page existing.
- Postmortems show large silent gaps in public communication.

**Phase to address:**
Phase 3: Incident communication workflow on status pages

---

### Pitfall 7: Assuming notification transport equals notification delivery

**What goes wrong:**
Alerts are "sent" but never seen because SMTP is misconfigured, email lands in spam, Slack/webhook endpoints fail, or a single notification provider is down. The monitor caught the outage, but the human never learns about it.

**Why it happens:**
Many apps stop at provider integration success. Reliable alerting requires delivery-aware behavior, test sends, retry policy, and at least one secondary path for critical monitors.

**How to avoid:**
Treat notification delivery as its own reliability problem:
- Add connection validation and test sends when configuring a channel.
- Store delivery attempts and provider responses.
- Retry transient failures with backoff.
- Allow per-monitor primary and fallback channels.
- Surface channel health in the dashboard.

**Warning signs:**
- Incidents exist with no corresponding acknowledged notification record.
- Users discover outages from customers before alerts.
- Notification failures are visible only in server logs.
- One provider outage silences all alerting.

**Phase to address:**
Phase 2: Notification pipeline and channel verification

---

### Pitfall 8: Uptime calculations are mathematically wrong or operationally dishonest

**What goes wrong:**
24h/7d/30d percentages drift from incident history, maintenance windows count as downtime, or rolling windows are recomputed inconsistently. Users stop believing the dashboard because the numbers do not match observed incidents.

**Why it happens:**
Uptime math looks simple until you combine retries, partial intervals, paused monitors, maintenance, no-data, and monitor edits. Teams often compute percentages directly from current state instead of normalized event history.

**How to avoid:**
Define the contract early:
- Uptime is derived from normalized monitor-state intervals, not from ad hoc queries over latest checks.
- Maintenance and paused time are excluded explicitly.
- Incident confirmation delay should not erase real downtime once confirmed.
- Store enough history to reproduce 24h/7d/30d windows deterministically.
- Backfill and monitor-configuration edits must not silently rewrite history.

**Warning signs:**
- Changing check interval changes reported historical uptime unexpectedly.
- Uptime percentages do not reconcile with incident duration totals.
- Editing a monitor resets or corrupts history.
- Public and private views show different numbers for the same period.

**Phase to address:**
Phase 2: Incident history model, verified again in Phase 4 reporting/soak tests

---

### Pitfall 9: The monitorer is not monitored

**What goes wrong:**
A stuck scheduler, dead worker, or backed-up queue stops checks entirely, but the app keeps showing old green status because nothing is actively failing. This is one of the worst failure modes: silent blindness.

**Why it happens:**
Teams focus on probing external services and forget that the monitoring system itself needs health checks, stale-data detection, and operator-visible backpressure.

**How to avoid:**
Add internal self-observability from the start:
- Track worker heartbeat, scheduler lag, queue depth, and oldest unprocessed check.
- Mark monitors `no_data` when internal execution freshness breaches threshold.
- Create a dedicated self-monitor or watchdog.
- Surface stale-check warnings prominently in the dashboard.

**Warning signs:**
- Last-check timestamps stop moving while statuses remain green.
- Queue depth grows without user-visible impact.
- A process restart suddenly produces a burst of overdue incidents.
- Internal failures are only noticed from infrastructure logs.

**Phase to address:**
Phase 1: Scheduler/worker architecture, with hard verification in Phase 4 soak testing

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reusing one generic "failure" model for HTTP, SSL, and heartbeat monitors | Faster MVP schema | Every monitor type gets edge cases and alerting bugs | Never |
| Coupling public status components 1:1 to monitors | Easy initial UI | Painful remapping, noisy public pages, broken history | Only for a throwaway prototype |
| Computing uptime directly from recent check rows | Simple query path | Inconsistent historical math and hard-to-fix reporting bugs | Never |
| Fire-and-forget notifications with no delivery records | Easy integration | Invisible missed alerts and no audit trail | Never |
| No `no_data` state | Fewer states to model | Silent blindness when the checker fails | Never |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| HTTP/API targets | Treating all non-200 outcomes the same | Preserve failure class: DNS, connect timeout, TLS error, 4xx, 5xx, content mismatch |
| Sites behind WAF/CDN | Not allowing monitor IPs or user agent | Document allowlisting needs and expose probe identity |
| SMTP/email alerts | Assuming credentials are enough | Support test sends, delivery logging, and clear spam/allowlist guidance |
| Slack/webhook notifications | No retry or response logging | Retry transient failures and persist provider response bodies/status |
| Public status pages on custom domains | Forgetting proxy/host-header configuration | Validate host/domain setup explicitly before publishing |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Running all checks on a single wall-clock tick | CPU/network spikes and clustered false positives | Add jitter and per-monitor scheduling offsets | Often visible even at 20-50 monitors |
| Synchronous check -> incident -> notify pipeline | Slow providers delay later checks | Queue notification work separately from check execution | Breaks during incidents when many alerts fire together |
| Querying raw check history for every dashboard load | Slow dashboard and reporting | Precompute rollups or store interval-based summaries | Usually noticeable by 30-day views with moderate history |
| Large incident fan-out with no dedupe | Burst of identical notifications | Batch/idempotent transition processing | Breaks on shared dependency outages |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Public pages leak private monitor names, URLs, or failure bodies | Exposes internal topology or secrets | Separate public component metadata from internal monitor details |
| Heartbeat URLs are guessable or never rotated | Anyone can spoof job health | Use high-entropy tokens and support token rotation |
| Webhook/API secrets are logged in plaintext | Credential leakage and alert spoofing | Redact secrets in logs, UI, and exports |
| Disabling clickjacking protection for status-page embedding without care | Public page abuse or unsafe embedding | Keep safe defaults and document explicit opt-in tradeoffs |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Alert settings hide confirmation behavior | Users cannot predict when alerts fire | Show retries/grace windows in plain language beside interval/timeout |
| Dashboard shows only current color, not freshness | Stale data looks healthy | Always show "last checked" and stale/no-data state |
| Incident timeline omits state transitions | Operators cannot audit what happened | Preserve every incident transition with timestamp and actor/system source |
| Status page uses internal terminology | Viewers cannot map components to product areas | Use customer-facing component names and descriptions |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Confirmed outage detection:** Often missing explicit consecutive-failure or grace-window logic — verify a single failed check cannot open an incident.
- [ ] **Incident lifecycle:** Often missing dedupe and idempotent reopen/resolve behavior — verify one outage produces one incident and one down/resolved pair.
- [ ] **Maintenance handling:** Often missing alert suppression and public maintenance display — verify planned work does not create incidents or corrupt uptime.
- [ ] **Self-monitoring:** Often missing stale-data detection — verify stopped workers turn monitors into `no_data`, not green.
- [ ] **Status page communication:** Often missing templates and update cadence — verify incidents can progress through investigating/identified/monitoring/resolved with subscriber control.
- [ ] **Notification reliability:** Often missing test sends and delivery logs — verify channel misconfiguration is visible before a real outage.
- [ ] **Uptime reporting:** Often missing deterministic window math — verify 24h/7d/30d percentages reconcile with incident durations.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Single-check false positives | LOW | Tighten retries/timeouts, review recent raw checks, and recalculate incident-open rules before reopening alert channels |
| Duplicate/flapping incidents | MEDIUM | Merge incident records, patch state-machine transitions, and add idempotency keys before the next release |
| Bad uptime math | HIGH | Define canonical event model, backfill interval history if possible, and communicate metric changes clearly to users |
| Missing notification delivery | MEDIUM | Add provider logging/test sends, rotate to backup channels, and replay unresolved incident notifications if still relevant |
| Silent checker failure | HIGH | Restore scheduler/workers, mark affected interval as `no_data`, and investigate stale-check detection gaps before trusting green status again |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Treating one failed probe as a real outage | Phase 1: Monitor engine | Simulate transient failures and confirm no incident opens until retry policy is met |
| No explicit incident state machine | Phase 2: Incidents and alerting | Replay repeated fail/recover sequences and verify one incident plus one down/resolved pair |
| Maintenance/paused/no-data collapsed together | Phase 1.5 or 2: Operational states | Pause workers and schedule maintenance; verify neither is reported as ordinary downtime |
| Heartbeats implemented like HTTP checks | Phase 1: Monitor-type primitives | Run late and missed heartbeat scenarios with clock skew/jitter and verify correct trigger time |
| Status page mirrors internal monitors | Phase 3: Status-page model | Map multiple monitors to one public component and verify private monitors stay hidden |
| No incident communication workflow | Phase 3: Status-page incident UX | Dry-run an incident and verify statuses, templates, next-update reminders, and subscriber controls |
| Assuming send = delivery | Phase 2: Notification pipeline | Intentionally fail a provider and verify retries, delivery logs, and fallback channels |
| Wrong uptime math | Phase 2 then Phase 4: Reporting validation | Reconcile reported uptime against synthetic incident fixtures across 24h/7d/30d windows |
| The monitorer is not monitored | Phase 1 then Phase 4: Self-observability and soak | Kill scheduler/worker processes and verify monitors enter `no_data` with visible operator alerts |

## Sources

- Better Stack docs: uptime monitor basics, maintenance windows, monitor locations, SSL checks, and team-wide maintenance  
  https://betterstack.com/docs/uptime/uptime-monitor/  
  https://betterstack.com/docs/uptime/pausing-monitors-and-maintenances/  
  https://betterstack.com/docs/uptime/locations-and-regions/  
  https://betterstack.com/docs/uptime/ssl-certificate-checks/  
  https://betterstack.com/docs/uptime/team-wide-maintenance/
- Datadog Synthetic Monitoring: alert evaluation, retries, location scope, evaluation windows  
  https://docs.datadoghq.com/synthetics/guide/how-synthetics-monitors-trigger-alerts/
- Atlassian Statuspage and incident communication docs: components, incidents, impact calculation, subscriber behavior, communication cadence/templates  
  https://support.atlassian.com/statuspage/docs/what-is-statuspage/  
  https://support.atlassian.com/statuspage/docs/what-is-a-component/  
  https://support.atlassian.com/statuspage/docs/top-level-status-and-incident-impact-calculations/  
  https://support.atlassian.com/statuspage/docs/enable-subscribers/  
  https://www.atlassian.com/incident-management/incident-communication  
  https://www.atlassian.com/incident-management/tutorials/incident-communication
- Google SRE book: alert noise, symptom-based paging, minimum alert duration, avoiding over-alerting  
  https://sre.google/sre-book/monitoring-distributed-systems/  
  https://sre.google/sre-book/practical-alerting/
- Uptime Kuma docs/wiki: status page caching, maintenance behavior, custom-domain/proxy caveats, embedding tradeoffs  
  https://github.com/louislam/uptime-kuma/wiki/Status-Page  
  https://github.com/louislam/uptime-kuma/wiki/Maintenance  
  https://github.com/louislam/uptime-kuma/wiki/Notification-Methods
- Supplemental example of common false-alert causes in the field  
  https://uptimecheck.eu/blog/uptime-false-alerts

---
*Pitfalls research for: uptime monitoring, alerting, and status-page apps*
*Researched: 2026-03-26*
