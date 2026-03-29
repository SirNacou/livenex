# Feature Research

**Domain:** Personal uptime monitoring, alerting, and status-page app
**Researched:** 2026-03-26
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| HTTP/API uptime checks | Every serious uptime tool starts with URL checks for websites and APIs. | LOW | Must support URL, method, expected status, timeout, and basic headers/auth. |
| Content or keyword checks | Users expect more than `200 OK`; they want to detect broken pages and bad API payloads. | MEDIUM | Needed to catch soft failures where the site responds but the content is wrong. |
| SSL certificate expiry checks | Common in UptimeRobot, Better Stack, and self-hosted tools; missing it makes the app feel incomplete fast. | LOW | Separate from uptime failures; should alert on configurable lead time. |
| Heartbeat/cron monitoring | Modern uptime products treat missed background jobs as a core monitor type. | MEDIUM | Needs unique ping URL, grace period, late/missed state, and simple docs/snippets. |
| Basic alert routing | Email plus at least one push/chat channel is expected; no alerts means no product. | MEDIUM | For this project, optimize for a few reliable personal channels, not broad enterprise coverage. |
| Confirmed-failure alerting with recovery | Users expect retries/debouncing to avoid false positives, then one down and one resolved notification. | MEDIUM | This is the trust feature. Incident state machine matters more than channel count. |
| Incident timeline/history | Competitors expose current incidents and historical incidents as a baseline expectation. | MEDIUM | Auto-open on confirmed failure, auto-resolve on recovery, keep manual note support lightweight. |
| Status pages with component/group visibility | Public or shareable status pages are standard once a product includes monitoring + incidents. | MEDIUM | For Livenex, tag/group-based pages are sufficient; avoid complex component hierarchies in v1. |
| Scheduled maintenance windows | Common across UptimeRobot, Better Stack, and Statuspage because planned downtime should not page you. | MEDIUM | Must suppress alerts and avoid polluting uptime calculations during maintenance. |
| Uptime summaries over common windows | 24h, 7d, and 30d uptime percentages are expected shorthand for reliability. | LOW | Matches project requirements directly; no need for deep analytics in v1. |
| Simple monitor organization | Users need tags/groups or folders once they have more than a handful of checks. | LOW | Flat tags/groups fit the project better than environments/services/teams. |
| Private-by-default visibility with optional sharing | Status visibility controls are expected even in smaller tools. | MEDIUM | Passwordless public links for selected groups, private dashboard by default. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Trust-first incident model | Differentiate on near-zero false positives instead of sheer feature count. | MEDIUM | Make retries, confirmation rules, and down/resolved deduplication the product’s core promise. |
| Sub-60-second setup flow | Fast setup is a real advantage for personal tools; enterprise suites are often slower and noisier. | MEDIUM | Use opinionated defaults, minimal forms, and prefilled monitor templates. |
| Unified monitor types in one lightweight dashboard | Personal users want one place for websites, APIs, SSL, content, and heartbeats without separate products. | MEDIUM | The differentiation is coherence and low friction, not new monitor categories. |
| Selective public status pages by tag/group | Most tools can do status pages; fewer make selective sharing feel trivial. | MEDIUM | Strong fit for “private by default, expose only what matters.” |
| Personal-scale alert ergonomics | One down alert, one resolved alert, no reminder spam is a better default for solo operators. | LOW | This should be explicit product behavior, not hidden configuration complexity. |
| Practical monitor controls without enterprise clutter | Interval, timeout, grace period, expected keyword, and maintenance cover most real needs. | LOW | Compete by trimming the long tail, not by adding every protocol and workflow. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multi-user teams, roles, and approvals | Feels “professional” and matches Statuspage/Better Stack enterprise positioning. | Pulls the project into account models, permissions, invites, audit trails, and collaboration UX that do not help a single-user v1. | Keep single-user auth plus API keys; revisit only if usage changes materially. |
| On-call schedules, escalations, and reminder loops | Common in enterprise incident tools and often assumed to belong with monitoring. | Adds calendar logic, rotations, retries, acknowledgment flows, and alert fatigue; conflicts with the project’s one down/one resolved philosophy. | Deliver a few reliable notification channels with confirmed alerts only. |
| Multi-region or browser transaction monitoring in v1 | Sounds like “better coverage” and “deeper checks.” | Expensive, operationally noisy, and much harder to trust; browser checks especially expand runtime, debugging, and maintenance scope. | Start with single-location HTTP/API/content/heartbeat checks and add richer probing only after reliability is proven. |
| Deep performance analytics and response-time dashboards | Vendors market charts heavily, so they look mandatory. | Easy to build badly and easy to over-prioritize; they distract from the core question of “is it down, and should I act?” | Ship uptime percentages and incident history first; defer response-time charts to later phases. |

## Feature Dependencies

```text
Monitor engine
    └──requires──> monitor types (HTTP/API, keyword, SSL, heartbeat)
                         └──requires──> per-monitor settings (interval, timeout, grace, expectations)

Confirmed-failure alerting
    └──requires──> monitor engine
                         └──feeds──> incident lifecycle
                                          └──feeds──> status page current state + history

Scheduled maintenance
    └──requires──> monitor engine
    └──modifies──> alerting behavior
    └──modifies──> uptime calculations

Public status pages by tag/group
    └──requires──> monitor organization
    └──requires──> incident lifecycle

Subscriber notifications
    └──requires──> public/private status pages
    └──requires──> incident lifecycle

Advanced analytics / performance charts
    └──enhances──> status pages
    └──not required for──> core monitoring trust

On-call schedules / reminder alerts
    └──conflicts──> personal-scale alert ergonomics
```

### Dependency Notes

- **Confirmed-failure alerting requires the monitor engine:** retries, timeouts, and state transitions must exist before alerts can be trustworthy.
- **Incident lifecycle depends on alerting and monitor state:** incidents are the durable representation of confirmed failures and recoveries.
- **Status pages depend on organization and incidents:** a useful page needs grouped resources plus current and historical incident data.
- **Scheduled maintenance modifies both alerting and uptime math:** if maintenance is bolted on late, metrics and notifications become inconsistent.
- **Subscriber notifications depend on status pages and incidents:** subscriptions matter only when there is something structured to publish.
- **On-call schedules conflict with the intended v1 experience:** they optimize for teams and escalation chains, not a solo operator trying to reduce noise.

## MVP Definition

### Launch With (v1)

Minimum viable product for this project.

- [ ] HTTP/API uptime checks with method, status, timeout, and optional auth/header support — core monitoring baseline
- [ ] Keyword/content checks — catches soft failures and aligns with validated project needs
- [ ] SSL expiry checks — common expectation and low-cost coverage
- [ ] Heartbeat monitoring with grace periods — covers cron jobs and background tasks
- [ ] Confirmed-failure alerting with exactly one down and one resolved notification per incident — core trust requirement
- [ ] Automatic incidents with history — powers both private dashboard and public communication
- [ ] Scheduled maintenance windows — prevents false alerts and bad uptime math
- [ ] Private dashboard plus optional public status pages by tag/group — matches the product’s visibility model
- [ ] Uptime percentages for 24h, 7d, and 30d — enough summary reporting for v1
- [ ] Flat tags/groups — enough organization for 20 to 50 monitors

### Add After Validation (v1.x)

- [ ] More notification channels — add only when a real personal workflow needs them
- [ ] Status-page subscriptions and announcement posts — useful once public pages are used regularly
- [ ] Status-page customization (custom domain, branding, hide/show widgets) — secondary to reliability
- [ ] Response-time charts — add once downtime detection is trusted and stable
- [ ] Import/export or templated monitor creation — useful after setup patterns are known

### Future Consideration (v2+)

- [ ] Multi-location checks — only if single-location monitoring proves insufficient
- [ ] Browser/synthetic transaction checks — high complexity, only after simpler checks are mature
- [ ] Team collaboration / RBAC — only if the product stops being personal
- [ ] On-call scheduling and escalations — only if the product becomes a team incident platform

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Confirmed-failure alerting + recovery | HIGH | MEDIUM | P1 |
| HTTP/API + keyword monitoring | HIGH | MEDIUM | P1 |
| Heartbeat monitoring | HIGH | MEDIUM | P1 |
| Incident history | HIGH | MEDIUM | P1 |
| Maintenance windows | HIGH | MEDIUM | P1 |
| Public status pages by tag/group | HIGH | MEDIUM | P1 |
| SSL expiry checks | MEDIUM | LOW | P1 |
| Uptime summaries (24h/7d/30d) | MEDIUM | LOW | P1 |
| Subscriber notifications | MEDIUM | MEDIUM | P2 |
| Status-page customization | MEDIUM | MEDIUM | P2 |
| Response-time charts | LOW | MEDIUM | P3 |
| Multi-region/browser checks | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | UptimeRobot | Better Stack | Our Approach |
|---------|-------------|--------------|--------------|
| Core monitor types | HTTP(S), keyword, ping, port, heartbeat, SSL, DNS, API, domain monitoring | HTTP, keyword, ping, heartbeat, API, DNS, domain expiry, SSL, TCP/UDP, browser checks | Start with website/API, keyword, SSL, and heartbeat; skip broad protocol sprawl in v1. |
| Alerting model | Broad notifications, maintenance windows, incident management | Broad notifications, on-call, escalations, incident merging | Focus on trust-first confirmed alerts and deduplicated incidents for one operator. |
| Status pages | Public pages, customization, subscriptions, private/password protection | Public/private pages, widgets, integrations, richer enterprise controls | Private by default with simple shareable pages by tag/group; keep customization light. |
| Incident communication | Incidents + maintenance + announcements | Incidents tightly linked to monitoring and on-call workflows | Auto-create incidents from confirmed failures; optimize for clarity, not process overhead. |
| Enterprise surface area | Team features and richer collaboration on higher plans | Heavy on on-call, integrations, enterprise access controls | Deliberately avoid enterprise scope until the personal core is validated. |

## Sources

- Project context: [PROJECT.md](/C:/Users/solus/Code/Personal/livenex/.planning/PROJECT.md)
- UptimeRobot monitor types: https://help.uptimerobot.com/en/articles/11358441-monitor-types
- UptimeRobot status page feature: https://help.uptimerobot.com/en/articles/11361341-understanding-the-status-page-feature
- UptimeRobot maintenance windows: https://help.uptimerobot.com/en/articles/11360884-what-is-a-maintenance-window-and-how-to-use-it-in-uptimerobot
- Better Stack Uptime docs index: https://betterstack.com/docs/uptime
- Better Stack uptime monitoring: https://betterstack.com/uptime
- Better Stack keyword monitor: https://betterstack.com/docs/uptime/keyword-monitor/
- Better Stack API monitor: https://betterstack.com/docs/uptime/api-monitor/
- Better Stack maintenance windows: https://betterstack.com/docs/uptime/pausing-monitors-and-maintenances/
- Better Stack status pages: https://betterstack.com/docs/uptime/getting-started-with-status-pages/
- Atlassian Statuspage overview: https://support.atlassian.com/statuspage/docs/what-is-statuspage/
- Atlassian Statuspage components: https://support.atlassian.com/statuspage/docs/show-service-status-with-components/
- Atlassian Statuspage scheduled maintenance: https://support.atlassian.com/statuspage/docs/schedule-maintenance/
- Atlassian Statuspage subscribers: https://support.atlassian.com/statuspage/docs/enable-subscribers/

---
*Feature research for: personal uptime monitoring, alerting, and status-page app*
*Researched: 2026-03-26*
