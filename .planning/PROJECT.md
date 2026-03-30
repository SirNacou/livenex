# livenex - Project Context

## Executive Summary

**livenex** is a self-hosted uptime monitoring tool for home lab environments. It monitors the health of personal applications and services, providing real-time status visibility and alerting when monitored services go down.

**Type**: Personal/Internal Tool  
**Target Users**: Solo user (home lab operator)  
**Status**: In Development (MVP Phase)  
**Timeline**: 2-week aggressive MVP launch

## Problem Statement

Home lab operators need a lightweight, self-hosted solution to monitor the availability of multiple services and applications across their infrastructure. Manual checking is impractical; existing monitoring solutions are often overkill for small-scale home environments.

## Vision

livenex provides:
- **Simple monitoring**: HTTP/TCP-based health checks for arbitrary services
- **Visual status dashboard**: Quick at-a-glance health of all monitored services
- **Smart alerting**: Notifications when services transition to down/up states
- **Self-hosted**: Full control over data and zero external dependencies

## Tech Stack

- **Frontend**: React 19 with TanStack Router (SSR-capable)
- **Backend**: TanStack Start / Elysia server
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth (setup in progress)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Testing**: Vitest
- **Code Quality**: Biome (lint/format)

## Key Constraints

1. **2-week MVP timeline** - Must deliver core features within 2 weeks
2. **Solo operator** - All features should be intuitive for single user
3. **Self-hosted** - No external SaaS dependencies for core monitoring
4. **Home lab scale** - Handle 10-50 services initially, performant up to 100+

## Success Criteria (MVP)

- [ ] Dashboard displays health status of 10+ services
- [ ] Monitoring engine checks services at configurable intervals
- [ ] Alerts fire when service status changes (down → up, up → down)
- [ ] User can add/remove services from UI
- [ ] Service edit history/audit trail available
- [ ] Deployable as single Docker container or standalone binary

## Domain: Uptime Monitoring

Related technologies and patterns:
- HTTP/TCP health check implementations
- Service status state machines
- Alert routing and notification delivery
- Monitoring dashboards and visualization
- Data retention and historical trending

## Next Steps

1. Research uptime monitoring domain best practices
2. Define MVP feature scope and user workflows
3. Create detailed requirements document
4. Break MVP into delivery phases (Phases 1-4)
5. Begin Phase 1: Foundation & Dashboard
