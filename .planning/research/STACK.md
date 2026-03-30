# Technology Stack — Uptime Monitoring Add-On

**Project:** Livenex
**Dimension:** Uptime monitoring libraries on top of existing scaffold
**Researched:** 2026-03-30
**Overall confidence:** HIGH (core libraries verified via official GitHub repos and production reference in Uptime Kuma v2.2.1)

---

## Context: What's Already in the Scaffold

The existing scaffold provides everything for the web layer. These are NOT in scope for this research:

| Already Present | Purpose |
|----------------|---------|
| TanStack Start + React 19 | SSR frontend |
| Elysia 1.4.x | Backend API |
| Drizzle ORM + PostgreSQL | Database |
| Better Auth | Authentication |
| Tailwind v4 + shadcn | UI |
| Zod + @t3-oss/env-core | Validation & env |

The research below covers **only the monitoring-specific additions**.

---

## Recommended Stack (Monitoring Layer)

### 1. Scheduler / Worker

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `croner` | ^10.0.1 | Per-monitor interval scheduling | Zero dependencies, explicit Bun 1.0+ support, overrun protection built-in, pause/resume controls, 2M+ weekly downloads, used by Uptime Kuma v2. Do NOT use `node-cron` (133 open issues, no overrun protection) or `@elysiajs/cron` (27 stars, thin wrapper with lagging Elysia version support) |

**Integration pattern** — croner runs directly inside the Elysia server startup lifecycle:

```typescript
// src/monitoring/scheduler.ts
import { Cron } from "croner";

export function startMonitor(id: string, intervalSeconds: number, checkFn: () => Promise<void>) {
  return new Cron(`*/${intervalSeconds} * * * * *`, { protect: true }, checkFn);
}
```

`protect: true` enables overrun protection — if a check takes longer than the interval (e.g., slow network), the next run is skipped rather than stacking. Critical for home lab use.

**Why not `@elysiajs/cron`:** Only 27 GitHub stars, 9 open issues, last release Sep 2025, and it's just a thin wrapper around croner anyway. Use croner directly for full control and no dependency indirection.

---

### 2. HTTP Check (Endpoint Monitoring)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Bun native `fetch` | built-in | HTTP/HTTPS endpoint checks | Bun ships a fully compliant `fetch` with `AbortSignal` for timeouts. No library needed. Faster than node-fetch or axios. |

**Implementation pattern:**

```typescript
// src/monitoring/checks/http.ts
export async function checkHttp(url: string, timeoutMs = 30_000): Promise<{
  up: boolean;
  statusCode: number | null;
  responseTimeMs: number;
  error: string | null;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });
    return {
      up: res.status >= 200 && res.status < 400,
      statusCode: res.status,
      responseTimeMs: Math.round(performance.now() - start),
      error: null,
    };
  } catch (err) {
    return {
      up: false,
      statusCode: null,
      responseTimeMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : "Unknown error",
    };
  } finally {
    clearTimeout(timer);
  }
}
```

**Why not axios:** Extra dependency, no benefit over native fetch in Bun. Uptime Kuma uses axios for historical reasons (pre-fetch era). Do not add it.

---

### 3. ICMP Ping (Host Monitoring)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `@louislam/ping` | ^0.4.4-mod.1 | ICMP ping for host monitors | Shell-invoked ping (wraps system `ping` binary) — works on Linux/macOS/Windows without raw socket permissions. Bun supports `node:child_process` fully. This is the exact library used by Uptime Kuma. |

**Important caveat:** ICMP via raw sockets in JavaScript/Bun requires root/CAP_NET_RAW or using the system `ping` binary. `@louislam/ping` uses the system binary (shell exec), which works in a Docker container where root is the default user.

```typescript
// src/monitoring/checks/ping.ts
import ping from "@louislam/ping";

export async function checkPing(host: string): Promise<{
  up: boolean;
  responseTimeMs: number | null;
  error: string | null;
}> {
  try {
    const res = await ping.promise.probe(host, {
      timeout: 10,
      extra: ["-c", "1"],
    });
    return {
      up: res.alive,
      responseTimeMs: res.alive ? parseFloat(res.time as string) : null,
      error: res.alive ? null : "Host unreachable",
    };
  } catch (err) {
    return {
      up: false,
      responseTimeMs: null,
      error: err instanceof Error ? err.message : "Ping failed",
    };
  }
}
```

**Docker note:** Ensure the `ping` binary is available in your Docker image. Use `debian:bookworm-slim` with `iputils-ping` installed, not `alpine` (Alpine's `ping` has a different flag syntax). Alternatively, `tcp-ping` (also in Uptime Kuma) can check TCP port reachability without ICMP at all — good fallback.

**Why not `net-ping` (npm):** Uses raw ICMP sockets, requires `CAP_NET_RAW`, fails silently in containers without that capability.

---

### 4. Notifications

#### 4a. Discord & Slack Webhooks

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Bun native `fetch` | built-in | POST to Discord/Slack webhook URLs | No library needed. Discord incoming webhooks are a single POST to a URL. The Discord API uses a simple JSON payload. Slack uses the same pattern. |

```typescript
// src/monitoring/notifications/discord.ts
export async function sendDiscordAlert(webhookUrl: string, message: {
  monitorName: string;
  status: "UP" | "DOWN";
  url: string;
  responseTimeMs?: number;
}) {
  const color = message.status === "UP" ? 0x00ff00 : 0xff0000;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: `🔔 ${message.monitorName} is ${message.status}`,
        color,
        fields: [
          { name: "URL", value: message.url, inline: true },
          ...(message.responseTimeMs !== undefined
            ? [{ name: "Response Time", value: `${message.responseTimeMs}ms`, inline: true }]
            : []),
        ],
        timestamp: new Date().toISOString(),
      }],
    }),
  });
}
```

**Why no discord.js / discord-webhook-ts:** discord.js is a 900+ KB bot framework, comically overkill for posting a webhook. A raw `fetch` POST is 15 lines.

#### 4b. Email (SMTP)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `nodemailer` | ^8.0.4 | SMTP email alerts | The undisputed standard for Node.js email (17.5k stars). v8.x supports Bun. Zero alternatives with equivalent maturity. Used by Uptime Kuma. Types via `@types/nodemailer`. |

```typescript
// src/monitoring/notifications/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmailAlert(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}
```

**Note:** `nodemailer` v8.x is JavaScript-only (no official TS types in the package). Add `@types/nodemailer` as a dev dependency. Bun's `node:net` and `node:tls` are fully implemented, so SMTP connections work correctly.

---

### 5. Charting (Response Time Graphs)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn `chart` component | (copy-paste, built-in) | Response time line charts | The project already uses shadcn. The shadcn `chart` component is a thin wrapper over **Recharts v3** that integrates with Tailwind CSS variables for theming. No additional install — just `bunx shadcn add chart`. It inherits the project's dark mode, CSS variables, and design tokens automatically. |

The shadcn chart component (confirmed on shadcn.com docs, March 2026) uses Recharts v3 under the hood. It's a copy-paste component, not a dependency lock-in. The project already has shadcn configured, so adding the chart component is a one-command operation.

**Recharts itself** (`recharts` + `react-is`) will be added as a dependency when you run `bunx shadcn add chart`.

```typescript
// Example: Response time chart for a monitor
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "#/components/ui/chart";

const chartConfig = {
  responseTime: { label: "Response Time (ms)", color: "var(--chart-1)" },
};

export function ResponseTimeChart({ data }: { data: { timestamp: string; responseTime: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis unit="ms" />
        <Tooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="responseTime" stroke="var(--chart-1)" dot={false} />
      </LineChart>
    </ChartContainer>
  );
}
```

**Why not Tremor:** Tremor v4 changed to a paid model for production use. The free tier is limited. With shadcn+Recharts already available in the stack, Tremor adds zero value and potential licensing headache.

**Why not Chart.js / vue-chartjs:** React-incompatible pattern (Uptime Kuma uses Vue+Chart.js, which is irrelevant here). Recharts is the standard React charting library (26.9k stars, 822k dependents, active releases as of March 2026).

**Why not Victory / Nivo:** Heavier bundles, more complex APIs. Recharts + shadcn wrapper is the cleanest solution for a project already using shadcn.

---

### 6. Time-Series Data Storage (PostgreSQL / Drizzle Patterns)

No additional library needed. PostgreSQL is well-suited for the scale (20-100 monitors, sub-second check intervals at home lab scale).

#### Schema Pattern

```typescript
// src/db/schema.ts — additions for monitoring

export const monitors = pgTable("monitors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 16 }).notNull(), // "http" | "ping"
  url: varchar("url", { length: 2048 }), // null for ping monitors
  host: varchar("host", { length: 255 }), // null for http monitors
  intervalSeconds: integer("interval_seconds").notNull().default(60),
  timeoutMs: integer("timeout_ms").notNull().default(30000),
  expectedStatusMin: integer("expected_status_min").default(200),
  expectedStatusMax: integer("expected_status_max").default(399),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checkResults = pgTable("check_results", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  monitorId: uuid("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  up: boolean("up").notNull(),
  responseTimeMs: integer("response_time_ms"),
  statusCode: integer("status_code"),
  error: text("error"),
}, (table) => ({
  // Index for time-range queries per monitor (the hot query path)
  monitorTimestampIdx: index("idx_check_results_monitor_timestamp")
    .on(table.monitorId, table.timestamp),
}));

export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  monitorId: uuid("monitor_id").notNull().references(() => monitors.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  causeMessage: text("cause_message"),
});
```

#### Key Query Patterns

**Uptime percentage** (7d / 30d / 90d):
```typescript
// Count up checks / total checks in window — runs fast with the composite index
const uptimeStats = await db
  .select({
    total: count(),
    up: count(sql`CASE WHEN up = true THEN 1 END`),
  })
  .from(checkResults)
  .where(and(
    eq(checkResults.monitorId, monitorId),
    gte(checkResults.timestamp, sql`NOW() - INTERVAL '7 days'`),
  ));
```

**Response time graph data** (downsampled for charting):
```typescript
// Use date_trunc for time-bucketing to avoid sending 10k points to the browser
const graphData = await db.execute(sql`
  SELECT
    date_trunc('hour', timestamp) AS bucket,
    ROUND(AVG(response_time_ms)) AS avg_response_time,
    MIN(response_time_ms) AS min_response_time,
    MAX(response_time_ms) AS max_response_time
  FROM check_results
  WHERE monitor_id = ${monitorId}
    AND timestamp >= NOW() - INTERVAL '24 hours'
    AND up = true
  GROUP BY bucket
  ORDER BY bucket ASC
`);
```

#### Retention Strategy

At 100 monitors × 30s interval = ~200 checks/minute = ~288,000 rows/day. PostgreSQL handles this easily. No time-series extension (TimescaleDB) needed at this scale.

Implement a periodic cleanup job with croner:
```typescript
// Keep last 90 days of raw data, let incidents live indefinitely
new Cron("0 3 * * *", async () => {
  await db.delete(checkResults)
    .where(lt(checkResults.timestamp, sql`NOW() - INTERVAL '90 days'`));
});
```

**Why not TimescaleDB:** Adds Docker complexity (different image, different extension setup), unnecessary at 100-monitor home lab scale. A composite index on `(monitor_id, timestamp)` is sufficient.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Scheduler | `croner` | `node-cron` | 133 open issues, no overrun protection, no Bun-explicit support |
| Scheduler | `croner` | `@elysiajs/cron` | 27 stars, thin wrapper, adds no value |
| HTTP checks | Bun `fetch` | `axios` | Extra dependency with no benefit over native fetch |
| Ping | `@louislam/ping` | `net-ping` | Requires raw socket / CAP_NET_RAW, fails in Docker |
| Ping | `@louislam/ping` | `tcp-ping` | TCP-only, not true ICMP — but useful as fallback |
| Email | `nodemailer` | `emailjs` | 10x fewer downloads, less tested |
| Charting | shadcn chart (Recharts) | Tremor | Paid for production in v4, less relevant with shadcn already present |
| Charting | shadcn chart (Recharts) | Chart.js | Vue-centric ecosystem, imperative API vs React declarative |
| Charting | shadcn chart (Recharts) | Nivo | Heavier bundle, more complex, no shadcn integration |
| Time-series DB | PostgreSQL + index | TimescaleDB | Docker complexity not justified at 100-monitor scale |

---

## Installation

```bash
# Monitoring scheduler
bun add croner

# ICMP ping for host monitors
bun add @louislam/ping

# Email alerts
bun add nodemailer

# Types (dev)
bun add -D @types/nodemailer

# Charts — adds recharts as a dependency automatically
bunx shadcn add chart
```

**Total new production dependencies: 3**
- `croner` (~23KB minified, zero dependencies)
- `@louislam/ping` (shell wrapper, tiny)
- `nodemailer` (SMTP mailer, battle-tested)

Discord/Slack alerts and HTTP checks require no new dependencies — they use Bun's native `fetch`.

---

## Integration Points with Existing Stack

| Concern | Solution |
|---------|---------|
| Scheduler startup | Initialize croner jobs in the Elysia `onStart` lifecycle hook in `src/index.ts` |
| DB access from scheduler | Import `src/db/index.ts` directly — same Drizzle instance |
| Environment variables | Add `SMTP_*`, `DISCORD_WEBHOOK_URL`, etc. to `src/env.ts` via `@t3-oss/env-core` (already in stack) |
| Monitor state in memory | Maintain a `Map<monitorId, Cron>` in a singleton module to allow pause/resume from the admin API |
| Error reporting in scheduler | Wrap check functions in try/catch, log to console (upgrade to structured logger later if needed) |
| Public status page data | Serve via Elysia route at `/api/status` — no auth, read-only query on `monitors` + recent `check_results` |

---

## Sources

| Source | Confidence | What It Confirmed |
|--------|------------|-------------------|
| [github.com/Hexagon/croner](https://github.com/Hexagon/croner) | HIGH | Bun 1.0+ explicit support, v10.0.1 latest (Feb 2026), overrun protection API |
| [github.com/elysiajs/elysia-cron](https://github.com/elysiajs/elysia-cron) | HIGH | 27 stars, thin croner wrapper, last release Sep 2025 — ruled out |
| [github.com/louislam/uptime-kuma package.json](https://raw.githubusercontent.com/louislam/uptime-kuma/master/package.json) v2.2.1 (Mar 2026) | HIGH | Production reference: uses croner ~8.x, @louislam/ping ~0.4.4, nodemailer ~7.x, chart.js+vue-chartjs |
| [github.com/recharts/recharts](https://github.com/recharts/recharts) | HIGH | v3.8.1 latest (Mar 2026), 26.9k stars, 822k dependents |
| [ui.shadcn.com/docs/components/chart](https://ui.shadcn.com/docs/components/chart) | HIGH | Confirmed: shadcn chart uses Recharts v3, copy-paste component, integrates with Tailwind CSS vars |
| [github.com/nodemailer/nodemailer](https://github.com/nodemailer/nodemailer) | HIGH | v8.0.4 latest (Mar 2026), 17.5k stars, MIT No Attribution license |
| [bun.sh/docs/runtime/nodejs-compat](https://bun.sh/docs/runtime/nodejs-compat) | HIGH | Confirmed: node:child_process (used by @louislam/ping), node:net, node:tls fully implemented in Bun |
| [discord.com/developers/docs/resources/webhook](https://discord.com/developers/docs/resources/webhook) | HIGH | Confirmed: incoming webhook is a single POST, no library required |
| Training data re: Tremor licensing | LOW | Verify Tremor v4 pricing independently before citing |

---

*Research completed: 2026-03-30*
