// Authentication routes
import Elysia from "elysia";

export const authRouter = new Elysia({ prefix: "/auth" })
  .post("/login", async () => {
    // Login will be implemented in Phase 1
    return { message: "Login not yet implemented" };
  })
  .post("/logout", async () => {
    // Logout will be implemented in Phase 1
    return { message: "Logout not yet implemented" };
  })
  .get("/me", async () => {
    // Get current user will be implemented in Phase 1
    return { message: "Get user not yet implemented" };
  });
