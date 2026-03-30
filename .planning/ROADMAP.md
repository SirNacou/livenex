# livenex - Project Roadmap

**Project**: livenex (Personal Home Lab Uptime Monitor)  
**Timeline**: 2-week MVP launch + continuous iterations  
**Created**: March 30, 2026  
**Based on**: REQUIREMENTS.md + Research findings from `.planning/research/`

---

## Overview

The roadmap breaks the MVP (2 weeks) into 3 phases, plus future capability phases. This sequence prioritizes:
1. **Phase 1 (Core)** - Monitoring engine + dashboard
2. **Phase 1.5 (Polish)** - UX refinement + deployment
3. **Phase 2 (Extend)** - Advanced features

Each phase is a complete, deployable increment.

---

## Phase 1: Core Monitoring & Dashboard (Days 1-8)

**Goal**: Working monitoring system that detects service status and alerts when services go down.

### Deliverables
- ✅ Health check engine (HTTP + TCP)
- ✅ Status state machine with debouncing
- ✅ SQLite schema and migrations
- ✅ Discord webhook alerts
- ✅ Service dashboard (grid view)
- ✅ Service CRUD (add/edit/delete via form)
- ✅ Manual check trigger button

### Tasks

#### 1.1 Database & Schema (1 day)
- [ ] Create SQLite schema (services, checks, service_state tables)
- [ ] Set up Drizzle ORM migrations
- [ ] Implement database utilities (queries, transactions)
- [ ] Write schema tests

**Acceptance**: `npm run test -- db` passes; schema migrations run cleanly

#### 1.2 Health Check Engine (2 days)
- [ ] Implement HTTP GET health check logic
- [ ] Implement TCP port health check logic
- [ ] Create check executor with p-queue (concurrency limit: 5)
- [ ] Record response times and error messages
- [ ] Implement timeout handling (5 second max)

**Acceptance**: 
- Single check completes in <5 seconds
- 50 concurrent checks don't exceed 5 concurrent requests
- Response times recorded to database

#### 1.3 State Machine & Alert Engine (2 days)
- [ ] Implement 3-state machine (UP/DOWN/UNKNOWN)
- [ ] Add debouncing logic (2-fail → DOWN, 2-success → UP)
- [ ] Create webhook alert delivery
- [ ] Implement alert silencing (15-min default)
- [ ] Add alert retry queue (3x retry on failure)
- [ ] Write state machine tests

**Acceptance**:
- Single check failure doesn't trigger alert
- 2nd consecutive failure triggers DOWN alert
- Alert doesn't fire again within 15 minutes
- Failed webhook calls are retried
- State machine test coverage >90%

#### 1.4 Service Scheduler (1 day)
- [ ] Create background job for periodic checks
- [ ] Schedule checks per service interval (configurable)
- [ ] Handle job queuing and execution
- [ ] Implement nightly database cleanup (delete checks >7 days)
- [ ] Add error logging

**Acceptance**:
- Service checks run at configured intervals
- Database cleanup runs nightly
- No check storms (checks spread across interval window)

#### 1.5 Dashboard UI (2 days)
- [ ] Create Dashboard page (`/`)
- [ ] Build ServiceCard component (status badge, name, last check, uptime %)
- [ ] Implement grid layout with shadcn/ui
- [ ] Add real-time status updates (polling every 5 seconds)
- [ ] Sort services by status (DOWN first)
- [ ] Style with Tailwind CSS

**Acceptance**:
- Dashboard displays all services
- Status color-coded (green/red/gray)
- Loads in <1 second
- Responsive on mobile/tablet

#### 1.6 Service Management UI (2 days)
- [ ] Create ServiceForm component (add/edit)
- [ ] Add form validation (URL format, interval range)
- [ ] Implement delete confirmation
- [ ] Create Settings page with webhook config form
- [ ] Build API endpoints for service CRUD
- [ ] Add success/error toast notifications

**Acceptance**:
- User can add service with URL + interval
- User can edit service config
- User can delete service with confirmation
- User can add Discord webhook URL
- All fields validate properly

#### 1.7 API Endpoints (1 day)
- [ ] `GET /api/services` - List all services with current status
- [ ] `POST /api/services` - Create service
- [ ] `PUT /api/services/:id` - Update service
- [ ] `DELETE /api/services/:id` - Delete service
- [ ] `POST /api/services/:id/check` - Manual check
- [ ] `GET /api/services/:id/history` - Last 24h checks
- [ ] `GET /api/services/:id/uptime` - Uptime percentage
- [ ] `GET /health` - App health check

**Acceptance**: All endpoints return correct status codes; integration tests pass

### Phase 1 Success Criteria
- [ ] 10 services can be monitored concurrently
- [ ] Status changes detected within 2 minutes (check interval + 1 check)
- [ ] Alerts fire correctly without spam (debouncing working)
- [ ] Dashboard updates live (no page refresh needed)
- [ ] Database doesn't exceed 5 MB after 7 days of monitoring 50 services
- [ ] All services can be added/edited/deleted via UI
- [ ] Manual check button triggers immediate check and status update
- [ ] No data loss on app restart

---

## Phase 1.5: Polish & Deployment (Days 9-10)

**Goal**: Production-ready MVP with smooth UX and easy deployment.

### Deliverables
- ✅ Response time display on dashboard
- ✅ Check history view for each service
- ✅ Docker Compose setup
- ✅ Bulk service import (CSV)
- ✅ Alert history log
- ✅ Service notes field

### Tasks

#### 1.5.1 Response Time Tracking (0.5 day)
- [ ] Add response_time_ms column display on ServiceCard
- [ ] Calculate min/avg/max over last 24h
- [ ] Show response time trend on detail page
- [ ] Add slow response warning (>3 second avg)

**Acceptance**: Response times displayed accurately; trend graph shows patterns

#### 1.5.2 Service Detail Page (1 day)
- [ ] Create `/services/:id` detail page
- [ ] Show full check history (last 24h)
- [ ] Display response time graph
- [ ] Show error messages from failed checks
- [ ] Add edit/delete buttons
- [ ] Add service notes section (editable)

**Acceptance**: User can view full history and error context for any service

#### 1.5.3 Docker Compose Setup (1 day)
- [ ] Create Dockerfile for Node.js app
- [ ] Create docker-compose.yml (app + PostgreSQL optional)
- [ ] Add volume mounts for data persistence
- [ ] Write .dockerignore
- [ ] Create deployment guide in docs
- [ ] Test docker build and compose up

**Acceptance**: `docker-compose up` starts working app at localhost:3000

#### 1.5.4 CSV Service Import (0.5 day)
- [ ] Create import API endpoint
- [ ] Add import form on Settings page
- [ ] Parse CSV (name, url, interval)
- [ ] Validate and create services in bulk
- [ ] Show import summary (X created, Y skipped)

**Acceptance**: User can import 20 services from CSV in <5 seconds

#### 1.5.5 Alert History View (0.5 day)
- [ ] Create `/alerts` page showing all alerts fired
- [ ] Display alert timestamp, service, status change, webhook status
- [ ] Filter by date range
- [ ] Show success/failure status for webhook delivery

**Acceptance**: User can debug alert delivery by viewing history

### Phase 1.5 Success Criteria
- [ ] Dashboard displays response times and trends
- [ ] Service detail page shows full history and errors
- [ ] Docker Compose deployment works end-to-end
- [ ] CSV import can add 20 services in one operation
- [ ] Alert history explains all notifications sent
- [ ] All Phase 1 criteria still met

---

## Phase 2: Advanced Features (Weeks 3-6)

**Goal**: Extend MVP with enterprise features (email, status pages, metrics export).

### Deliverables
- Email alerts via SMTP
- Public status page
- Prometheus metrics export (`/metrics`)
- Slack native alerts (rich formatting)
- API key authentication for metrics endpoint
- Performance dashboard with response time trends

### Tasks

#### 2.1 Email Alerts (2 days)
- [ ] Add SMTP configuration UI
- [ ] Implement email template rendering
- [ ] Create alert delivery via nodemailer
- [ ] Add email verification flow
- [ ] Write email notification tests

#### 2.2 Status Pages (3 days)
- [ ] Create public status page UI
- [ ] Add page visibility toggle per service
- [ ] Implement SEO-friendly rendering
- [ ] Add RSS feed for status changes
- [ ] Create status page customization (colors, logo, theme)

#### 2.3 Metrics Export (2 days)
- [ ] Implement `/metrics` endpoint (Prometheus format)
- [ ] Export service status and uptime %
- [ ] Add API key requirement
- [ ] Document metrics format
- [ ] Test Prometheus scraping

#### 2.4 Performance Dashboard (2 days)
- [ ] Create `/analytics` page
- [ ] Add response time graph over time
- [ ] Show service availability trends (7d, 30d, 90d)
- [ ] Calculate SLA compliance
- [ ] Export reports to PDF

### Phase 2 Success Criteria
- [ ] Email alerts send reliably
- [ ] Status page is publicly accessible and read-only
- [ ] Prometheus can scrape metrics endpoint
- [ ] Performance dashboard shows trends over time
- [ ] All Phase 1 & 1.5 criteria still met

---

## Phase 3+: Enterprise Scale (Future)

### Roadmap Items
- Multi-user support + authentication
- PostgreSQL migration from SQLite
- Team dashboards and permissions
- Advanced alerting (escalation policies, on-call scheduling)
- Integration with PagerDuty, Opsgenie
- SSL certificate expiry monitoring
- Service dependency graphs
- Distributed monitoring (multiple agents)
- Custom dashboards and widgets
- Webhook signature verification

---

## Timeline Summary

```
Week 1 (Days 1-5)
├─ Mon: DB Schema + HTTP Check Engine (1.1 + 1.2)
├─ Tue: TCP Check + State Machine (1.2 + 1.3)
├─ Wed: Alert Engine + Scheduler (1.3 + 1.4)
├─ Thu: Dashboard UI (1.5)
└─ Fri: Service CRUD UI (1.6)

Week 2 (Days 6-10)
├─ Mon: API Endpoints (1.7)
├─ Tue: Phase 1 Testing & Bug Fixes
├─ Wed: Response Time + Detail Page (1.5.1 + 1.5.2)
├─ Thu: Docker + CSV Import (1.5.3 + 1.5.4)
└─ Fri: Polish + Release (1.5.5)

MVP Complete: End of Week 2
├─ All Phase 1 criteria met ✓
├─ Deployed with Docker Compose ✓
└─ Ready for Phase 2 planning
```

---

## Success Metrics

### By End of Phase 1 (Week 2)
- **Functionality**: Monitor 50 services, detect outages <2 min
- **Performance**: Dashboard <1s load, checks <5s timeout
- **Reliability**: <5% false positive alerts, 99%+ uptime
- **Usability**: Any service can be added/removed in <1 minute
- **Data**: Database <10 MB, 7-day retention
- **Deployment**: Docker Compose one-command start

### By End of Phase 1.5
- **UX**: Response times visible, history searchable
- **Operations**: Services importable from CSV, alerts viewable
- **Deployment**: Production-ready container image

### By End of Phase 2
- **Scale**: 100+ services supported
- **Features**: Email + webhooks + metrics export
- **Integration**: Prometheus-compatible metrics
- **Analytics**: Response time trends visible

---

## Dependencies & Blockers

### Phase 1 Dependencies
- ✅ React 19 (already installed)
- ✅ TanStack Start (already installed)
- ✅ Drizzle ORM (already installed)
- ✅ Tailwind CSS (already installed)
- ✅ Better Auth (installed but not configured - not needed for MVP)

### Known Risks
1. **Authentication not configured** → Defer to Phase 2; MVP is single-user
2. **PostgreSQL not set up** → SQLite sufficient for MVP; migration path clear
3. **2-week timeline is aggressive** → Ruthless scope prioritization required; defer Phase 2

### Mitigation Strategies
- Focus on Phase 1 delivery only
- Skip email alerts (Phase 2)
- Skip public status pages (Phase 2)
- Skip multi-user auth (Phase 3)
- Use shadcn/ui components to speed UI development
- Implement feature flags to hide incomplete features

---

## Next Steps

**Immediate** (Next session):
1. Run `/gsd-plan-phase 1` to create detailed implementation plan for Phase 1
2. Set up development environment
3. Create initial feature branches
4. Begin Phase 1.1 (Database schema)

**After Phase 1 Delivery:**
1. Run `/gsd-plan-phase 1.5` for polish and deployment
2. Gather user feedback
3. Update roadmap based on real usage

---

## Appendix: Architecture Overview

```
┌─────────────────────────────────────────┐
│         React Dashboard (Frontend)       │
│  - Service grid view                    │
│  - Detail pages                         │
│  - Settings forms                       │
└────────────────┬────────────────────────┘
                 │
         ┌───────▼────────┐
         │  TanStack Start │ (Server + Client Router)
         └────────┬────────┘
                  │
    ┌─────────────┼──────────────┐
    │             │              │
┌───▼───┐  ┌─────▼──────┐  ┌────▼─────┐
│ Check │  │  Alert     │  │  Service │
│Engine │  │  Delivery  │  │  Scheduler
└───┬───┘  └─────┬──────┘  └────┬─────┘
    │            │              │
    └────────┬───┴──────────┬───┘
             │             │
        ┌────▼────────┬────▼───┐
        │  SQLite DB  │ Discord │
        │  (services, │ Webhooks│
        │   checks)   │         │
        └─────────────┴─────────┘
```

This architecture is:
- **Simple**: 3 main systems (checks, alerts, scheduler)
- **Scalable**: SQLite handles 50+ services easily
- **Reliable**: Debouncing + retry logic prevent false positives
- **Testable**: Each component can be unit tested independently
