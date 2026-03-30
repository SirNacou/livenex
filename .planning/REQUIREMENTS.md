# livenex - MVP Requirements

**Created:** March 30, 2026  
**Scope:** Core uptime monitoring MVP  
**Timeline:** 2 weeks (aggressive)  
**Target Users:** Solo home lab operator  
**Research-Driven:** Based on `.planning/research/` domain analysis

---

## Product Vision & Goals

### User Problem
Home lab operators need lightweight, self-hosted monitoring of 10-50+ services without complex infrastructure.

### Solution Statement
livenex monitors service health via HTTP/TCP checks, displays status on a single dashboard, and delivers instant alerts via webhooks when services go down.

### Success Metrics (MVP)
- [ ] Dashboard loads in <1 second
- [ ] Health checks complete in <5 seconds per service (50 concurrent timeout)
- [ ] Service status changes detected and alerted within 2 minutes
- [ ] No alert spam (debounced to 2 consecutive failures minimum)
- [ ] Database <10 MB after 7 days of monitoring 50 services
- [ ] Deployable as single Docker container

---

## Core User Workflows

### Workflow 1: Monitor Service
```
1. User adds service URL (e.g., https://homelab.local/app)
2. User sets check interval (default 60 seconds)
3. System begins HTTP health checks
4. Dashboard updates with live status (UP/DOWN/UNKNOWN)
5. User sees last check time, uptime %, response time
```

### Workflow 2: Receive Alerts
```
1. User configures Discord webhook (Settings page)
2. Service goes DOWN (2 consecutive failures)
3. Webhook fires with: service name, DOWN status, timestamp
4. User receives notification immediately
5. Service recovers (2 consecutive successes)
6. Recovery webhook fires
```

### Workflow 3: Diagnose Outage
```
1. Service status is DOWN
2. User clicks service card → Detail view
3. User sees: check history (last 24h), response times, error messages
4. User clicks "Test Now" button to verify fix
5. Manual check runs immediately, updates status
```

---

## Features

### Must Have (Table Stakes)

| Feature | Acceptance Criteria | Priority |
|---------|-------------------|----------|
| **HTTP Health Checks** | GET request to service URL; treat 200-399 as UP | P0 |
| **TCP Port Checks** | Connect to host:port; connection success = UP | P0 |
| **Service Dashboard** | Grid view of all services, sorted by status (DOWN first) | P0 |
| **Status Indicator** | Current status color-coded: UP=green, DOWN=red, UNKNOWN=gray | P0 |
| **Check Interval Config** | User can set per-service interval (10-3600 seconds, default 60) | P0 |
| **Webhook Alerts** | POST to Discord/Slack on status change (with alert silencing) | P0 |
| **Alert Silencing** | Prevent duplicate alerts within 15 min window | P0 |
| **Last Check Time** | Display when service was last checked | P0 |
| **Uptime % (Today)** | Calculate from successful checks in last 24h | P0 |
| **Check History** | Retain last 24h of checks in local SQLite | P0 |
| **Database Persistence** | Configuration and history survive app restart | P0 |

**Effort:** ~60% of sprint (covers core product)

### Should Have (Phase 1.5 - Post-MVP Enhancements)

| Feature | Acceptance Criteria | Priority |
|---------|-------------------|----------|
| **Response Time Tracking** | Display min/avg/max response times on dashboard | P1 |
| **Docker Compose Setup** | One-command deployment with bundled PostgreSQL | P1 |
| **Bulk Service Import** | CSV import to add 20+ services at once | P1 |
| **Manual Test Button** | User can trigger check immediately (don't wait for interval) | P1 |
| **Alert History** | Log of all alerts fired (when, why, to which webhook) | P1 |
| **Service Notes** | Free-text field per service (contact person, purpose, etc.) | P1 |
| **API Metrics Export** | Prometheus-compatible `/metrics` endpoint | P2 |

**Effort:** ~25% of sprint (can overlap with Phase 2)

### Must NOT Have (Defer to Phase 2+)

- Email alerts (SMTP config complexity)
- Multi-user authentication
- Public status pages
- PagerDuty/Opsgenie integration
- Mobile app (responsive web is sufficient)
- SSL certificate expiry checks
- Service dependency graphs
- Incident timeline / post-mortem support
- Custom dashboards or Grafana integration

**Rationale:** Deferral saves 1-2 days per feature, critical for 2-week timeline.

---

## Technical Requirements

### Non-Functional Requirements

| Requirement | Target | Rationale |
|------------|--------|-----------|
| **Check Concurrency** | Max 5 concurrent checks | Prevent thundering herd on monitored services |
| **Check Timeout** | 5 seconds | Balance responsiveness vs. network tolerance |
| **Data Retention** | 7 days raw, cleanup nightly | Home lab scale (2.5 MB for 50 services) |
| **Alert Retry** | Up to 3x on webhook failure | Ensure alert delivery despite network glitches |
| **State Debouncing** | 2 failures → DOWN, 2 successes → UP | Prevent alert spam from network jitter |
| **Dashboard Response Time** | <1 second page load | Responsive monitoring experience |
| **Database** | SQLite (PostgreSQL-compatible SQL) | Zero setup, migration path if needed |
| **API Response Time** | <500ms for any endpoint | Real-time monitoring feel |

### Technology Stack (Research-Driven)

- **Frontend**: React 19, TanStack Router, Tailwind CSS (already chosen)
- **Backend**: TanStack Start + Elysia (already chosen)
- **Database**: SQLite (MVP) → PostgreSQL (future)
- **Authentication**: Better Auth for admin UI (future; not MVP)
- **Alerts**: Webhook POST (Discord, Slack, custom)
- **Scheduling**: p-queue (concurrency control) + node-cron
- **Testing**: Vitest (unit + integration)

---

## Database Schema (MVP)

### Services Table
```sql
CREATE TABLE services (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'http' (http|tcp),
  check_interval INTEGER DEFAULT 60,
  timeout INTEGER DEFAULT 5000,
  webhook_urls TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Checks Table
```sql
CREATE TABLE checks (
  id INTEGER PRIMARY KEY,
  service_id INTEGER NOT NULL,
  status TEXT (up|down|unknown),
  response_time_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP,
  created_at TIMESTAMP,
  
  -- Cleanup: DELETE WHERE created_at < NOW() - INTERVAL '7 days' (nightly)
  INDEX (service_id, created_at)
);
```

### State Machine Table
```sql
CREATE TABLE service_state (
  service_id INTEGER PRIMARY KEY,
  current_status TEXT (up|down|unknown),
  consecutive_failures INTEGER DEFAULT 0,
  consecutive_successes INTEGER DEFAULT 0,
  last_alert_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## API Endpoints (Backend)

### Services Management
- `GET /api/services` → List all services with current status
- `POST /api/services` → Create new service
- `PUT /api/services/:id` → Update service config
- `DELETE /api/services/:id` → Remove service
- `POST /api/services/:id/check` → Manual check trigger

### History & Metrics
- `GET /api/services/:id/history` → Last 24h checks
- `GET /api/services/:id/uptime` → Uptime % for date range
- `GET /api/alerts` → Alert history (when fired, to which webhook)

### Configuration
- `GET /api/config` → Get app settings
- `PUT /api/config` → Update settings (alert retention, cleanup intervals)

### Health
- `GET /health` → App health check

---

## UI Components & Pages

### Pages
1. **Dashboard** (`/`)
   - Grid of service cards
   - Sorted by status (DOWN first)
   - Quick stats (X services up, Y down, Z checked now)

2. **Service Detail** (`/services/:id`)
   - Full service info (name, URL, interval)
   - Check history (24h)
   - Response time graph
   - Error logs
   - Manual test button
   - Edit/delete actions

3. **Settings** (`/settings`)
   - Webhook configuration (add/remove Discord/Slack endpoints)
   - Global alert silencing window
   - Data retention policy
   - Import services (CSV)

### Components
- `ServiceCard` - Single service status card (grid item)
- `StatusBadge` - UP/DOWN/UNKNOWN visual indicator
- `UptimePercentage` - "99.8% uptime" display
- `CheckHistoryChart` - Simple line chart of 24h status
- `WebhookForm` - Add/remove alert endpoints
- `ServiceForm` - Create/edit service config

---

## Acceptance Criteria by Feature

### HTTP Health Check
```
Given a service with URL https://example.com/health
When the monitoring interval triggers
Then:
  - System sends GET request to URL
  - Response status 200-399 = UP
  - Response status 400+ = DOWN
  - Network timeout (>5s) = DOWN
  - Response time is recorded in ms
```

### Status State Machine
```
Given a service currently UP
When first check fails
Then status remains UP (consecutive_failures = 1)

When second check fails
Then status changes to DOWN (consecutive_failures = 2)
  AND alert fires to all configured webhooks

Given a service currently DOWN
When first check succeeds
Then status remains DOWN (consecutive_successes = 1)

When second check succeeds
Then status changes to UP (consecutive_successes = 2)
  AND recovery alert fires
```

### Dashboard
```
Given 20 services in mixed states
When viewing dashboard
Then:
  - All services visible in grid
  - Status color-coded (green/red/gray)
  - Sorted by status (DOWN first, then UP, then UNKNOWN)
  - Last check time shown
  - Uptime % shown
  - Loads in <1 second
```

### Webhook Alerts
```
Given a service with Discord webhook https://discord.com/api/webhooks/...
When service status changes UP → DOWN
Then POST with: {"content": "⚠️ Service XYZ is DOWN as of 2:45 PM"}

When same service fires alert again within 15 min
Then alert is silenced (no webhook call)

When service recovers DOWN → UP
Then POST with: {"content": "✅ Service XYZ recovered at 2:50 PM"}
```

---

## Out of Scope (MVP)

- Multi-user / team accounts
- Email alerts
- SSL certificate monitoring
- Public status pages
- Custom dashboards
- Real-time event streaming
- Mobile app (web responsive is sufficient)
- Integration with monitoring platforms (Prometheus, Grafana)

---

## Dependencies & Assumptions

### Assumptions
1. User has home lab with stable network (no carrier-grade NAT)
2. Services expose HTTP endpoints or respond to TCP connections
3. Services are reachable from monitoring server (no special routing required)
4. User willing to configure webhook URLs manually (no OAuth setup)
5. Single-user app (no complex permissions needed)

### External Dependencies
- PostgreSQL (future, for scale beyond 100 services)
- Discord/Slack webhooks (user-provided, no API key management)
- Docker (for deployment, optional)

---

## Success Criteria (Phase 1 Complete)

When Phase 1 is complete, the tool must:

- [ ] Monitor 10-50 services continuously
- [ ] Detect service status changes within 2 minutes
- [ ] Alert via Discord/Slack webhook immediately
- [ ] Display dashboard with current status of all services
- [ ] Allow CRUD operations on services via UI
- [ ] Persist configuration to local database
- [ ] Survive app restart with all data intact
- [ ] Deploy via single Docker container or binary
- [ ] Have <5% false positive alert rate (debouncing working)
- [ ] Achieve >99% uptime for the monitoring app itself

---

## Roadmap Phases (Derived from Requirements)

**Phase 1 (Core): Weeks 1-2**
- Service monitoring (HTTP + TCP checks)
- Status state machine with debouncing
- SQLite persistence
- Discord webhook alerts
- Basic dashboard grid
- Manual test trigger

**Phase 1.5 (Polish): Week 2.5**
- Response time tracking
- Docker Compose setup
- Bulk CSV import
- Alert history view

**Phase 2 (Extend): Weeks 3-6**
- Email alerts
- Status pages
- API metrics export
- Performance dashboard

**Phase 3+ (Scale)**
- Multi-user / auth
- PostgreSQL migration
- Advanced analytics
