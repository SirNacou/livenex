// Authentication routes - using better-auth
import Elysia from "elysia";
import { auth } from "~/server/auth";

export const authRouter = new Elysia({ prefix: "/auth" })
  .post("/login", async () => {
    // Login will be implemented in Phase 1
    return { 
      ok: true,
      data: null,
      message: "Login not yet implemented"
    };
  })
  .post("/logout", async () => {
    // Logout will be implemented in Phase 1
    return { 
      ok: true,
      data: null,
      message: "Logout not yet implemented"
    };
  })
  .get("/me", async () => {
    // Get current user will be implemented in Phase 1
    return { 
      ok: true,
      data: null,
      message: "Get user not yet implemented"
    };
  })
  .get("/session", async () => {
    // Get current session will be implemented in Phase 1
    return { 
      ok: true,
      data: null,
      message: "Get session not yet implemented"
    };
  });
