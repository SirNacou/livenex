<!-- GSD:project-start source:PROJECT.md -->
## Project

**Livenex**

Livenex is a single-user uptime monitoring, alerting, and status-page app built for personal use as an alternative to hosted uptime tools. It helps track websites, APIs, content checks, SSL expiry, and heartbeat jobs from one private dashboard, while optionally exposing selected monitor groups through shareable public status pages.

**Core Value:** Detect real outages reliably with zero missed incidents and near-zero false positives, while staying fast enough to configure and trust for everyday personal use.

### Constraints

- **Product Scope**: Single-user only in v1 — avoids introducing unnecessary team/account complexity
- **Visibility Model**: Private by default with optional public pages by tag/group — preserves personal operational control while allowing selective sharing
- **Alerting**: One down alert and one resolved alert only after retries confirm failure — minimizes alert fatigue and false positives
- **Monitoring Footprint**: Single check location in v1 — keeps the architecture simpler while still covering the intended personal-use cases
- **Performance**: Adding a monitor and notification channel should take under 60 seconds — setup speed is part of the replacement bar
- **Reliability**: Must pass a 7-day soak test with zero missed outages and zero false positives — trustworthiness is the primary acceptance criterion
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Chosen Stack
### Core Technologies
| Technology | Version | Purpose | Why Chosen | Confidence |
|------------|---------|---------|------------|------------|
| TanStack Start | RC | Frontend app shell, routing, SSR, and public/private pages | Chosen by project direction. Official docs still mark it as RC, so expect some integration churn early on. | MEDIUM |
| React | 19.x | UI runtime | TanStack Start's React path keeps dashboard and status pages in one app. | HIGH |
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
### Architecture Consequences
- `TanStack Start` owns the web app, SSR, and public/private pages.
- `ElysiaJS` owns the API/service boundary.
- `BullMQ` workers own recurring checks, retries, incident evaluation, and notifications.
- This means we should establish explicit frontend-to-API contracts early instead of relying on one-framework server functions everywhere.
### Runtime Direction
- Elysia officially favors Bun, but BullMQ and the Redis worker ecosystem are most established on Node.
- Safest initial path: run `TanStack Start`, `ElysiaJS`, and the BullMQ worker on Node first.
## Sources
- https://tanstack.com/start/docs/overview
- https://tanstack.com/start/docs/getting-started/installation
- https://elysiajs.com/quick-start
- https://www.postgresql.org/docs/release/
- https://docs.bullmq.io/
- https://orm.drizzle.team/docs/overview
- https://better-auth.com/docs/introduction
- https://ui.shadcn.com/docs
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
