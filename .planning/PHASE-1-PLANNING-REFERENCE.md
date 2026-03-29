# Phase 1: Private Access Foundation - Planning Reference

**Generated:** 2026-03-27  
**Status:** Ready for Planning

---

## Quick Reference: Phase 1 Scope Map

```
┌─────────────────────────────────────────────────────────────┐
│                       PHASE 1 SCOPE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ IN SCOPE:                                              │
│  ├─ Password + OIDC login                                  │
│  ├─ Session management (30-day, multi-device)             │
│  ├─ API key CRUD (create, list, regenerate, revoke)       │
│  ├─ API key scopes and permissions (read/write)           │
│  ├─ Private dashboard pages (require auth)                │
│  └─ API key last-used tracking                            │
│                                                             │
│  ❌ OUT OF SCOPE (defer to later phases):                 │
│  ├─ Monitor creation/editing (Phase 2)                     │
│  ├─ Monitor state evaluation (Phase 3)                     │
│  ├─ Incident management (Phase 4)                          │
│  ├─ Notifications/alerts (Phase 4)                         │
│  ├─ Public status pages (Phase 5)                          │
│  ├─ Password reset flow (Phase ?+)                         │
│  ├─ 2FA/MFA (Phase ?+)                                     │
│  └─ Full API audit logging (Phase ?+)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Requirements Mapping

### Satisfied by Phase 1

| Requirement | Type | Description | Acceptance Criterion |
|------------|------|-------------|----------------------|
| **AUTH-01** | Feature | User can sign in to the private dashboard with a single-user account | User enters email/password (or OIDC) → dashboard loads with authenticated session |
| **AUTH-02** | Feature | User can create, view, and revoke API keys for automation | User can CRUD API keys; each key is scoped, permissioned, and tracked |
| **STAT-01** | Feature | User can keep all monitoring data private by default behind authentication | Unauthenticated visitor → login page (no data visible) |

---

## Core Decisions (from CONTEXT.md)

### D-01 to D-07: Authentication Strategy
| Decision | Implementation |
|----------|-----------------|
| **D-01** — Password-based login primary | Use `better-auth` with email + password form |
| **D-02** — Optional OIDC support | Environment-variable configured OIDC provider |
| **D-03** — Both methods enabled simultaneously | Users choose method at login time |
| **D-04** — Password reset deferred | Phase 1 assumes password set during initial setup |
| **D-05** — No 2FA in Phase 1 | Can be added later as optional enhancement |
| **D-06** — httpOnly secure cookies | Session tokens stored securely, XSS-safe |
| **D-07** — Post-login redirect to dashboard | Users land on monitor list immediately after login |

### D-08 to D-17: Session Management
| Decision | Implementation |
|----------|-----------------|
| **D-08** — 30-day session validity | Sessions persist for 30 days |
| **D-09** — Multiple independent sessions | Each device has own session |
| **D-10** — Per-device logout | Logout on phone doesn't affect laptop |
| **D-11** — No remote session revocation UI | Can't see/revoke other devices' sessions (Phase 1) |
| **D-12** — No concurrent session limit | Unlimited simultaneous sessions allowed |
| **D-13** — No IP-based validation | Simpler, less privacy-invasive |
| **D-14** — CORS disabled, SameSite=Strict | API keys are automation interface, not cross-origin requests |
| **D-15** — HTTPS in production, HTTP in dev | Secure in production, convenient locally |
| **D-16** — Logout clears session immediately | User sees login page after logout |
| **D-17** — No logout confirmation | Direct logout, no friction |

### D-18 to D-30: API Key Scope and Permissions
| Decision | Implementation |
|----------|-----------------|
| **D-18** — API keys scoped by groups/tags | Each key limited to specific monitor groups |
| **D-19** — Permission levels: read-only OR read-write | Two-level permission model (simple, covers use cases) |
| **D-20** — Configurable key expiration per key | Some keys short-lived, others persistent |
| **D-21** — Key rotation in-place | Regenerate key ID; system generates new secret |
| **D-22** — Display secret once after creation | Key secret shown once; user must copy immediately (standard practice) |
| **D-23** — Clean list view for API keys | Show: name, creation date, expiration date, last-used, scopes, permission |
| **D-24** — Single dialog/form for key creation | Not a multi-step wizard; fast creation |
| **D-25** — Per-key operations (no bulk operations) | Can regenerate or revoke individual keys |
| **D-26** — Revocation requires confirmation | Prevents accidental revocation of important keys |
| **D-27** — Toast notifications for success | Non-intrusive feedback for revoke/regenerate actions |
| **D-28** — API keys can be named/labeled | Users identify which service uses which key |
| **D-29** — Last-used timestamp tracked | Helps identify unused or suspicious keys |
| **D-30** — No full audit log of every API call | Phase 1 tracks last-used only |

---

## Technical Stack Applied

### Authentication & Sessions
```
┌─────────────────────┐
│   better-auth       │  Single-source-of-truth
│ (password + OIDC)   │  - User table
│                     │  - Session management
└────────┬────────────┘
         │
    ┌────▼─────────┐
    │  PostgreSQL  │  Persistent storage
    │  (user, etc) │
    └──────────────┘
         │
┌────────▼──────────────────┐
│  httpOnly secure cookies  │  XSS-safe transport
│  (HTTPS enforced)         │
└───────────────────────────┘
```

### API Key Management
```
┌──────────────────────┐
│   API Key Table      │  id, secret_hash, name
│   (PostgreSQL)       │  scopes, permission, expiration
│                      │  created_at, last_used_at
└──────────────────────┘
         │
┌────────▼────────────────────┐
│   API Key Scopes Table       │  junction table
│   (PostgreSQL)               │  maps keys → monitor groups
└──────────────────────────────┘
```

### Frontend Stack
```
┌──────────────────────┐
│   TanStack Start     │  Routing, SSR, page layout
│   (React 19)         │
├──────────────────────┤
│   shadcn/ui          │  UI components
│   + Tailwind CSS     │  (Form, Button, Dialog, Toast)
└──────────────────────┘
```

### Backend Stack
```
┌──────────────────────┐
│    ElysiaJS          │  HTTP API server
│   (auth endpoints)   │
├──────────────────────┤
│      zod             │  Runtime validation
├──────────────────────┤
│   drizzle-orm        │  Typed SQL queries
└──────────────────────┘
```

---

## Page Structure (Frontend Routes)

### Public Pages (No Auth Required)
```
/auth/login                 Login form (email/password or OIDC provider selector)
```

### Private Pages (Auth Required)
```
/dashboard                  Monitor list (empty until Phase 2)
/settings/api-keys         API key management (CRUD)
/settings/preferences      User preferences (optional Phase 1 or later)
```

### API Routes (Backend)
```
POST   /auth/signin                    Password login
GET    /auth/oidc/authorize            OIDC provider redirect
POST   /auth/oidc/callback             OIDC callback
POST   /auth/logout                    Logout
GET    /auth/session                   Get current session

POST   /api/keys                       Create API key
GET    /api/keys                       List API keys
GET    /api/keys/:id                   View key details (no secret)
POST   /api/keys/:id/regenerate        Rotate key secret
DELETE /api/keys/:id                   Revoke key

POST   /api/validate                   Validate API key (used by monitors API in Phase 2+)
```

---

## Data Model Preview

### Users Table (via better-auth)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sessions Table (via better-auth)
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Keys Table (Phase 1)
```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  permission ENUM('read', 'read_write') NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP
);
```

### API Key Scopes Table (Phase 1, references Phase 2 monitor groups)
```sql
CREATE TABLE api_key_scopes (
  api_key_id TEXT NOT NULL REFERENCES api_keys(id),
  scope TEXT NOT NULL,  -- monitor group/tag name
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (api_key_id, scope)
);
```

---

## User Flows

### 1. First-Time User: Password Setup
```
User visits app
  ↓
Redirected to /auth/login (no session)
  ↓
User enters email + password
  ↓
System creates user record, session
  ↓
Redirect to /dashboard (empty monitor list)
```

### 2. Returning User: Password Login
```
User visits /dashboard
  ↓
No session → redirect to /auth/login
  ↓
User enters email + password
  ↓
Session validated, session cookie set
  ↓
Redirect to /dashboard
```

### 3. OIDC Login (if configured)
```
User visits /auth/login
  ↓
Sees both password form AND "Login with [OIDC Provider]" button
  ↓
User clicks OIDC button
  ↓
Redirects to provider's authorization endpoint
  ↓
Provider redirects back to /auth/oidc/callback with code
  ↓
System exchanges code for token, creates/finds user, creates session
  ↓
Redirect to /dashboard
```

### 4. Create API Key
```
User navigates to /settings/api-keys
  ↓
Clicks "Create Key" button
  ↓
Dialog appears with form:
  - Name (required)
  - Scopes (select monitor groups; Phase 1 might allow "all" or Phase 2 will add specific groups)
  - Permission (read-only or read-write)
  - Expiration (optional date picker)
  ↓
User submits
  ↓
System generates key ID and secret hash, stores in database
  ↓
Dialog shows secret ONE TIME
  ↓
User must copy secret immediately
  ↓
Dialog closes, user sees key in list (without secret)
```

### 5. Revoke API Key
```
User navigates to /settings/api-keys
  ↓
Sees list of keys
  ↓
Clicks "Revoke" on a key
  ↓
Confirmation dialog appears ("Are you sure?")
  ↓
User confirms
  ↓
System marks key as revoked in database
  ↓
Toast notification: "Key revoked"
  ↓
Key disappears from list (or shows "revoked" status)
```

### 6. Logout
```
User clicks "Logout" in dashboard
  ↓
System sends POST /auth/logout
  ↓
Server clears session
  ↓
Browser clears session cookie
  ↓
Redirect to /auth/login
```

---

## Environment Configuration

### Required Environment Variables

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost/livenex` | Yes |
| `REDIS_URL` | Redis connection (used by Phase 2+) | `redis://localhost:6379` | For later phases |
| `OIDC_CLIENT_ID` | OIDC provider client ID | (from provider) | If OIDC enabled |
| `OIDC_CLIENT_SECRET` | OIDC provider client secret | (from provider) | If OIDC enabled |
| `OIDC_ISSUER_URL` | OIDC provider issuer URL | `https://accounts.google.com` | If OIDC enabled |
| `OIDC_REDIRECT_URI` | Where provider redirects back | `https://localhost:3000/auth/oidc/callback` | If OIDC enabled |
| `SESSION_SECRET` | Secret for signing session tokens | (random string, minimum 32 chars) | Yes |

### Local Development Setup
```bash
# .env.local (not committed)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/livenex_dev
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-secret-key-here-min-32-chars

# Optional: OIDC configuration
# OIDC_CLIENT_ID=...
# OIDC_CLIENT_SECRET=...
# OIDC_ISSUER_URL=...
# OIDC_REDIRECT_URI=http://localhost:3000/auth/oidc/callback
```

### Production Setup
```bash
# .env (or deployed as secrets)
DATABASE_URL=postgresql://user:pass@prod-db:5432/livenex
REDIS_URL=redis://prod-redis:6379
SESSION_SECRET=<long-random-secret>
NODE_ENV=production

# OIDC if enabled
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...
OIDC_ISSUER_URL=...
OIDC_REDIRECT_URI=https://yourdomain.com/auth/oidc/callback
```

---

## Integration Points with Later Phases

### Phase 2: Monitor Setup depends on
- ✓ User authentication (Phase 1)
- ✓ API key validation (Phase 1)
- ✓ Dashboard layout (Phase 1)

### Phase 3: State Evaluation depends on
- ✓ User authentication (Phase 1)
- ✓ API key validation (Phase 1)
- ✓ Monitor group/tags system (Phase 2)

### Phase 4: Incidents & Alerts depends on
- ✓ User authentication (Phase 1)
- ✓ API key validation (Phase 1)

### Phase 5: Public Status Pages depends on
- ✓ User authentication (Phase 1) — for private dashboard
- ✓ Private/public separation (Phase 1)
- ✓ Monitor groups/tags (Phase 2)

---

## Testing Strategy Preview

Phase 1 testing focuses on:

### Authentication Unit Tests
- [ ] Password hash verification
- [ ] Session token generation and validation
- [ ] OIDC flow (redirect, callback, token exchange)
- [ ] Session expiration logic

### API Key Unit Tests
- [ ] API key generation (ID + secret hash)
- [ ] API key validation (hash comparison)
- [ ] API key scoping (permissions)
- [ ] Last-used timestamp updates

### Integration Tests
- [ ] Full login flow (password)
- [ ] Full login flow (OIDC)
- [ ] Session lifecycle (create, validate, expire, logout)
- [ ] API key CRUD operations
- [ ] Private page access (with/without session)

### End-to-End Tests (if applicable)
- [ ] User signs up, logs in, creates API key, uses it
- [ ] Multiple devices with independent sessions
- [ ] API key revocation blocks subsequent API calls

---

## Known Unknowns and Gaps

### Technical Unknowns
1. **TanStack Start RC stability** — Is RC version production-ready? What breaking changes might come?
2. **better-auth OIDC integration** — How does `better-auth` handle generic OIDC providers via env vars?
3. **Database schema defaults** — What does `better-auth` create by default? Do we need additional tables?
4. **Session duration calculation** — Does 30 days mean absolute expiration or sliding window (extended by activity)?

### UX Unknowns
1. **OIDC provider selection UI** — How do users select which OIDC provider if multiple are configured?
2. **Error handling** — What does user see if OIDC provider is unreachable? If email already exists in password auth?
3. **API key name constraints** — Max length? Special characters allowed? Uniqueness required?

### Operational Unknowns
1. **Password requirements** — Minimum length? Special characters? Entropy validation?
2. **Session cookie security** — Exactly which cookie flags are set (HttpOnly, Secure, SameSite)?
3. **Rate limiting** — Are login attempts rate-limited to prevent brute force?

These will be resolved during planning and implementation.

---

## Success Indicators Checklist

Phase 1 is complete when all of these are true:

- [ ] User can sign up with email + password → account created
- [ ] User can sign in with email + password → dashboard loads
- [ ] User can sign in with OIDC (if configured) → dashboard loads
- [ ] Invalid credentials → error message, stay on login page
- [ ] Sessions persist for 30 days (or until manual logout)
- [ ] Multiple devices have independent sessions
- [ ] Logout on one device doesn't affect other devices
- [ ] User can create API key → secret shown once → user copies it
- [ ] User can list API keys → shows name, created, expires, last-used, scopes, permission
- [ ] User can regenerate API key → new secret provided, old secret invalidated
- [ ] User can revoke API key → confirmation required → API key stops working
- [ ] API key validates correctly in subsequent API calls (Phase 2 will test this more thoroughly)
- [ ] Unauthenticated visitor cannot access `/dashboard` → redirected to login
- [ ] Unauthenticated visitor cannot access `/settings/api-keys` → redirected to login
- [ ] Session cookie is httpOnly, Secure, SameSite=Strict (in production)
- [ ] HTTPS enforced in production, HTTP works in development
- [ ] CORS disabled (or limited to same-origin only)
- [ ] No monitor creation UI (defer to Phase 2)
- [ ] No monitoring/alert logic (defer to Phases 3+)
- [ ] No public status pages (defer to Phase 5)

---

## Planning Reference: Key Deliverables

### By End of Phase 1, You Should Have:

1. **Login Page**
   - Email + password form
   - Optional OIDC provider button
   - Error messages for invalid credentials
   - Link to settings (Phase 1 minimal)

2. **Dashboard Home Page**
   - Displays "No monitors yet" (Phase 2 will add monitors)
   - User menu (Settings, Logout)
   - Link to API Keys

3. **API Keys Management Page**
   - List view with pagination or scroll (starting small)
   - Create key dialog/form
   - Regenerate button per key (with confirmation)
   - Revoke button per key (with confirmation)
   - Toast notifications for success/error

4. **Session Management System**
   - httpOnly cookies for token storage
   - PostgreSQL session table (via better-auth)
   - Logout endpoint that clears session
   - Session validation middleware for private pages

5. **API Key Management System**
   - PostgreSQL api_keys table
   - API key generation (ID + secret hash)
   - API key validation middleware (used by Phase 2+ endpoints)
   - Last-used timestamp tracking

6. **Database Migrations**
   - Initial schema (users, sessions, api_keys, api_key_scopes via drizzle-kit)
   - Indexes for performance (user lookup, session lookup, key lookup)

7. **Authentication Routes (Backend)**
   - POST /auth/signin (password)
   - POST /auth/logout
   - GET /auth/oidc/authorize (if OIDC enabled)
   - POST /auth/oidc/callback (if OIDC enabled)
   - GET /auth/session

8. **API Key Routes (Backend)**
   - POST /api/keys (create)
   - GET /api/keys (list)
   - GET /api/keys/:id (view)
   - POST /api/keys/:id/regenerate
   - DELETE /api/keys/:id (revoke)
   - POST /api/validate (for later phases)

9. **Documentation**
   - Authentication flow (password + OIDC)
   - API key creation and usage guide
   - Environment configuration reference
   - Database schema documentation

---

## Phase 1 Complete When:

✅ All requirements satisfied (AUTH-01, AUTH-02, STAT-01)  
✅ All 30 decisions implemented correctly  
✅ All routes tested (manual and automated)  
✅ Session management working across devices  
✅ API keys scoped and permissioned correctly  
✅ Unauthenticated users cannot access private data  
✅ Documentation updated  
✅ Ready for Phase 2 (which will add monitor creation)

---

**Generated:** 2026-03-27  
**Status:** Ready for Planning  
**Next Action:** Run `/gsd-plan-phase 01` to generate executable task plans
