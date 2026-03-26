# Stack Research

**Domain:** Personal uptime monitoring, alerting, and status-page app
**Researched:** 2026-03-26
**Confidence:** MEDIUM-HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Next.js | 16.x | Dashboard UI, admin flows, API routes, public status pages | This is the current full-stack React default. App Router, server actions, caching primitives, and route-level rendering control fit a private dashboard plus selectively public pages without introducing a second frontend stack. | HIGH |
| React | 19.x | UI runtime | React 19 is stable and is the baseline for modern full-stack React. Its form actions and optimistic UI primitives reduce client boilerplate for monitor setup, incident updates, and notification settings. | HIGH |
| Node.js | 22 LTS | Web runtime and worker runtime | For this product, Node is the right runtime because the core problem is durable background execution, network I/O, TLS inspection, and queue workers, not edge rendering. Node 22 is an LTS release approved for production use. | HIGH |
| PostgreSQL | 17.x | Primary system of record | Postgres is the standard relational base for monitors, check results, incidents, maintenance windows, notification policies, audit trails, and uptime rollups. Postgres 17 improves high-concurrency performance and keeps the whole product on one durable database instead of splitting OLTP and analytics too early. | HIGH |
| Redis | 7.x compatible | Queue backend, short-lived locks, dedupe, rate limiting | You need a real in-memory coordination layer once checks, retries, confirmation windows, and alert fanout run outside the request cycle. Redis is the standard fit here. | HIGH |
| BullMQ | 5.x | Durable job queue and scheduler | BullMQ gives you retries, repeatable jobs, concurrency controls, delayed jobs, and crash recovery. That maps directly to confirmed-failure logic, heartbeat expiration, alert dispatch, and scheduled maintenance tasks. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| drizzle-orm | 0.44.x | Typed SQL access and schema definitions | Use as the default ORM/query layer. This domain needs SQL-first queries, partial indexes, rollups, and incident logic that stay close to the database; Drizzle is better here than a heavier abstraction. | MEDIUM-HIGH |
| drizzle-kit | 0.31.x | SQL migrations | Use for schema migration generation and reviewable SQL files. This keeps database evolution explicit, which matters for uptime calculations and incident integrity. | MEDIUM-HIGH |
| better-auth | 1.3.x | Authentication for the private dashboard | Use if you want a conventional login and sessions without hand-rolling auth. For a single-user app, keep it minimal: email/password or one seeded local account plus session cookies. | MEDIUM |
| zod | 4.1.x | Runtime validation | Use for monitor definitions, notification channel configs, alert payloads, webhook bodies, and admin actions. Monitoring systems ingest a lot of untrusted config and external payloads; runtime validation is not optional. | HIGH |
| redis | 5.x | Direct Redis access outside BullMQ | Use for lightweight locks, idempotency keys, and ephemeral counters where a full queue job is unnecessary. Prefer the official Redis client for new direct Redis code. | HIGH |
| resend | 4.5.x | Transactional email alerts | Use for the first email alert channel. It is simpler than standing up SMTP yourself, and email remains the default notification path users expect. | MEDIUM |
| Tailwind CSS | 4.1.x | UI styling | Use for fast dashboard and status-page implementation. It is standard, low-risk, and integrates cleanly with Next.js. | MEDIUM-HIGH |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Biome 2.2.x | Formatting and linting | Use one fast tool instead of maintaining a large ESLint + Prettier stack unless the repo already standardizes on ESLint. Next.js 16 explicitly no longer runs `next lint`. |
| Vitest 3.2.x | Unit and integration tests | Use for monitor evaluation logic, uptime aggregation, incident state transitions, and alert deduping. These are the highest-risk correctness paths. |
| Playwright 1.55.x | End-to-end tests | Use for monitor creation, status-page visibility, login, public-page caching behavior, and incident lifecycle verification in the browser. |
| Docker Compose v2 | Local orchestration | Run `web`, `worker`, `postgres`, and `redis` together locally. This is the fastest way to test the actual production shape before deployment. |

## Installation

```bash
# Core
npm install next react react-dom drizzle-orm pg bullmq redis zod better-auth tailwindcss resend

# Supporting
npm install drizzle-kit

# Dev dependencies
npm install -D typescript @types/node @biomejs/biome vitest @vitest/coverage-v8 @playwright/test
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 | Remix | Use Remix if you want a more explicit request/response mental model and do not care about the broader Next ecosystem or built-in hybrid rendering for public status pages. |
| PostgreSQL 17 | MySQL 8 / MariaDB | Use only if you already operate MySQL well. For a greenfield monitoring product, Postgres has the stronger default story for constraints, partial indexes, JSON support, and operational patterns. |
| BullMQ + Redis | Inngest / Trigger.dev | Use if you are comfortable with a managed workflow dependency and want to offload queue operations. For a self-hosted personal monitor, BullMQ keeps the reliability-critical path under your control. |
| Drizzle ORM | Prisma | Use Prisma if team familiarity and admin tooling outweigh the need for SQL-first control. For this app, the query layer benefits from staying close to SQL. |
| Tailwind CSS | Plain CSS Modules | Use CSS Modules if you want a smaller dependency surface and a more bespoke visual system. Tailwind is still the faster default for shipping the first version. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| SQLite or Turso as the primary production database | This app has a web process plus a worker process, recurring writes, incident state transitions, and uptime aggregation. SQLite’s own guidance is to choose a client/server database when data is separated from the app by a network or when you have many concurrent writers. | PostgreSQL 17 |
| Vercel Cron or request-triggered serverless cron as the core monitoring scheduler | Vercel Cron is designed around HTTP-triggered Vercel Functions. That is fine for light scheduled tasks, but it is the wrong place to anchor your core monitor scheduler, queue recovery, and alert confirmation logic. Keep cron as a trigger at most, not the source of truth. | BullMQ scheduler on a long-lived worker |
| Edge runtime for monitor execution | TLS checks, Redis queue connections, durable workers, and longer-running network tasks fit the Node runtime better. The worker should be a normal long-lived Node process, not an edge function. | Node.js 22 worker service |
| A separate analytics/time-series stack in v1 | ClickHouse, Tinybird, or Timescale add operational weight before you have scale pressure. For 20 to 50 monitors, Postgres rollups are enough and much easier to reason about. | Postgres tables plus periodic rollups/materialized summaries |
| Hand-rolled auth | Single-user scope does not justify inventing session management, password reset, rate limiting, and CSRF handling yourself. | Better Auth or a very small, battle-tested auth layer |

## Stack Patterns by Variant

**If you want the simplest reliable self-hosted deployment:**
- Use one Next.js app container, one Node worker container, one Postgres instance, and one Redis instance.
- Because this keeps the topology obvious and matches the operational boundaries of the product: UI/API, background checks, durable storage, and queue coordination.

**If you want the simplest managed deployment:**
- Use a managed Postgres, a managed Redis, host the Next.js app separately from the worker, and keep BullMQ in the worker tier.
- Because the main mistake in this category is deploying the UI but forgetting the product is actually worker-first.

**If public status pages need to be extremely cacheable later:**
- Keep the main app in Next.js and optimize the public routes with aggressive caching and tag-based revalidation first.
- Because splitting the status page into a second app too early increases auth, routing, and deployment complexity for little gain at this scale.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@16.x` | `react@19.x` | Next.js 16 is built around React 19.x and requires Node 20.9+; prefer Node 22 LTS for production. |
| `next@16.x` | `typescript@5.1+` | Next.js 16 requires TypeScript 5.1 or newer. |
| `@playwright/test@1.55.x` | `node@20.x/22.x/24.x` | Playwright officially supports current Node LTS/current lines; Node 22 is the clean default here. |
| `bullmq@5.x` | `redis@7.x compatible backend` | Keep BullMQ backed by a dedicated Redis instance or logical DB; do not mix monitoring-critical queues with unrelated noisy workloads. |

## Prescriptive Recommendation

If I were building this in 2026 from scratch for one person and 20 to 50 monitors, I would use:

- Next.js 16 + React 19 for the dashboard, admin API, and public status pages
- Node.js 22 for both the app runtime and a separate long-lived worker
- PostgreSQL 17 as the only primary database
- Redis 7 + BullMQ 5 for scheduling, retries, dedupe, and alert delivery
- Drizzle + drizzle-kit for schema and query work
- Zod for all runtime validation
- Better Auth for minimal private-dashboard auth
- Tailwind 4, Biome 2, Vitest 3, and Playwright 1.55 for delivery speed and test coverage

That is the standard stack because it solves the real product shape: a web app wrapped around a scheduler/worker system. The main architectural rule is simple: do not let the monitoring engine depend on request lifecycles.

## Sources

- https://nextjs.org/blog/next-16 — verified Next.js 16 release, React 19.2 alignment, Node/TypeScript version requirements
- https://nextjs.org/docs/app/getting-started — verified current App Router docs are actively updated in 2026
- https://react.dev/blog/2024/12/05/react-19 — verified React 19 is stable and current core features
- https://nodejs.org/en/about/previous-releases — verified Node 22 is Maintenance LTS and approved for production use
- https://www.postgresql.org/about/news/postgresql-17-released-2936/ — verified PostgreSQL 17 is the current mature major with concurrency/performance improvements
- https://docs.bullmq.io/ — verified BullMQ queue semantics, scheduled/repeatable jobs, retries, and crash recovery features
- https://redis.io/docs/latest/develop/clients/nodejs/ — verified `redis` is the recommended Node.js client for new Redis code
- https://orm.drizzle.team/docs/overview — verified Drizzle’s SQL-like positioning and migration support
- https://better-auth.com/docs/introduction — verified Better Auth feature scope and framework-agnostic design
- https://www.sqlite.org/whentouse.html — verified SQLite guidance against network-separated deployments and many concurrent writers
- https://vercel.com/docs/cron-jobs — verified Vercel Cron is HTTP-triggered Vercel Functions, not a worker queue replacement
- https://www.npmjs.com/package/drizzle-orm — version check for `drizzle-orm` 0.44.x
- https://www.npmjs.com/package/drizzle-kit — version check for `drizzle-kit` 0.31.x
- https://www.npmjs.com/package/bullmq — version check for `bullmq` 5.x
- https://www.npmjs.com/package/better-auth — version check for `better-auth` 1.3.x
- https://www.npmjs.com/package/zod — version check for `zod` 4.1.x
- https://www.npmjs.com/package/tailwindcss — version check for `tailwindcss` 4.1.x
- https://www.npmjs.com/package/@biomejs/biome — version check for `@biomejs/biome` 2.2.x
- https://www.npmjs.com/package/vitest — version check for `vitest` 3.2.x
- https://www.npmjs.com/package/@playwright/test?activeTab=versions — version check for `@playwright/test` 1.55.x
- https://www.npmjs.com/package/resend — version check for `resend` 4.5.x

---
*Stack research for: personal uptime monitoring, alerting, and status-page app*
*Researched: 2026-03-26*
