# Phase 1: Private Access Foundation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Secure the private-by-default dashboard and automation entry points for a single-user uptime monitoring application. This includes:
- Single-user authentication with optional OIDC support
- Secure session management across multiple devices
- API key generation and management for automation
- Ensuring all monitoring data remains private by default

Monitor creation, checking, incident management, and public status pages are handled in later phases.
</domain>

<decisions>
## Implementation Decisions

### Authentication Strategy
- **D-01:** Password-based login (email + password) as the primary authentication method
- **D-02:** Optional OIDC provider support (generic OIDC, configured via environment variables) as an additional authentication path alongside password auth
- **D-03:** Both password and OIDC can be enabled simultaneously; users choose their preferred method at login
- **D-04:** Password reset functionality deferred to a later phase if needed
- **D-05:** No two-factor authentication (2FA/MFA) required in Phase 1; can be added as optional enhancement later
- **D-06:** Session tokens stored in httpOnly, secure cookies (HTTPS-enforced)
- **D-07:** Post-login redirect targets the main dashboard (monitor list)

### Session Management
- **D-08:** Sessions persist for 30 days of validity
- **D-09:** Multiple independent sessions allowed simultaneously across devices
- **D-10:** Each device has its own session; logging out on one device does not invalidate others
- **D-11:** No remote session revocation UI in Phase 1
- **D-12:** No limit on concurrent active sessions
- **D-13:** No IP-based session validation
- **D-14:** CORS disabled; HTTPS enforcement with SameSite=Strict cookies

### HTTPS & Logout
- **D-15:** HTTPS enforced in production; HTTP allowed locally in development
- **D-16:** Logout action immediately invalidates the session and redirects user to login page
- **D-17:** No logout confirmation message

### API Key Scope and Permissions
- **D-18:** API keys scoped by monitor group/tag
- **D-19:** Each API key has configurable permission level: read-only OR read-write
- **D-20:** API key expiration is configurable per key at creation time
- **D-21:** API key rotation/regeneration happens in-place
- **D-22:** When creating a new API key, display the secret once; do not display it again in the UI

### API Key Management UI
- **D-23:** Clean list view for API keys showing: name, creation date, expiration date, last-used timestamp, scopes, permission level
- **D-24:** API key creation uses a single dialog/form (not a multi-step wizard)
- **D-25:** Each API key can be regenerated or revoked individually (no bulk operations in Phase 1)
- **D-26:** Revocation requires user confirmation before action completes
- **D-27:** Success feedback (revoke/regenerate) shown as a toast notification
- **D-28:** API keys can be named/labeled by the user

### API Key Tracking
- **D-29:** Last-used timestamp tracked for each API key
- **D-30:** No full audit log of every API call in Phase 1

### the agent's Discretion
- UI layout and visual design details (spacing, typography, colors)
- Exact form validation and error messages
- OIDC error handling strategies
- Database schema optimization for session/key storage

</decisions>

<canonical_refs>
## Canonical References

### Authentication & Session Management
- `.planning/PROJECT.md` — Single-user constraint, private-by-default principle
- `.planning/REQUIREMENTS.md` — AUTH-01, AUTH-02, STAT-01 requirements
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria
- `AGENTS.md` — Project agent configuration

### Technology Stack
- `.planning/research/STACK.md` — better-auth, TanStack Start, Tailwind/shadcn/ui, PostgreSQL 18

</canonical_refs>

<code_context>
## Existing Code Insights

### Codebase Status
The codebase is not yet initialized (project is in planning phase).

### Technology Setup Required
- **Frontend:** TanStack Start with React 19
- **Backend:** ElysiaJS for auth/session HTTP API endpoints
- **Database:** PostgreSQL 18
- **Auth Library:** better-auth (current version) with optional OIDC support
- **Styling:** Tailwind CSS + shadcn/ui

### Integration Points
- All private dashboard pages depend on the authentication middleware created in Phase 1
- All API endpoints authenticate via the API key system defined here
- Public status pages (Phase 5) explicitly do NOT use the auth system

</code_context>

<specifics>
## Specific Ideas

- **OIDC Flexibility:** User emphasized compatibility with OIDC providers via environment-variable configuration.
- **Automation Priority:** API keys are positioned as the primary automation interface.
- **Key Naming:** Labeled API keys help identify which key is used by which service (managing 20-50 monitors).

</specifics>

<deferred>
## Deferred Ideas

- **Two-Factor Authentication (2FA/MFA):** Can be added as optional feature in later phase
- **Password Reset Flow:** Deferred to later phase; Phase 1 focuses on initial setup
- **Remote Session Management UI:** Deferred; Phase 1 keeps it simple
- **Full API Key Audit Logging:** Phase 1 tracks last-used timestamp only
- **Bulk API Key Operations:** Deferred; Phase 1 supports per-key actions only

</deferred>

---

*Phase: 01-private-access-foundation*
*Context gathered: 2026-03-27*
