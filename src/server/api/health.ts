// Health check routes
import Elysia from "elysia";

export const healthRouter = new Elysia({ prefix: "/health" })
  .get("/", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .get("/db", async () => {
    // Database health check will be implemented in Phase 1
    return {
      database: "ok",
      timestamp: new Date().toISOString(),
    };
  });
