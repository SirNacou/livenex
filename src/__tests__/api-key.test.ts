import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "#/db";
import { apiKeyScopes, apiKeys } from "#/db/schema";
import {
	calculateDefaultExpiration,
	generateApiKeySecret,
	hashApiKeySecret,
	isKeyExpired,
	isValidKeyName,
	isValidPermission,
	verifyApiKeySecret,
} from "#/lib/api-key";
import { AuthenticationError } from "#/lib/errors";
import {
	createApiKey,
	getApiKey,
	listUserApiKeys,
	regenerateApiKey,
	revokeApiKey,
} from "#/lib/handlers/api-keys";
import {
	checkApiKeyPermission,
	extractApiKeyFromHeader,
	requireApiKey,
	validateApiKey,
} from "#/lib/middleware/api-key";
import { createTestUser } from "./helpers";

// Test data
let testUserId: string;

beforeAll(async () => {
	testUserId = await createTestUser();
});

describe("API Key Utilities", () => {
	describe("generateApiKeySecret", () => {
		it("generates a 40-character secret", () => {
			const secret = generateApiKeySecret();
			expect(secret).toHaveLength(40);
			expect(secret).toMatch(/^[A-Za-z0-9_-]+$/); // Base64url format
		});

		it("generates different secrets each time", () => {
			const secret1 = generateApiKeySecret();
			const secret2 = generateApiKeySecret();
			expect(secret1).not.toBe(secret2);
		});
	});

	describe("hashApiKeySecret", () => {
		it("hashes a secret consistently", () => {
			const secret = generateApiKeySecret();
			const hash1 = hashApiKeySecret(secret);
			const hash2 = hashApiKeySecret(secret);
			expect(hash1).toBe(hash2);
		});

		it("produces a 64-character hex hash (SHA-256)", () => {
			const secret = generateApiKeySecret();
			const hash = hashApiKeySecret(secret);
			expect(hash).toHaveLength(64);
			expect(hash).toMatch(/^[a-f0-9]+$/);
		});
	});

	describe("verifyApiKeySecret", () => {
		it("returns true for correct secret and hash", () => {
			const secret = generateApiKeySecret();
			const hash = hashApiKeySecret(secret);
			expect(verifyApiKeySecret(secret, hash)).toBe(true);
		});

		it("returns false for incorrect secret", () => {
			const secret = generateApiKeySecret();
			const hash = hashApiKeySecret(secret);
			const wrongSecret = generateApiKeySecret();
			expect(verifyApiKeySecret(wrongSecret, hash)).toBe(false);
		});
	});

	describe("isKeyExpired", () => {
		it("returns false for null expiresAt (never expires)", () => {
			expect(isKeyExpired(null)).toBe(false);
		});

		it("returns false for future expiration date", () => {
			const future = new Date();
			future.setDate(future.getDate() + 30);
			expect(isKeyExpired(future)).toBe(false);
		});

		it("returns true for past expiration date", () => {
			const past = new Date();
			past.setDate(past.getDate() - 1);
			expect(isKeyExpired(past)).toBe(true);
		});
	});

	describe("calculateDefaultExpiration", () => {
		it("calculates default expiration (90 days)", () => {
			const now = Date.now();
			const expiration = calculateDefaultExpiration();
			const expirationTime = expiration.getTime();
			const expectedTime = now + 90 * 24 * 60 * 60 * 1000;
			// Allow 1 second tolerance
			expect(Math.abs(expirationTime - expectedTime)).toBeLessThan(1000);
		});
	});

	describe("isValidKeyName", () => {
		it("accepts valid key names", () => {
			expect(isValidKeyName("GitHub Webhook")).toBe(true);
			expect(isValidKeyName("A")).toBe(true);
		});

		it("rejects empty strings", () => {
			expect(isValidKeyName("")).toBe(false);
		});

		it("rejects names longer than 255 characters", () => {
			const longName = "a".repeat(256);
			expect(isValidKeyName(longName)).toBe(false);
		});
	});

	describe("isValidPermission", () => {
		it("accepts 'read' and 'read_write'", () => {
			expect(isValidPermission("read")).toBe(true);
			expect(isValidPermission("read_write")).toBe(true);
		});

		it("rejects other values", () => {
			expect(isValidPermission("write")).toBe(false);
			expect(isValidPermission("admin")).toBe(false);
		});
	});
});

describe("API Key Middleware", () => {
	describe("extractApiKeyFromHeader", () => {
		it("extracts secret from Bearer token", () => {
			const secret = "test-secret-12345";
			const header = `Bearer ${secret}`;
			expect(extractApiKeyFromHeader(header)).toBe(secret);
		});

		it("handles case-insensitive Bearer", () => {
			const secret = "test-secret-12345";
			expect(extractApiKeyFromHeader(`bearer ${secret}`)).toBe(secret);
		});

		it("returns null for missing header", () => {
			expect(extractApiKeyFromHeader(undefined)).toBeNull();
			expect(extractApiKeyFromHeader("")).toBeNull();
		});

		it("returns null for invalid format", () => {
			expect(extractApiKeyFromHeader("Basic xyz")).toBeNull();
		});
	});

	describe("checkApiKeyPermission", () => {
		it("allows read operations with read permission", () => {
			expect(checkApiKeyPermission("read", "read")).toBe(true);
		});

		it("allows read operations with read_write permission", () => {
			expect(checkApiKeyPermission("read_write", "read")).toBe(true);
		});

		it("allows write operations with read_write permission", () => {
			expect(checkApiKeyPermission("read_write", "read_write")).toBe(true);
		});

		it("rejects write operations with read permission", () => {
			expect(checkApiKeyPermission("read", "read_write")).toBe(false);
		});
	});
});

describe("API Key Handlers", () => {
	let testKeyId: string;

	describe("createApiKey", () => {
		it("creates a new API key with required fields", async () => {
			const result = await createApiKey(testUserId, {
				name: "Test Key",
				permission: "read",
			});

			expect(result).toBeDefined();
			expect(result.id).toBeDefined();
			expect(result.secret).toBeDefined();
			expect(result.secret).toHaveLength(40);
			expect(result.name).toBe("Test Key");
			expect(result.permission).toBe("read");
			expect(result.expiresAt).toBeDefined();

			testKeyId = result.id;
		});

		it("rejects empty key names", async () => {
			try {
				await createApiKey(testUserId, {
					name: "",
					permission: "read",
				});
				throw new Error("Should have thrown");
			} catch (error: any) {
				expect(error.message).toContain("name");
			}
		});
	});

	describe("listUserApiKeys", () => {
		it("returns all keys for a user", async () => {
			const keys = await listUserApiKeys(testUserId);
			expect(keys.length).toBeGreaterThan(0);
		});

		it("does not return secrets in list", async () => {
			const keys = await listUserApiKeys(testUserId);
			for (const key of keys) {
				// @ts-expect-error
				expect(key.secret).toBeUndefined();
			}
		});
	});

	describe("getApiKey", () => {
		it("retrieves a specific key by ID", async () => {
			const key = await getApiKey(testUserId, testKeyId);
			expect(key.id).toBe(testKeyId);
		});

		it("does not return secret", async () => {
			const key = await getApiKey(testUserId, testKeyId);
			// @ts-expect-error
			expect(key.secret).toBeUndefined();
		});
	});

	describe("regenerateApiKey", () => {
		it("rotates an existing key in-place", async () => {
			const result = await regenerateApiKey(testUserId, testKeyId);
			expect(result.secret).toBeDefined();
			expect(result.secret).toHaveLength(40);
			expect(result.id).toBe(testKeyId);
		});
	});

	describe("revokeApiKey", () => {
		it("revokes an active key", async () => {
			const key = await createApiKey(testUserId, {
				name: "Key to Revoke",
				permission: "read",
			});

			const result = await revokeApiKey(testUserId, key.id);
			expect(result.revoked).toBe(true);
		});
	});
});

describe("API Key Middleware Validation", () => {
	let validKey: string;
	let expiredKeySecret: string;
	let revokedKeySecret: string;

	beforeAll(async () => {
		// Create a valid key
		const validKeyData = await createApiKey(testUserId, {
			name: "Valid Test Key",
			permission: "read",
		});
		validKey = validKeyData.secret;

		// Create an expired key
		const pastDate = new Date();
		pastDate.setDate(pastDate.getDate() - 1);
		const expiredKeyData = await createApiKey(testUserId, {
			name: "Expired Key",
			permission: "read",
			expiresAt: pastDate,
		});
		expiredKeySecret = expiredKeyData.secret;

		// Create a key to revoke
		const revokeData = await createApiKey(testUserId, {
			name: "Key to Revoke",
			permission: "read",
		});
		revokedKeySecret = revokeData.secret;
		await revokeApiKey(testUserId, revokeData.id);
	});

	describe("validateApiKey", () => {
		it("validates a valid, non-expired key", async () => {
			const result = await validateApiKey(validKey);
			expect(result.userId).toBe(testUserId);
			expect(result.id).toBeDefined();
			expect(result.permission).toBe("read");
		});

		it("rejects an invalid key secret", async () => {
			try {
				await validateApiKey("invalid-secret-key-1234567890");
				throw new Error("Should have thrown AuthenticationError");
			} catch (error: any) {
				expect(error).toBeInstanceOf(AuthenticationError);
				expect(error.message).toContain("Invalid API key");
			}
		});

		it("rejects an expired key", async () => {
			try {
				await validateApiKey(expiredKeySecret);
				throw new Error("Should have thrown AuthenticationError");
			} catch (error: any) {
				expect(error).toBeInstanceOf(AuthenticationError);
				expect(error.message).toContain("expired");
			}
		});

		it("rejects a revoked key", async () => {
			try {
				await validateApiKey(revokedKeySecret);
				throw new Error("Should have thrown AuthenticationError");
			} catch (error: any) {
				expect(error).toBeInstanceOf(AuthenticationError);
				expect(error.message).toContain("revoked");
			}
		});

		it("updates lastUsedAt timestamp on validation", async () => {
			// Validate a new key
			const newKey = await createApiKey(testUserId, {
				name: "Last Used Test 2",
				permission: "read",
			});
			await validateApiKey(newKey.secret);

			// Check that lastUsedAt was updated
			const afterValidation = await getApiKey(testUserId, newKey.id);
			expect(afterValidation.lastUsedAt).not.toBeNull();
		});
	});

	describe("requireApiKey", () => {
		it("extracts and validates API key from Authorization header", async () => {
			const authHeader = `Bearer ${validKey}`;
			const result = await requireApiKey(authHeader);
			expect(result.userId).toBe(testUserId);
			expect(result.permission).toBe("read");
		});

		it("throws error when no Authorization header provided", async () => {
			try {
				await requireApiKey(undefined);
				throw new Error("Should have thrown AuthenticationError");
			} catch (error: any) {
				expect(error).toBeInstanceOf(AuthenticationError);
				expect(error.message).toContain("Missing API key");
			}
		});

		it("throws error for malformed Authorization header", async () => {
			try {
				await requireApiKey("Basic invalid-format");
				throw new Error("Should have thrown AuthenticationError");
			} catch (error: any) {
				expect(error).toBeInstanceOf(AuthenticationError);
				expect(error.message).toContain("Missing API key");
			}
		});
	});

	describe("Permission Checking", () => {
		it("allows read operations with read permission", async () => {
			expect(checkApiKeyPermission("read", "read")).toBe(true);
		});

		it("allows read operations with read_write permission", async () => {
			expect(checkApiKeyPermission("read_write", "read")).toBe(true);
		});

		it("allows write operations with read_write permission", async () => {
			expect(checkApiKeyPermission("read_write", "read_write")).toBe(true);
		});

		it("blocks write operations with read permission", async () => {
			expect(checkApiKeyPermission("read", "read_write")).toBe(false);
		});
	});
});

describe("API Key Lifecycle Integration Tests", () => {
	let integrationTestUserId: string;
	let integrationKey: string;

	beforeAll(async () => {
		integrationTestUserId = await createTestUser();
	});

	it("Create key → Validate key → Update last-used → Revoke key", async () => {
		// Step 1: Create a key
		const created = await createApiKey(integrationTestUserId, {
			name: "Integration Test Key",
			permission: "read_write",
			scopes: ["monitors:read", "alerts:write"],
		});

		expect(created.id).toBeDefined();
		expect(created.secret).toBeDefined();
		expect(created.secret).toHaveLength(40);
		integrationKey = created.secret;

		// Step 2: Validate the key works
		const validated = await validateApiKey(integrationKey);
		expect(validated.userId).toBe(integrationTestUserId);
		expect(validated.permission).toBe("read_write");
		expect(validated.scopes).toContain("monitors:read");

		// Step 3: Verify last-used was updated
		const afterValidation = await getApiKey(integrationTestUserId, created.id);
		expect(afterValidation.lastUsedAt).not.toBeNull();

		// Step 4: Revoke the key
		const revoked = await revokeApiKey(integrationTestUserId, created.id);
		expect(revoked.revoked).toBe(true);

		// Step 5: Verify revoked key can't be used
		try {
			await validateApiKey(integrationKey);
			throw new Error("Should have thrown AuthenticationError");
		} catch (error: any) {
			expect(error).toBeInstanceOf(AuthenticationError);
			expect(error.message).toContain("revoked");
		}
	});

	it("Create key → Regenerate key → Old secret invalid, new secret valid", async () => {
		const user = await createTestUser();

		// Step 1: Create initial key
		const original = await createApiKey(user, {
			name: "Rotation Test",
			permission: "read",
		});
		const originalSecret = original.secret;

		// Step 2: Verify original key works
		const validated = await validateApiKey(originalSecret);
		expect(validated.id).toBe(original.id);

		// Step 3: Regenerate the key
		const regenerated = await regenerateApiKey(user, original.id);
		const newSecret = regenerated.secret;
		expect(newSecret).not.toBe(originalSecret);
		expect(newSecret).toHaveLength(40);

		// Step 4: Old secret should no longer work
		try {
			await validateApiKey(originalSecret);
			throw new Error("Should have thrown AuthenticationError");
		} catch (error: any) {
			expect(error).toBeInstanceOf(AuthenticationError);
		}

		// Step 5: New secret should work
		const withNewSecret = await validateApiKey(newSecret);
		expect(withNewSecret.id).toBe(original.id);

		// Cleanup
		const userKeys = await db
			.select()
			.from(apiKeys)
			.where(eq(apiKeys.userId, user));

		for (const key of userKeys) {
			await db.delete(apiKeyScopes).where(eq(apiKeyScopes.apiKeyId, key.id));
			await db.delete(apiKeys).where(eq(apiKeys.id, key.id));
		}
	});

	it("Multiple keys per user work independently", async () => {
		const user = await createTestUser();

		// Create multiple keys
		const key1 = await createApiKey(user, {
			name: "Key 1",
			permission: "read",
		});
		const key2 = await createApiKey(user, {
			name: "Key 2",
			permission: "read_write",
		});
		const key3 = await createApiKey(user, {
			name: "Key 3",
			permission: "read",
		});

		// All should validate independently
		const validated1 = await validateApiKey(key1.secret);
		const validated2 = await validateApiKey(key2.secret);
		const validated3 = await validateApiKey(key3.secret);

		expect(validated1.permission).toBe("read");
		expect(validated2.permission).toBe("read_write");
		expect(validated3.permission).toBe("read");

		// List should return all three
		const list = await listUserApiKeys(user);
		expect(list.length).toBe(3);

		// Revoke one, others still work
		await revokeApiKey(user, key2.id);

		const afterRevoke1 = await validateApiKey(key1.secret);
		const afterRevoke3 = await validateApiKey(key3.secret);

		expect(afterRevoke1).toBeDefined();
		expect(afterRevoke3).toBeDefined();

		// But key2 should fail
		try {
			await validateApiKey(key2.secret);
			throw new Error("Should have thrown");
		} catch (error: any) {
			expect(error).toBeInstanceOf(AuthenticationError);
		}

		// Cleanup
		const userKeys = await db
			.select()
			.from(apiKeys)
			.where(eq(apiKeys.userId, user));

		for (const key of userKeys) {
			await db.delete(apiKeyScopes).where(eq(apiKeyScopes.apiKeyId, key.id));
			await db.delete(apiKeys).where(eq(apiKeys.id, key.id));
		}
	});
});

// Cleanup
afterAll(async () => {
	// Clean up test data (cascade deletes API keys due to foreign key)
	const userKeys = await db
		.select()
		.from(apiKeys)
		.where(eq(apiKeys.userId, testUserId));

	for (const key of userKeys) {
		await db.delete(apiKeyScopes).where(eq(apiKeyScopes.apiKeyId, key.id));
		await db.delete(apiKeys).where(eq(apiKeys.id, key.id));
	}

	// Delete the test user (which cascades to all related data)
	// Note: we already deleted keys above, so just delete user
	// Actually the cascade would handle this, but we clean manually for clarity
});
