import { db } from "~/lib/db";
import { users } from "./schema";

/**
 * Database seed script
 * Run: bun run db:seed (when implemented)
 */
export async function seed() {
  console.log("Seeding database...");

  try {
    // Create test user if needed
    const existingUser = await db.select().from(users).limit(1);

    if (existingUser.length === 0) {
      console.log("No users found, ready for initial setup.");
    }

    console.log("Database seeding complete.");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (import.meta.main) {
  seed();
}
