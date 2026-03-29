# Quick Task: Migrate from npm to bun

**Date:** 2026-03-27  
**Task ID:** 260327-npm-to-bun  
**Status:** COMPLETED  
**Priority:** High

## Context

The project already has bun configured (`bun.lock`, `node_modules`, all scripts use `bun`), but user-facing documentation still references `npm` commands. This quick task updates all documentation to be consistent with the bun-first approach.

## Changes Made

### 1. README.md
- Changed `npm install` → `bun install`
- Changed `npm run dev` → `bun run dev`
- Changed `npm run build` → `bun run build`
- Changed `npm run test` → `bun test`
- Changed `npm install @tailwindcss/vite tailwindcss -D` → `bun remove @tailwindcss/vite tailwindcss`

### 2. ARCHITECTURE.md
- Changed `npm run db:migrate` → `bun run db:migrate` (line 127)

### 3. Package.json Verification
- All package.json files already use `bun` commands:
  - `packages/backend/package.json` ✓
  - `packages/frontend/package.json` ✓
  - `packages/shared/package.json` ✓

## Files Modified
- `README.md` (4 edits)
- `ARCHITECTURE.md` (1 edit)

## Verification
- ✓ All npm references in public documentation updated
- ✓ All scripts already use bun
- ✓ Project is consistent bun-first

## Time Spent
Approximately 15 minutes

---

**Completed:** 2026-03-27
