import { eq } from "drizzle-orm";
import { db } from "#/db";
import { apiKeyScopes, apiKeys } from "#/db/schema";
import { isKeyExpired, verifyApiKeySecret } from "#/lib/api-key";
import { AuthenticationError } from "#/lib/errors";
import { updateKeyLastUsed } from "#/lib/handlers/api-keys";

/**
 * Extract API key from Authorization header
 * Per D-30: Uses Bearer token scheme
 * Format: "Authorization: Bearer <secret>"
 */
export function extractApiKeyFromHeader(
	authHeader: string | undefined,
): string | null {
	if (!authHeader) {
		return null;
	}

	const parts = authHeader.split(" ");
	if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
		return null;
	}

	return parts[1];
}

/**
 * Validate API key and return key info
 * Per D-22: Secret is hashed, never logged or displayed again
 * Per D-20: Check expiration
 * Per D-29: Update lastUsedAt
 *
 * Returns the validated key with scopes and permission
 */
export async function validateApiKey(secret: string) {
	// Find the key by secret hash
	// This is a linear search through hashes (safer than storing plaintext)
	const allUserKeys = await db.select().from(apiKeys);

	let foundKey = null;
	for (const key of allUserKeys) {
		if (verifyApiKeySecret(secret, key.secretHash)) {
			foundKey = key;
			break;
		}
	}

	if (!foundKey) {
		throw new AuthenticationError("Invalid API key");
	}

	// Check if revoked
	if (foundKey.revokedAt) {
		throw new AuthenticationError("API key has been revoked");
	}

	// Check if expired (D-20)
	if (isKeyExpired(foundKey.expiresAt)) {
		throw new AuthenticationError("API key has expired");
	}

	// Get scopes for this key (D-18)
	const scopes = await db
		.select({ scope: apiKeyScopes.scope })
		.from(apiKeyScopes)
		.where(eq(apiKeyScopes.apiKeyId, foundKey.id));

	// Update lastUsedAt (D-29)
	await updateKeyLastUsed(foundKey.id);

	return {
		id: foundKey.id,
		userId: foundKey.userId,
		permission: foundKey.permission,
		scopes: scopes.map((s) => s.scope),
		expiresAt: foundKey.expiresAt,
	};
}

/**
 * Require API key authentication
 * Can be used as middleware for routes that accept API key auth
 * Falls back to session auth if no API key provided
 */
export async function requireApiKey(authHeader: string | undefined) {
	const secret = extractApiKeyFromHeader(authHeader);

	if (!secret) {
		throw new AuthenticationError("Missing API key in Authorization header");
	}

	return validateApiKey(secret);
}

/**
 * Check if API key has specific permission
 * Per D-19: 'read' or 'read_write'
 */
export function checkApiKeyPermission(
	keyPermission: string,
	requiredPermission: "read" | "read_write",
): boolean {
	if (requiredPermission === "read") {
		// Read operations allow both read and read_write keys
		return keyPermission === "read" || keyPermission === "read_write";
	}

	// Write operations require read_write permission
	return keyPermission === "read_write";
}
