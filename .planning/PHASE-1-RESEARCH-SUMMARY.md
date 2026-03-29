# Phase 1: Private Access Foundation - Research Summary

**Research Date:** 2026-03-27  
**Status:** Ready for Planning  
**Confidence Level:** HIGH

---

## Executive Summary

Phase 1 is the foundational security layer for Livenex. It establishes a **single-user private-by-default dashboard** with secure authentication and automation entry points via API keys. This phase has **no monitor creation, checking, or alerting logic**—those are deferred to later phases. The focus is purely on access control, session management, and API key infrastructure that later phases depend on.

**Primary Recommendation:** Implement Phase 1 with password-based authentication + optional OIDC support, httpOnly session cookies, and scoped API keys with granular permissions. This approach aligns with the project's "fast and trustworthy" ethos while building a secure foundation for the entire system.

---

## What Phase 1 Is Trying to Achieve

Phase 1 must answer: **"How do we keep the private dashboard private and enable secure automation?"**

Specifically:
1. **Secure single-user login** to the private dashboard (no multi-user complexity in v1)
2. **Private-by-default data** — all monitoring data remains hidden from unauthenticated visitors
3. **Reliable session management** across multiple devices (phone, laptop, work desktop)
4. **Secure automation** via API keys that can be scoped, permissioned, and revoked
5. **Fast setup** — users can start using the app immediately after installation with minimal configuration

This is the **prerequisite for everything else**. Phases 2, 3, 4, and 5 all depend on the authentication and API key infrastructure built here.

---

## Core Deliverables

### 1. Authentication System
- **Password-based login** (email + password) as the primary authentication method
  - Powered by `better-auth` library
  - Single user account (no multi-user registration)
  - No password reset flow in Phase 1 (deferred)
  
- **Optional OIDC provider support** (generic, any OIDC-compliant provider)
  - Configured via environment variables (not UI)
  - Users can choose between password or OIDC at login time
  - Both methods can be enabled simultaneously
  
- **Session token storage** via httpOnly, secure cookies
  - HTTPS-enforced in production (HTTP allowed in dev)
  - 30-day session validity
  - SameSite=Strict CORS policy

### 2. Session Management
- **Multi-device support** — Users can have multiple independent sessions simultaneously (phone + laptop + work desktop)
- **Per-device logout** — Logging out on one device does NOT invalidate sessions on other devices
- **No session revocation UI** in Phase 1 (deferred to later phases)
- **No IP-based validation** or unusual-activity warnings (kept simple)
- **No concurrent session limit**

### 3. API Key System
- **Create, view, and revoke API keys** from the dashboard
- **Scoped permissions** — each API key is limited to specific monitor groups/tags
- **Permission levels** — each key can be read-only OR read-write
- **Configurable expiration** per key (can be short-lived or persistent)
- **Key regeneration** — users can rotate a key in-place if needed
- **Last-used tracking** — system tracks when each key was last used (helps identify unused or suspicious keys)
- **Labeled keys** — users can name their API keys to identify which service uses which key
- **Display-once secret** — API key secret is shown once after creation; not displayed again in UI (standard practice like GitHub/AWS)

### 4. Dashboard Entry Points
- **Login page** — email/password or OIDC provider selection
- **Dashboard home** — links to Monitor List, API Keys, Settings (monitor creation deferred to Phase 2)
- **API Keys management page** — clean list view with create, view, edit, regenerate, revoke actions
- **Logout action** — clears session immediately and redirects to login

### 5. Access Control Boundaries
- **Private pages** — require authentication:
  - Dashboard (monitor list, settings, API keys)
  - All admin views
  
- **Public pages** — NO authentication required:
  - Status pages (created in Phase 5)
  - Health check endpoints (if needed for monitoring)

---

## Success Criteria

Phase 1 is complete when:

1. **User can sign in to the private dashboard** with a single-user account (password or OIDC)
2. **All monitoring data stays private** — unauthenticated visitors see login page, not data
3. **User can create, view, and revoke API keys** without any monitoring data leaking
4. **User can toggle between password and OIDC** authentication if both are configured
5. **Sessions persist across multiple devices** independently (logout on phone doesn't affect laptop)
6. **API keys are scoped and permissioned** — can be limited to specific tags/groups with read or read-write access
7. **Key secrets display only once** after creation (user must copy immediately)
8. **API key operations show success feedback** via toast notifications

All requirements mapped to Phase 1:
- `AUTH-01`: User can sign in to the private dashboard with a single-user account ✓
- `AUTH-02`: User can create, view, and revoke API keys for automation ✓
- `STAT-01`: User can keep all monitoring data private by default behind authentication ✓

---

## Key Constraints and Acceptance Criteria

### Hard Constraints (from CONTEXT.md decisions)

| Constraint | Decision | Impact |
|-----------|----------|--------|
| **Single-user only** | No multi-user accounts, registration, or team features | Simplifies auth, avoids role/permission complexity |
| **Password-based primary auth** | Use `better-auth` with email + password | Standard, familiar to users |
| **OIDC is optional** | Environment-variable configured, not UI-driven | Flexibility without UI bloat |
| **httpOnly secure cookies** | Session tokens stored in httpOnly, SameSite=Strict cookies | XSS-safe, prevents CORS issues |
| **Session validity: 30 days** | Long sessions, manual logout only | Convenience for personal use |
| **Multi-device support** | Each device has independent session | No cross-device logout |
| **No password reset in Phase 1** | Password set during initial setup; reset deferred | Scope control |
| **No 2FA in Phase 1** | Can be added later as optional enhancement | Simplifies Phase 1 |
| **API keys scoped by tags/groups** | Each key limited to specific monitor groups | Fine-grained automation control |
| **API key permissions: read-only OR read-write** | No custom permission matrix in Phase 1 | Simple, covers automation use cases |
| **Key secret: display once, hide after** | Standard practice (GitHub/AWS pattern) | Prevents accidental re-display of secrets |
| **Last-used tracking only** | No full audit log of every API call | Lighter implementation, still useful |

### Acceptance Criteria

- [ ] User can sign in with valid password → dashboard loads
- [ ] User can sign in with OIDC (if configured) → dashboard loads
- [ ] Invalid credentials → error message, stay on login page
- [ ] Logout → session cleared, redirect to login page
- [ ] Multiple concurrent sessions work independently (phone + laptop)
- [ ] Session expires after 30 days of inactivity (can be extended via activity)
- [ ] API key created with scopes and permission level → secret displayed once
- [ ] API key revoked → immediately stops working for subsequent API calls
- [ ] API key regenerated → old secret stops working, new secret provided
- [ ] Last-used timestamp updated when key is used in an API call
- [ ] Unauthenticated visitor → cannot view dashboard, sees login page
- [ ] HTTPS enforced in production, HTTP allowed in dev
- [ ] CORS disabled; API keys are the automation interface

---

## Dependencies and Prerequisites

### External Dependencies

| Dependency | Required By | Status | Fallback |
|-----------|------------|--------|----------|
| **PostgreSQL 18.x** | Session and API key storage | Required | — |
| **Redis 8.x** | Queue backend for job coordination | Used by later phases (Phase 2+) | — |
| **Node.js runtime** | TanStack Start, ElysiaJS, BullMQ | Required | — |
| **npm** | Package management | Required | — |

### Library Dependencies (from AGENTS.md STACK.md)

| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| **better-auth** | current | Core authentication library (password + OIDC) | MEDIUM-HIGH |
| **TanStack Start** | RC | Frontend app shell, routing, SSR | MEDIUM |
| **React** | 19.x | UI runtime | HIGH |
| **ElysiaJS** | current | Backend API server (auth endpoints) | MEDIUM |
| **PostgreSQL** | 18.x | Primary system of record | HIGH |
| **drizzle-orm** | current | Typed SQL access and schema | HIGH |
| **drizzle-kit** | current | SQL migrations | HIGH |
| **zod** | current | Runtime validation (API payloads) | HIGH |
| **Tailwind CSS** | current | Styling foundation | HIGH |
| **shadcn/ui** | current | UI building blocks | MEDIUM-HIGH |

### Phase Dependencies

- **Phase 1 depends on:** Nothing (first phase, greenfield)
- **Phases 2, 3, 4, 5 depend on:** Phase 1 (auth/API keys must exist before monitor creation)

### Database Schema Prerequisites

Phase 1 must define:
- **Users table** — single-user account with email, password hash (via better-auth)
- **Sessions table** — session tokens, creation time, expiration, device info (via better-auth)
- **API Keys table** — key ID, secret hash, scopes, permission level, expiration, creation time, last-used timestamp
- **API Key Scopes junction table** — link API keys to monitor groups/tags (for Phase 2 onward)

---

## Requirements Traceability

| Requirement ID | Description | Phase 1 Coverage | Implementation Notes |
|---------------|-------------|-----------------|----------------------|
| **AUTH-01** | User can sign in to the private dashboard with a single-user account | ✓ Full | Password or OIDC login, httpOnly cookies, 30-day sessions |
| **AUTH-02** | User can create, view, and revoke API keys for automation | ✓ Full | Scoped by tags/groups, read-only/read-write, configurable expiration, last-used tracking |
| **STAT-01** | User can keep all monitoring data private by default behind authentication | ✓ Full | All dashboard pages require authentication; public status pages in Phase 5 |

---

## What Phase 1 Does NOT Include

Explicitly deferred to later phases:

| Feature | Phase | Reason |
|---------|-------|--------|
| **Password reset flow** | Later (when users need it) | Scope control; Phase 1 assumes password set during setup |
| **Two-factor authentication (2FA/MFA)** | Later | Optional enhancement, not required for v1 |
| **Remote session revocation UI** | Phase 2+ | Can see and revoke other sessions; complex UI, lower priority |
| **Full API key audit logging** | Later | Phase 1 tracks last-used only; full audit log is lower priority |
| **Bulk API key operations** | Later | Phase 1 supports per-key actions only |
| **Monitor creation** | Phase 2 | Monitor CRUD belongs in Phase 2 |
| **Health checks / incident logic** | Phases 3+ | State evaluation, incidents, notifications in later phases |
| **Public status pages** | Phase 5 | Status pages depend on monitor and incident data from Phases 2-4 |

---

## Technical Architecture Notes

### Frontend Structure (TanStack Start)
- **Login page** — `/auth/login` (public, no auth required)
- **Dashboard pages** — `/dashboard/*` (require authentication)
- **API Keys page** — `/settings/api-keys` (require authentication)
- **Logout action** — `POST /auth/logout` (require authentication)

### Backend API (ElysiaJS)
- **`POST /auth/signin`** — password login
- **`POST /auth/oidc/authorize`** — OIDC redirect to provider
- **`POST /auth/oidc/callback`** — OIDC provider callback
- **`POST /auth/logout`** — logout (clear session)
- **`GET /auth/session`** — get current session (if authenticated)
- **`POST /api/keys`** — create API key
- **`GET /api/keys`** — list API keys
- **`GET /api/keys/:id`** — view API key (without secret)
- **`POST /api/keys/:id/regenerate`** — rotate API key
- **`DELETE /api/keys/:id`** — revoke API key
- **`POST /api/validate`** — validate API key (used by other phases)

### Session Storage (PostgreSQL + httpOnly Cookies)
- Session tokens stored in httpOnly, secure cookies (XSS-safe)
- Session metadata (creation time, expiration, device info) in PostgreSQL
- No session replay attacks (tokens are cryptographically signed)
- HTTPS enforcement in production

### API Key Storage (PostgreSQL)
- API key secrets are hashed before storage (never stored in plaintext)
- Validation performs hash comparison, not plaintext storage
- Last-used timestamp updated on each API call

---

## Standard Stack Applied to Phase 1

### Authentication & Sessions
- **better-auth** — Single-source-of-truth for password and OIDC flows
- **httpOnly cookies** — Session token storage (XSS-safe, HTTPS-enforced)
- **PostgreSQL** — Stores users, sessions, API keys
- **drizzle-orm** — Typed SQL for schema and queries

### Frontend
- **TanStack Start** — Routing, SSR, page structure
- **React 19** — UI runtime
- **Tailwind CSS + shadcn/ui** — Fast UI iteration for login, dashboard, API keys pages

### Backend
- **ElysiaJS** — HTTP API for auth endpoints (signin, logout, OIDC, API key CRUD)
- **zod** — Runtime validation for auth payloads and API requests

### Validation
- **Existing test framework** — TBD (from Wave 0 of the plan)
- **Test strategy** — Unit tests for auth flows, integration tests for session handling

---

## Development Workflow

### Entry Point
- Use `/gsd:execute-phase 01-private-access-foundation` to begin Phase 1 work
- Plans will be generated from this research document

### Code Location
- Frontend code: `src/`
- Backend code: `src/api/` (ElysiaJS)
- Database: `db/` (Drizzle schema and migrations)
- Components: `src/components/` (shadcn/ui, Login, Dashboard, APIKeys)

### Local Development
- HTTP allowed in development (for easier local testing)
- HTTPS enforced in production (for security)
- PostgreSQL and Redis running locally or in Docker

### Commit Strategy
- Research committed to `.planning/phases/01-private-access-foundation/01-RESEARCH.md`
- Plans committed incrementally as tasks complete
- Implementation commits follow phase completion

---

## Open Questions and Gaps

1. **OIDC Provider Details**
   - Which OIDC providers will be tested? (Google, GitHub, generic OIDC?)
   - What environment variable names are used for OIDC config?
   - How are OIDC errors handled (missing provider config, callback failures)?

2. **Database Schema Details**
   - Exact schema for `sessions` table (beyond `better-auth` defaults)?
   - How are API key scopes stored and validated efficiently?
   - Audit trail for API key creation/revocation?

3. **UI/UX Details**
   - Login page design (password + OIDC provider selector)?
   - API Keys list UI (table, cards, inline editing)?
   - Toast notification styles and timing?

4. **Testing Strategy**
   - Unit tests for `better-auth` integration?
   - Integration tests for session lifecycle?
   - API key scoping and permission validation tests?

These gaps will be addressed during the planning phase.

---

## Success Indicators for Phase 1

✅ When Phase 1 is complete:

1. User navigates to the app → redirected to login page
2. User enters valid credentials → redirected to dashboard
3. User can see empty monitor list (Phase 2 will populate this)
4. User can create an API key → see secret once, then it's hidden
5. User can list, regenerate, and revoke API keys
6. User can logout → redirected to login page
7. User can log back in → session restored
8. User logs in on phone + laptop → two independent sessions, each device can logout independently
9. Unauthenticated visitor cannot access `/dashboard` → redirected to login
10. API key validation works (used by Phase 2+ for API authentication)

Phase 1 is NOT responsible for:
- Creating monitors (Phase 2)
- Running checks or evaluating state (Phases 3+)
- Managing incidents or sending alerts (Phase 4)
- Creating public status pages (Phase 5)

---

## Project Constraints Alignment

✓ **Single-user only** — No multi-user features in Phase 1  
✓ **Private by default** — All dashboard pages require authentication  
✓ **Fast setup** — OIDC and better-auth enable quick initial login  
✓ **API keys for automation** — Scoped, permissioned, auditable  
✓ **Zero missed incidents** — Incident logic deferred (Phase 4)  
✓ **Near-zero false positives** — Alert logic deferred (Phase 4)  

---

## Sources and References

### Primary Documentation
- `.planning/REQUIREMENTS.md` — Phase 1 requirements (AUTH-01, AUTH-02, STAT-01)
- `.planning/ROADMAP.md` — Phase 1 goals and success criteria
- `.planning/phases/01-private-access-foundation/01-CONTEXT.md` — Implementation decisions (D-01 through D-30)
- `.planning/phases/01-private-access-foundation/01-DISCUSSION-LOG.md` — Rationale for decisions

### Stack References
- `AGENTS.md` — Technology stack (better-auth, TanStack Start, ElysiaJS, PostgreSQL, drizzle-orm)
- Official docs:
  - https://better-auth.com/docs/introduction
  - https://tanstack.com/start/docs/overview
  - https://elysiajs.com/quick-start
  - https://orm.drizzle.team/docs/overview

---

## Metadata

**Research Date:** 2026-03-27  
**Phase:** 01-private-access-foundation  
**Phase Number:** 1  
**Status:** Ready for Planning  
**Confidence:** HIGH  

**Confidence Breakdown:**
- **Requirements clarity:** HIGH — Well-defined AUTH-01, AUTH-02, STAT-01 requirements
- **Decision stability:** HIGH — All 30 decisions locked in CONTEXT.md
- **Stack alignment:** HIGH — Stack documented in AGENTS.md
- **Architecture patterns:** MEDIUM — TanStack Start is RC, some integration unknowns
- **Dependencies:** HIGH — All external dependencies identified

**Valid Until:** 2026-04-27 (30 days; stable domain, unlikely to change)

**Next Steps:**
1. Use `/gsd-plan-phase 01` to generate executable task plans
2. Execute plans with `/gsd:execute-phase 01-private-access-foundation`
3. Research output can be referenced in planning for detailed technical decisions
