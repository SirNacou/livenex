// Backend API code - ElysiaJS app definition
// In TanStack Start, this is called directly from server functions
import Elysia from "elysia";
import { healthRouter } from "./health";
import { authRouter } from "./auth";

// Main Elysia app - simple setup for TanStack Start integration
export const app = new Elysia({ aot: false })
  .derive(({ request, headers }) => {
    return {
      ipAddress: (headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown") as string,
      userAgent: (headers["user-agent"] || "unknown") as string,
    };
  })
  .onBeforeHandle(async ({ request, path }) => {
    // Log incoming requests (development)
    if (process.env.NODE_ENV === "development") {
      console.log(`${request.method} ${path}`);
    }
  })
  .onError(({ error, set }) => {
    const message = error instanceof Error ? error.message : "Internal server error";
    set.status = 500;
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
      timestamp: new Date().toISOString(),
    };
  })
  .use(healthRouter)
  .use(authRouter);

// TanStack Start handles the server lifecycle and mounting
console.log('✓ ElysiaJS app initialized for TanStack Start');
