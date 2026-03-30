# Livenex

## What This Is

Livenex is a self-hosted uptime monitoring application built for personal home lab use. It monitors HTTP endpoints and hosts (via ping), records availability and response time history, sends alerts via Discord/Slack and email when services change state, and exposes a public status page alongside a protected admin dashboard.

## Core Value

A single place to know — at a glance and in real time — what is up and what is down in the home lab, with alerts that fire before you notice manually.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can add and manage HTTP endpoint monitors (URL, check interval, expected status)
- [ ] User can add and manage host monitors (IP/hostname, check interval, via ping)
- [ ] Monitors run on configurable per-monitor intervals (not global)
- [ ] System records check results (up/down, response time, timestamp) over time
- [ ] Admin dashboard shows current up/down status for all monitors
- [ ] Admin dashboard shows uptime percentage per monitor over selectable periods (7d, 30d, 90d)
- [ ] Admin dashboard shows downtime incidents with duration
- [ ] Admin dashboard shows response time graphs for HTTP monitors
- [ ] Public status page shows current status and uptime history (no login required)
- [ ] System sends alerts via Discord or Slack webhook when a monitor changes state (up→down, down→up)
- [ ] System sends alerts via email when a monitor changes state
- [ ] Admin dashboard requires authentication (login to access)
- [ ] Public status page is accessible without login

### Out of Scope

- SMS alerts — unnecessary complexity for home lab use; Discord/email is sufficient
- Mobile app — web-first; dashboard is accessible via browser
- Multi-user / team accounts — single-admin tool, no team management
- External agent monitoring — all checks originate from the same host

## Context

- The project already has a full-stack scaffold: TanStack Start (React 19, SSR), Elysia API, Drizzle ORM, PostgreSQL, Better Auth, Tailwind v4, shadcn
- The stack is greenfield in terms of app logic — no existing monitoring features exist
- Home lab target: 20-100 monitors, Docker-deployed, accessible externally via reverse proxy or tunnel
- User is new to the uptime monitoring domain — decisions should be explained as they're made
- The monitoring worker (scheduler that runs checks) will need to run as a persistent background process; this fits naturally inside the Bun/Elysia server

## Constraints

- **Tech Stack**: Must use the existing TanStack Start + Elysia + Drizzle + PostgreSQL + Better Auth scaffold — no replacing core libraries
- **Runtime**: Bun (primary); the monitoring scheduler runs in-process with the Elysia server
- **Deployment**: Docker / docker-compose — must ship a Dockerfile and compose config
- **Scale**: Designed for 20-100 monitors; no need for distributed worker architecture
- **Auth**: Better Auth is already integrated — admin login uses existing auth system

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| In-process scheduler (not a separate worker process) | Simpler deployment for home lab — no separate service to manage | — Pending |
| PostgreSQL for check history | Already in stack; time-series queries on a modest dataset are fine at this scale | — Pending |
| Per-monitor check intervals | Home lab services vary widely in criticality; some need 30s, others 5m | — Pending |
| Public status page (no auth) | User wants both a shareable view and an unauthenticated personal view | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-30 after initialization*
