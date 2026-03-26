# Stack Research

**Domain:** Personal uptime monitoring, alerting, and status-page app
**Researched:** 2026-03-26
**Last confirmed:** 2026-03-26
**Confidence:** MEDIUM

## Chosen Stack

### Core Technologies

| Technology | Version | Purpose | Why Chosen | Confidence |
|------------|---------|---------|------------|------------|
| TanStack Start | RC | Frontend app shell, routing, SSR, and public/private pages | Chosen by project direction. Official docs still mark it as RC, so we should expect some integration churn early on. | MEDIUM |
| React | 19.x | UI runtime | TanStack Start's React path keeps the dashboard and public status pages in one app. | HIGH |
| ElysiaJS | current | Backend HTTP API and service layer | Chosen for monitor/admin APIs and internal backend logic. Official docs say it is optimized for Bun but supports Node too. | MEDIUM |
| PostgreSQL | 18.x | Primary system of record | Chosen current major release for durable monitoring and incident data. | HIGH |
| Redis | 7.x compatible | Queue backend and coordination | Required for reliable scheduling and dispatch. | HIGH |
| BullMQ | 5.x | Durable scheduler and job queue | Required for checks, retries, incident evaluation, and notifications. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | Why Chosen | Confidence |
|---------|---------|---------|------------|------------|
| drizzle-orm | current | Typed SQL access and schema definitions | Keeps the monitoring data model close to SQL. | HIGH |
| drizzle-kit | current | SQL migrations | Reviewable migrations for correctness-heavy data flows. | HIGH |
| better-auth | current | Authentication for the private dashboard | Fits the single-user requirement without hand-rolled auth. | MEDIUM-HIGH |
| zod | current | Runtime validation | Needed for monitor configs, API payloads, and channel settings. | HIGH |
| tailwindcss | current | Styling foundation | Fast UI iteration. | HIGH |
| shadcn/ui | current | UI building blocks | Good fit for admin-heavy screens. | MEDIUM-HIGH |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Biome | Formatting and linting | Fast default unless we later need ESLint-only plugins. |
| Vitest | Unit and integration tests | Prioritize state evaluation, incident transitions, and uptime calculations. |
| Playwright | End-to-end tests | Best fit for monitor setup, login, visibility, and alert/incident flows. |
| Docker Compose v2 | Local orchestration | Run `frontend`, `api`, `worker`, `postgres`, and `redis` in a shape close to production. |

## Architecture Consequences

This stack choice changes the app shape from a single full-stack framework into a split frontend/backend setup:

- `TanStack Start` owns the user-facing web app, routing, SSR, and public/private pages
- `ElysiaJS` owns the API and service boundary
- `BullMQ` workers own recurring checks, retries, incident evaluation, and notifications

That is a valid architecture for this product, but it means Phase 1 should establish frontend-to-API contracts early instead of relying on one-framework server functions everywhere.

## Runtime Direction

The framework choices do not completely settle the runtime choice:

- Elysia officially favors `Bun`
- BullMQ and the Redis worker ecosystem are most established on `Node`

The safest initial implementation path is:

- `TanStack Start` on Node
- `ElysiaJS` on Node
- dedicated BullMQ worker on Node

That keeps the monitoring engine on the most conservative runtime while still using Elysia as the backend framework. If we want to revisit Bun later, we can do that after the worker and incident pipeline are stable.

## Installation Shape

```bash
# frontend
npm install @tanstack/react-start @tanstack/react-router react react-dom tailwindcss

# backend + shared
npm install elysia drizzle-orm pg bullmq redis better-auth zod

# tooling
npm install -D drizzle-kit @biomejs/biome vitest @playwright/test
```

## Alternatives Considered

| Chosen | Alternative | Why We Rejected It |
|--------|-------------|--------------------|
| TanStack Start | Next.js | You explicitly want TanStack Start, even though it is less mature today. |
| ElysiaJS | Fastify or Hono | You explicitly want ElysiaJS for the backend ergonomics and style. |
| PostgreSQL 18 | PostgreSQL 17 | 18 is current and you want to target the newest stable major. |
| Tailwind + shadcn/ui | Tailwind-only or a custom component library | shadcn/ui gives a faster baseline for an admin-heavy interface. |

## Risks And Watchouts

- TanStack Start is still labeled `RC` in the official docs, so some APIs and ecosystem integrations may still shift.
- TanStack Start plus ElysiaJS means we should be deliberate about auth boundaries, cookies, CORS, and internal API contracts.
- Do not let frontend framework choices leak into the worker architecture. The monitor engine should remain independent from request lifecycles.
- Keep Postgres as the single durable source of truth. Do not split early into extra analytics storage just because uptime data is time-based.

## Prescriptive Recommendation

Use this as the locked v1 stack:

- TanStack Start + React for the frontend, dashboard, and public status pages
- ElysiaJS for the backend API
- PostgreSQL 18 as the primary database
- Redis 7 + BullMQ 5 for scheduling, retries, and notification dispatch
- Drizzle + drizzle-kit for schema and query work
- Better Auth for private-dashboard auth
- Tailwind CSS + shadcn/ui for the interface
- Zod, Vitest, Playwright, and Biome for validation and quality

## Sources

- https://tanstack.com/start/docs/overview — official docs confirm TanStack Start is currently in RC and built on TanStack Router + Vite
- https://tanstack.com/start/docs/getting-started/installation — official installation docs for TanStack Start
- https://elysiajs.com/quick-start — official Elysia quick start states Elysia is optimized for Bun but supports Node
- https://www.postgresql.org/docs/release/ — official PostgreSQL release notes show PostgreSQL 18 is current and receiving releases
- https://docs.bullmq.io/ — official BullMQ docs for queues, retries, and scheduling
- https://orm.drizzle.team/docs/overview — official Drizzle overview
- https://better-auth.com/docs/introduction — official Better Auth introduction
- https://ui.shadcn.com/docs — official shadcn/ui docs

---
*Stack decision updated after user selection on 2026-03-26*
