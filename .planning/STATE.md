# livenex - Project State & Memory

## Current Session Context

**Date**: Mar 30, 2026  
**Workflow**: `/gsd-new-project` initialization for existing codebase  
**Mode**: Interactive with research phase

## Project Questions Answered

### Vision & Scope
- **Project Type**: Personal/Internal Tool
- **Target Users**: Solo user (home lab operator)
- **Primary Focus (3 months)**: Build core MVP features
- **Problem Domain**: Self-hosted uptime monitoring for home lab services
- **Research Phase**: Enabled - to research uptime monitoring best practices

### MVP Clarity
- **MVP Definition**: TBD - GSD will research and propose
- **Timeline**: 2 weeks (aggressive)
- **Scale**: 10-50 services for MVP, extensible to 100+

## Workflow Progress

- [x] Questions & Vision gathering
- [x] PROJECT.md created
- [ ] Domain research (uptime monitoring patterns, tools, best practices)
- [ ] REQUIREMENTS.md creation (driven by research findings)
- [ ] ROADMAP.md creation (phased MVP structure)
- [ ] Initial phase planning

## Key Decisions Recorded

1. **Self-hosted requirement**: Data and monitoring logic must be on-premise
2. **2-week MVP**: Aggressive timeline implies core features only
3. **Solo user**: UX should be simple; no multi-user complexity initially
4. **Tech stack fixed**: React + TanStack Start + PostgreSQL + Drizzle (already chosen)

## Research Findings (Pending)

*To be populated after domain research phase*

- Uptime monitoring patterns and tools in the ecosystem
- Common health check implementations (HTTP, TCP, ICMP)
- Alert delivery mechanisms (email, webhooks, webhooks)
- Dashboard best practices for status visualization
- State machine patterns for service status transitions

## Known Technical Decisions

- **Frontend**: React 19, TanStack Router (SSR capable)
- **Backend**: TanStack Start with Elysia integration
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth (to be configured)
- **Styling**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest
- **Code Quality**: Biome

## Constraints & Risks

- **2-week timeline** is aggressive; scope must be ruthlessly prioritized
- **Authentication setup** not yet complete; may impact timeline
- **Home lab scale** (10-50 services) is modest but may have surprising complexity in state management

## Next Actions

1. Execute domain research on uptime monitoring patterns
2. Synthesize research into MVP requirements
3. Create REQUIREMENTS.md with user workflows and feature list
4. Create ROADMAP.md breaking MVP into 3-4 delivery phases
5. Prepare to start Phase 1 implementation
