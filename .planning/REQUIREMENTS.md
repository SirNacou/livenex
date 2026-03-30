# Requirements: Livenex

**Defined:** 2026-03-30
**Core Value:** A single place to know what is up/down in the home lab, with alerts that fire before you notice manually.

## v1 Requirements

### Monitoring

- [ ] **MON-01**: User can create an HTTP/HTTPS monitor with a URL, name, and check interval
- [ ] **MON-02**: User can create a ping (ICMP) monitor with a hostname/IP, name, and check interval
- [ ] **MON-03**: Each monitor has an independently configurable check interval (e.g., 30s, 1m, 5m)
- [ ] **MON-04**: System stores every check result (status, response time, error type, timestamp) in the database
- [ ] **MON-05**: User can enable or disable a monitor without deleting it
- [ ] **MON-06**: User can edit an existing monitor's configuration
- [ ] **MON-07**: User can delete a monitor and its associated check history

### Dashboard

- [ ] **DASH-01**: Admin dashboard is protected — requires authenticated session to access
- [ ] **DASH-02**: Dashboard shows current up/down status for every monitor at a glance
- [ ] **DASH-03**: Dashboard shows a single overall system health indicator (all-up vs. any-down)
- [ ] **DASH-04**: User can view uptime percentage per monitor for 7d, 30d, and 90d windows
- [ ] **DASH-05**: User can view a response time graph (line chart) per HTTP monitor
- [ ] **DASH-06**: User can view a list of downtime incidents per monitor with start time, end time, and duration

### Alerts

- [ ] **ALRT-01**: System sends a Discord or Slack webhook message when a monitor transitions from UP to DOWN
- [ ] **ALRT-02**: System sends a Discord or Slack webhook message when a monitor transitions from DOWN to UP (recovery)
- [ ] **ALRT-03**: Alerts are only fired after N consecutive failures (configurable confirmation threshold per monitor, default 2) — suppresses false positives from transient blips
- [ ] **ALRT-04**: User can configure one or more Discord/Slack webhook URLs as notification channels

### Status Page

- [ ] **STAT-01**: A public status page at `/status` is accessible without login
- [ ] **STAT-02**: Status page shows current up/down status for each visible monitor (by service name — no internal URLs exposed)
- [ ] **STAT-03**: Status page shows uptime percentage history bars per monitor
- [ ] **STAT-04**: Status page shows recent downtime incidents
- [ ] **STAT-05**: User can control which monitors appear on the public status page (show/hide per monitor)

### Deployment

- [ ] **DEPL-01**: Application ships with a Dockerfile for production builds
- [ ] **DEPL-02**: Application ships with a docker-compose.yml (app + PostgreSQL) for one-command deployment
- [ ] **DEPL-03**: All external configuration (database URL, SMTP, webhook URLs, etc.) is provided via environment variables
- [ ] **DEPL-04**: Database schema is created/migrated automatically on application startup — no manual migration step required

## v2 Requirements

### Alerts

- **ALRT-V2-01**: Email (SMTP) alerts on state change — deferred; Discord/Slack covers v1 alerting needs
- **ALRT-V2-02**: Per-monitor notification channel assignment — deferred; global channels sufficient for home lab v1

### Enhanced Monitoring

- **MON-V2-01**: SSL certificate expiration alerts — deferred; useful but not core to uptime monitoring
- **MON-V2-02**: Configurable expected HTTP status code (beyond 200) — deferred; 200 is sufficient for v1
- **MON-V2-03**: Response time threshold alerting — deferred; adds condition logic to the alert system

### UX Improvements

- **UX-V2-01**: Monitor grouping / tagging — deferred; needed at higher scale (20+ monitors); not necessary for initial setup
- **UX-V2-02**: Manual "check now" trigger in the dashboard — deferred; nice-to-have, not blocking v1 validation
- **UX-V2-03**: Maintenance window scheduling — deferred; disable monitors manually in the interim

## Out of Scope

| Feature | Reason |
|---------|--------|
| SMS alerts | Cost and complexity; Discord/email covers home lab needs |
| Multi-user / team accounts | Single-admin home lab tool by design |
| Mobile app | Web-first; dashboard is mobile-accessible via browser |
| Agent-based / push monitoring | All checks originate from one host; no distributed agent architecture needed |
| Real-time WebSocket dashboard | React Query polling every 30s is sufficient for home lab use |
| Multi-region checks | Single-host deployment; home lab origin is acceptable |
| Public status page subscriber emails | Content management overhead not justified for personal use |
| External metrics push (Prometheus, etc.) | Out of the uptime monitoring domain for this project |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MON-01 | Phase 2 | Pending |
| MON-02 | Phase 2 | Pending |
| MON-03 | Phase 4 | Pending |
| MON-04 | Phase 1 | Pending |
| MON-05 | Phase 2 | Pending |
| MON-06 | Phase 2 | Pending |
| MON-07 | Phase 2 | Pending |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 6 | Pending |
| DASH-05 | Phase 6 | Pending |
| DASH-06 | Phase 6 | Pending |
| ALRT-01 | Phase 8 | Pending |
| ALRT-02 | Phase 8 | Pending |
| ALRT-03 | Phase 8 | Pending |
| ALRT-04 | Phase 7 | Pending |
| STAT-01 | Phase 9 | Pending |
| STAT-02 | Phase 9 | Pending |
| STAT-03 | Phase 9 | Pending |
| STAT-04 | Phase 9 | Pending |
| STAT-05 | Phase 3 | Pending |
| DEPL-01 | Phase 10 | Pending |
| DEPL-02 | Phase 10 | Pending |
| DEPL-03 | Phase 10 | Pending |
| DEPL-04 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after initial definition*
