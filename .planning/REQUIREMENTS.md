# Requirements: Livenex

**Defined:** 2026-03-26
**Core Value:** Detect real outages reliably with zero missed incidents and near-zero false positives, while staying fast enough to configure and trust for everyday personal use.

## v1 Requirements

### Access

- [ ] **AUTH-01**: User can sign in to the private dashboard with a single-user account
- [ ] **AUTH-02**: User can create, view, and revoke API keys for automation

### Monitor Management

- [ ] **MON-01**: User can create an HTTP website monitor with URL, check interval, and timeout
- [ ] **MON-02**: User can create an API monitor with HTTP method, expected status code, headers, and optional request body
- [ ] **MON-03**: User can create a content monitor with `Must Contain` and `Must Not Contain` rules
- [ ] **MON-04**: User can create an SSL expiry monitor with configurable alert lead time
- [ ] **MON-05**: User can create a heartbeat monitor with expected interval and grace period
- [ ] **MON-06**: User can edit, pause, resume, and delete any monitor
- [ ] **MON-07**: User can assign one or more tags/groups to a monitor
- [ ] **MON-08**: User can see each monitor's current state as `up`, `down`, `degraded`, `paused`, `maintenance`, or `no_data`

### Reliability Logic

- [ ] **RELY-01**: User can configure failure confirmation so a monitor retries before it is marked down
- [ ] **RELY-02**: User sees a monitor marked down only after a failure is confirmed by the configured retry logic
- [ ] **RELY-03**: User sees a heartbeat monitor marked down when no ping is received within expected interval plus grace period
- [ ] **RELY-04**: User can see when checks stop arriving so checker or worker failures surface as `no_data`

### Notifications

- [ ] **ALRT-01**: User can create notification channels for email, Telegram, Discord, `ntfy`, and `Apprise`
- [ ] **ALRT-02**: User can test a notification channel before attaching it to monitors
- [ ] **ALRT-03**: User receives exactly one `Down` alert when a confirmed incident starts
- [ ] **ALRT-04**: User receives exactly one `Resolved` alert when an incident recovers
- [ ] **ALRT-05**: User does not receive repeat reminder alerts while an incident remains open

### Incidents And Maintenance

- [ ] **INC-01**: User gets an incident created automatically when a monitor enters a confirmed down state
- [ ] **INC-02**: User can view incident history with start time, resolution time, affected monitor, and current status
- [ ] **INC-03**: User can create scheduled maintenance windows for selected monitors or groups
- [ ] **INC-04**: User does not receive outage alerts for monitors covered by an active maintenance window
- [ ] **INC-05**: User can see maintenance events separated from unplanned incidents in the dashboard and status pages

### Status Pages

- [ ] **STAT-01**: User can keep all monitoring data private by default behind authentication
- [ ] **STAT-02**: User can create multiple public shareable status pages based on selected tags/groups
- [ ] **STAT-03**: User can choose which monitors appear on each public status page
- [ ] **STAT-04**: User can view current component status and incident history on a public status page
- [ ] **STAT-05**: User can see scheduled maintenance displayed on affected public status pages

### Reporting And Usability

- [ ] **RPT-01**: User can see uptime percentages for each monitor across the last 24 hours, 7 days, and 30 days
- [ ] **RPT-02**: User can add a monitor and attach a notification channel in under 60 seconds using dashboard defaults
- [ ] **RPT-03**: User can manage 20 to 50 monitors from one dashboard without needing multi-project hierarchy

## v2 Requirements

### Reporting

- **RPT-04**: User can view response-time charts for each monitor
- **RPT-05**: User can compare historical latency trends across monitors or groups

### Monitoring

- **MON-09**: User can run checks from multiple geographic locations
- **MON-10**: User can create browser or synthetic journey checks

### Status Pages

- **STAT-06**: User can let visitors subscribe to incident or maintenance updates
- **STAT-07**: User can use a custom domain for each public status page

### Collaboration

- **AUTH-03**: User can invite additional users with role-based permissions
- **ALRT-06**: User can configure escalations, on-call schedules, or repeated reminder policies

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user collaboration in v1 | Single-user operation is the intended product shape |
| Environment hierarchy | Tags/groups are simpler and sufficient for the target scale |
| Repeating down reminders | Explicitly considered spam for this product |
| Multi-location checks in v1 | Added operational complexity without being required for the first trusted version |
| Browser/synthetic monitoring in v1 | Higher implementation cost than core HTTP, content, SSL, and heartbeat coverage |
| Response-time charts in v1 | Nice to have, but lower priority than uptime math and incident correctness |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Unassigned | Pending |
| AUTH-02 | Unassigned | Pending |
| MON-01 | Unassigned | Pending |
| MON-02 | Unassigned | Pending |
| MON-03 | Unassigned | Pending |
| MON-04 | Unassigned | Pending |
| MON-05 | Unassigned | Pending |
| MON-06 | Unassigned | Pending |
| MON-07 | Unassigned | Pending |
| MON-08 | Unassigned | Pending |
| RELY-01 | Unassigned | Pending |
| RELY-02 | Unassigned | Pending |
| RELY-03 | Unassigned | Pending |
| RELY-04 | Unassigned | Pending |
| ALRT-01 | Unassigned | Pending |
| ALRT-02 | Unassigned | Pending |
| ALRT-03 | Unassigned | Pending |
| ALRT-04 | Unassigned | Pending |
| ALRT-05 | Unassigned | Pending |
| INC-01 | Unassigned | Pending |
| INC-02 | Unassigned | Pending |
| INC-03 | Unassigned | Pending |
| INC-04 | Unassigned | Pending |
| INC-05 | Unassigned | Pending |
| STAT-01 | Unassigned | Pending |
| STAT-02 | Unassigned | Pending |
| STAT-03 | Unassigned | Pending |
| STAT-04 | Unassigned | Pending |
| STAT-05 | Unassigned | Pending |
| RPT-01 | Unassigned | Pending |
| RPT-02 | Unassigned | Pending |
| RPT-03 | Unassigned | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 0
- Unmapped: 32 ⚠️

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after initial definition*
