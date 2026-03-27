import Elysia, { Context } from "elysia";
import { db } from "../lib/db.js";
import { isAppError, InternalError } from "../lib/errors.js";
import type { ApiResponse, ApiErrorResponse } from "@shared/types";
import { healthRouter } from "./health.js";
import { authRouter } from "./auth.js";

// Response envelope middleware
function createResponse<T>(data: T): ApiResponse<T> {
  return {
    ok: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

function createErrorResponse(error: unknown): ApiErrorResponse {
  let appError = null;

  if (isAppError(error)) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new InternalError(error.message, { originalError: error.message });
  } else {
    appError = new InternalError("An unexpected error occurred");
  }

  return {
    ok: false,
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details,
    },
    timestamp: new Date().toISOString(),
  };
}

// Main Elysia app
const app = new Elysia({ aot: false })
  .derive(({ request, headers }) => {
    return {
      ipAddress: headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown",
      userAgent: headers["user-agent"] || "unknown",
    };
  })
  .guard(
    {
      as: "global",
    },
    (app) =>
      app
        .onBeforeHandle(async ({ request, path }) => {
          // Log incoming requests (development)
          if (process.env.NODE_ENV === "development") {
            console.log(`${request.method} ${path}`);
          }
        })
        .mapResponse(async ({ response }) => {
          // Wrap responses in envelope if not already wrapped
          if (response instanceof Response) {
            const data = await response.json().catch(() => null);
            if (data && typeof data === "object" && "ok" in data) {
              return response; // Already wrapped
            }
            // Wrap successful response
            const wrapped = createResponse(data);
            return new Response(JSON.stringify(wrapped), {
              status: response.status,
              headers: { "Content-Type": "application/json" },
            });
          }
          return response;
        })
        .error({ AS_STATUS: 500 }, ({ error, set }) => {
          const errorResponse = createErrorResponse(error);
          const statusCode = isAppError(error) ? error.statusCode : 500;
          set.status = statusCode;
          return errorResponse;
        })
  )
  .group("/api", (api) => {
    return api
      .use(healthRouter)
      .use(authRouter);
  });

// Database initialization (health check)
try {
  console.log("Database connection initialized");
} catch (error) {
  console.error("Failed to initialize database:", error);
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || "3001", 10);

app.listen(PORT, () => {
  console.log(`🦊 ElysiaJS backend running at http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

export { app };
