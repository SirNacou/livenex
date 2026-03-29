# Phase 1: Private Access Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves alternatives considered and rationale.

**Date:** 2026-03-27
**Phase:** 01-private-access-foundation
**Mode:** discuss
**Areas discussed:** Authentication Strategy, Session Security Boundaries, API Key Scope and Permissions, API Key Display and Revocation

---

## Authentication Strategy — Login method and session handling

### Key Decisions

| Question | Selected | Notes |
|----------|----------|-------|
| How should users authenticate to the private dashboard? | Password-based (recommended) | Standard, familiar. Uses better-auth password features. |
| How long should a session last? | Long session (30 days), manual logout | Balances convenience with security for personal use. |
| Multiple devices simultaneously? | Multiple active sessions (recommended) | Supports realistic workflow (phone, laptop, work desktop). |
| Require two-factor authentication (2FA/MFA)? | Not required in Phase 1 | Can be added as optional enhancement later. |
| How should session tokens be stored on the client? | httpOnly secure cookies (recommended) | Prevents XSS access. Standard best practice. |
| Should there be a password reset flow? | Defer to later phase | Phase 1 assumes password is set during initial setup. |
| After successful login, where should user be redirected? | Redirect to dashboard | Keep Phase 1 simple. |
| What should happen immediately after logout? | Clear session, redirect to login | Direct, no friction. |
| Should the dashboard enforce HTTPS? | HTTPS in production, HTTP in dev | Pragmatic: secure cookies in production, easier local development. |

### User-Initiated Addition: OIDC Provider Support

User stated: "I want it compatible with oidc provider so I can use their oidc to login instead of password if possible."

| Question | Selected | Notes |
|----------|----------|-------|
| Should OIDC be additional option or replace password? | OIDC + password (both options) | Users can choose either authentication path at login. |
| Should OIDC support generic or specific providers? | Generic OIDC (any provider) | Maximum flexibility. Any OIDC-compliant provider works. |
| How should OIDC provider details be configured? | Environment variables (recommended) | Simpler, more secure. Secrets not in UI. |

---

## Session Security Boundaries — Multi-device, timeout, cross-device invalidation

| Question | Selected | Notes |
|----------|----------|-------|
| If you log out on your phone, should your laptop session also be invalidated? | Independent per device (recommended) | Allows selective logout without affecting other devices. |
| Should users be able to see and revoke active sessions? | No session management UI | Simpler for Phase 1. Remote revocation deferred. |
| Should there be a limit on concurrent active sessions? | No limit (recommended) | Personal use case doesn't require hard limits. |
| Should the system detect and warn about unusual IP changes? | No IP validation | Simpler, less privacy-invasive tracking. |
| Should the dashboard allow cross-origin (CORS) requests? | CORS disabled, SameSite=Strict (recommended) | API keys are the automation interface. No need for cross-origin requests. |

---

## API Key Scope and Permissions — What can API keys do?

| Question | Selected | Notes |
|----------|----------|-------|
| Should API keys be unrestricted or scoped to groups/tags? | Scoped to groups/tags (recommended) | Enables fine-grained automation workflows. Different keys for different monitor groups. |
| Should API keys have permission levels (read-only vs read-write)? | Read-only or read-write per key | Allows read-only keys for monitoring/status APIs and write keys for control/updates. |
| Should API keys expire automatically or only be revoked manually? | Configurable per key | Flexible. Some keys might be short-lived, others persistent. |
| How should key rotation work if a key is compromised? | Rotate in place (regenerate) | Smoother UX. System generates new secret for same key ID. |

---

## API Key Display and Revocation — User experience for key management

| Question | Selected | Notes |
|----------|----------|-------|
| How should API key be displayed after creation? | Show once, then hide (recommended) | Standard practice (GitHub, AWS). User must copy immediately. |
| Should users be able to name/label API keys? | Label/name each key (recommended) | At scale (20-50 monitors), labeled keys help identify which key is used by which service. |
| Should API key usage be tracked or logged? | Last-used timestamp (recommended) | Helps identify unused or suspicious keys without full audit logging overhead. |
| How should API keys be displayed in the dashboard? | Clean list view (recommended) | Dense, scannable. Show: name, creation date, expiration date, last-used, scopes, permission. |
| Should users be able to bulk revoke/regenerate keys? | Per-key actions only | Simpler implementation. Bulk operations deferred if needed. |
| How should the key creation flow work? | Single dialog/form (recommended) | Fast and simple. All settings in one place. |
| When user revokes an API key, should they confirm first? | Require confirmation (recommended) | Prevents accidental revocation of important keys. |
| What feedback should the user see after revoke/regenerate? | Toast notification | Non-intrusive, auto-dismissing feedback. |

---

## Summary

All four gray areas were discussed and resolved:

1. **Authentication Strategy** — Password-based primary auth + optional OIDC via env vars
2. **Session Security Boundaries** — 30-day sessions, multiple independent devices, no remote session management UI
3. **API Key Scope and Permissions** — Scoped by groups/tags, read-only/read-write per key, configurable expiration
4. **API Key Display and Revocation** — Clean list view, labeled keys, per-key actions, toast notifications

---

## Deferred Ideas

- **Two-Factor Authentication (2FA/MFA)** — Discussed; deferred to optional feature in later phase
- **Password Reset Flow** — Discussed; deferred to later phase
- **Remote Session Revocation UI** — Discussed; deferred to Phase 2 or later
- **Full API Key Audit Logging** — Discussed; Phase 1 tracks last-used timestamp only
- **Bulk API Key Operations** — Discussed; deferred; Phase 1 supports per-key actions only

---

*Phase: 01-private-access-foundation*
*Discussion completed: 2026-03-27*
