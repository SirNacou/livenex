# Quick Task: Fix Docker Configuration for Unified Architecture

**Date:** 2026-03-27  
**Task ID:** 260327-docker-unified  
**Status:** COMPLETED  
**Priority:** High

## Context

Phase 01.2 (TanStack Start + ElysiaJS Integration) consolidated the separate frontend and backend packages into a single unified application. The Docker configuration was still referencing the old monorepo structure with:
- Separate `Dockerfile.frontend` and `Dockerfile.backend`
- Separate `frontend` and `backend` services in docker-compose
- Caddy reverse proxy to coordinate two services
- References to `packages/frontend` and `packages/backend`
- Workspace commands (`--workspace=@livenex/frontend`, etc.)

This quick task updates the Docker setup to reflect the new unified architecture.

## Changes Made

### 1. Created Unified Dockerfile (`docker/Dockerfile`)
- Single multi-stage Dockerfile for the entire application
- Builder stage: Install dependencies and build with Vite
- Runtime stage: Lightweight image with only production dependencies
- Exposes port 3000 (single port, no Caddy needed)
- Uses `bun dist/server/index.js` for production start
- Supports both development (via docker-compose volume mounts) and production modes

**Key improvements:**
- Single build process (no more frontend/backend separation)
- Smaller final image (only production dependencies)
- Cleaner layering and caching strategy

### 2. Updated docker-compose.yml
- Removed separate `frontend` and `backend` services
- Removed `caddy` reverse proxy service (not needed with unified app)
- Created single `app` service with:
  - Unified Dockerfile reference
  - Single port 3000 (no 3000 and 3001)
  - Volume mount for `./src` (unified source)
  - `bun run dev` for development
- Kept PostgreSQL and Redis services unchanged
- Kept health checks and environment configuration

**Simplified service layout:**
```
Before:  caddy → frontend (3000) + backend (3001)
After:   app (3000) — single unified service
```

### 3. Cleanup
- Old `Dockerfile.backend` still exists (can be deleted later)
- Old `Dockerfile.frontend` still exists (can be deleted later)
- Old `docker/Caddyfile` still exists (no longer used)
- These can be archived or removed in a separate cleanup task

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `docker/Dockerfile` | Created (new unified Dockerfile) | 35 |
| `docker-compose.yml` | Rewritten (unified services) | 91 (was 108) |

## Verification

✅ **Docker Syntax:** Valid (no syntax errors)  
✅ **docker-compose Syntax:** Valid YAML  
✅ **Service Dependencies:** Correct (app depends on postgres, redis)  
✅ **Volume Mounts:** Updated to `./src` (unified source)  
✅ **Environment Variables:** All required vars present  
✅ **Ports:** Single port 3000 (instead of 3000 + 3001 + 80 + 443)  
✅ **Entry Point:** Uses `bun` runtime with unified app  

## How to Use

### Development (with live reload):
```bash
docker-compose up
# App available at http://localhost:3000
# Database at localhost:5432
# Redis at localhost:6379
```

### Production:
```bash
docker build -f docker/Dockerfile -t livenex:latest .
docker run -e DATABASE_URL=... -e REDIS_URL=... -p 3000:3000 livenex:latest
# Single service, single image, single port
```

## Architecture Benefits

1. **Simpler Development:** One dev server instead of coordinating two
2. **Cleaner Docker:** One image instead of two, no proxy needed
3. **Type Safety:** Direct ElysiaJS calls during SSR (no HTTP round-trip)
4. **Consistency:** Same setup locally and in containers
5. **Deployment:** Single Docker image, single service definition

## Next Steps (Optional Cleanup)

Future quick task could remove old files:
- `docker/Dockerfile.backend` (archived)
- `docker/Dockerfile.frontend` (archived)
- `docker/Caddyfile` (not used)

These are not critical but could be cleaned up to reduce confusion.

## Time Spent

Approximately 10 minutes

---

**Completed:** 2026-03-27
