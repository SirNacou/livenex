# Livenex

## What This Is

Livenex is a single-user uptime monitoring, alerting, and status-page app built for personal use as an alternative to hosted uptime tools. It helps track websites, APIs, content checks, SSL expiry, and heartbeat jobs from one private dashboard, while optionally exposing selected monitor groups through shareable public status pages.

## Core Value

Detect real outages reliably with zero missed incidents and near-zero false positives, while staying fast enough to configure and trust for everyday personal use.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Monitor websites, APIs, keyword/content checks, SSL expiry, and heartbeats from one dashboard
- [ ] Alert only on confirmed failures and send a single down/resolved notification pair per incident
- [ ] Show private-by-default status views with optional public status pages by tag/group
- [ ] Track uptime percentages across 24h, 7d, and 30d windows
- [ ] Support monitor setup and notification configuration in under 60 seconds

### Out of Scope

- Multi-user collaboration and role management — single-user operation is the intended v1 model
- Full environment hierarchy or enterprise project structure — flat tags/groups are sufficient for the intended workflow
- Repeating reminder alerts while a service remains down — the initial down alert should be enough and repeat alerts are considered spam
- Multi-region or multi-location checks — one probe location keeps v1 simpler and aligned with personal-use needs
- Response-time charts in v1 — useful, but lower priority than reliable status, incidents, and uptime summaries

## Context

This project exists because the current generation of uptime products is useful enough to imitate, even if there is no urgent unmet need. The goal is to build a trustworthy personal alternative that borrows the strongest features from existing uptime apps while keeping the product focused and lightweight.

Expected usage is around 20 to 50 monitors across personal, work, and side-project systems. The product needs to support a mix of private operational visibility and selectively public-facing status pages, with monitor organization handled by simple tags/groups instead of a more complex hierarchy. Reliability is defined by a 7-day soak test with zero missed outages and zero false positives.

Operationally, confirmed failures should create incidents automatically, scheduled maintenance should suppress alerts during planned work, and monitors should support practical per-check controls like interval, timeout, content matching, and heartbeat grace periods.

## Constraints

- **Product Scope**: Single-user only in v1 — avoids introducing unnecessary team/account complexity
- **Visibility Model**: Private by default with optional public pages by tag/group — preserves personal operational control while allowing selective sharing
- **Alerting**: One down alert and one resolved alert only after retries confirm failure — minimizes alert fatigue and false positives
- **Monitoring Footprint**: Single check location in v1 — keeps the architecture simpler while still covering the intended personal-use cases
- **Performance**: Adding a monitor and notification channel should take under 60 seconds — setup speed is part of the replacement bar
- **Reliability**: Must pass a 7-day soak test with zero missed outages and zero false positives — trustworthiness is the primary acceptance criterion

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single-user login with API keys | Personal use is the main goal, but automation still matters | — Pending |
| Flat tags/groups instead of environments | Simple organization fits the expected scale without hierarchy overhead | — Pending |
| Automatic incidents on confirmed failures | Incident tracking should reflect monitoring truth without manual intervention | — Pending |
| Maintenance windows suppress alerts | Planned work should not create noise or misleading incidents | — Pending |
| Public status pages are shareable per tag/group | Sharing should be selective instead of all-or-nothing | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after initialization*
