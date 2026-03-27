import { eq } from "drizzle-orm";
import { db } from "#/db";
import { users } from "#/db/schema";

/**
 * Create a test user in the database
 * Used to set up test data for API key tests
 */
export async function createTestUser(email?: string): Promise<string> {
	const testEmail = email || `test-user-${Date.now()}@example.com`;
	const [user] = await db
		.insert(users)
		.values({
			email: testEmail,
			emailVerified: true,
			name: "Test User",
		})
		.returning({ id: users.id });

	return user.id;
}

/**
 * Clean up a test user and all related data
 * This cascades to sessions and API keys
 */
export async function deleteTestUser(userId: string): Promise<void> {
	// Cascade delete is handled by foreign key constraints
	// Just delete the user and all related data will be cleaned up
	await db.delete(users).where(eq(users.id, userId));
}
