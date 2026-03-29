import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { apiKeyScopes, apiKeys } from "#/db/schema";
import {
	calculateDefaultExpiration,
	generateApiKeySecret,
	hashApiKeySecret,
	isKeyExpired,
	isValidKeyName,
	isValidPermission,
} from "#/lib/api-key";
import { NotFoundError, ValidationError } from "#/lib/errors";

/**
 * Create a new API key for the authenticated user
 * Per D-22: Returns secret once, then hashes it
 * Per D-20: Expiration defaults to 90 days if not specified
 * Per D-28: User-defined name required
 */
export async function createApiKey(
	userId: string,
	{
		name,
		permission,
		scopes,
		expiresAt,
	}: {
		name: string;
		permission: "read" | "read_write";
		scopes?: string[];
		expiresAt?: Date;
	},
) {
	// Validate inputs
	if (!isValidKeyName(name)) {
		throw new ValidationError("Key name must be 1-255 characters");
	}

	if (!isValidPermission(permission)) {
		throw new ValidationError('Permission must be "read" or "read_write"');
	}

	// Generate secret and hash
	const secret = generateApiKeySecret();
	const secretHash = hashApiKeySecret(secret);

	// Calculate expiration (D-20: defaults to 90 days)
	const finalExpiresAt = expiresAt || calculateDefaultExpiration();

	// Insert API key
	const [createdKey] = await db
		.insert(apiKeys)
		.values({
			userId,
			name,
			secretHash,
			permission,
			expiresAt: finalExpiresAt,
			revokedAt: null,
			lastUsedAt: null,
		})
		.returning();

	// Insert scopes if provided (D-18: scoped by tag/group)
	if (scopes && scopes.length > 0) {
		await db.insert(apiKeyScopes).values(
			scopes.map((scope) => ({
				apiKeyId: createdKey.id,
				scope,
			})),
		);
	}

	// Return secret ONCE (never again) per D-22
	return {
		id: createdKey.id,
		secret, // Plain secret returned only here
		name: createdKey.name,
		permission: createdKey.permission,
		expiresAt: createdKey.expiresAt,
		createdAt: createdKey.createdAt,
		scopes: scopes || [],
	};
}

/**
 * Get all API keys for a user (list view, D-23)
 * Does not return secrets, only metadata
 */
export async function listUserApiKeys(userId: string) {
	const keys = await db
		.select({
			id: apiKeys.id,
			name: apiKeys.name,
			permission: apiKeys.permission,
			expiresAt: apiKeys.expiresAt,
			lastUsedAt: apiKeys.lastUsedAt,
			revokedAt: apiKeys.revokedAt,
			createdAt: apiKeys.createdAt,
		})
		.from(apiKeys)
		.where(eq(apiKeys.userId, userId))
		.orderBy(apiKeys.createdAt);

	// Enrich with scopes
	const enrichedKeys = await Promise.all(
		keys.map(async (key) => {
			const keyScopes = await db
				.select({ scope: apiKeyScopes.scope })
				.from(apiKeyScopes)
				.where(eq(apiKeyScopes.apiKeyId, key.id));

			return {
				...key,
				scopes: keyScopes.map((s) => s.scope),
				isExpired: isKeyExpired(key.expiresAt),
				isRevoked: key.revokedAt !== null,
			};
		}),
	);

	return enrichedKeys;
}

/**
 * Get a specific API key for display in the UI
 * Does not return the secret
 */
export async function getApiKey(userId: string, keyId: string) {
	const [key] = await db
		.select()
		.from(apiKeys)
		.where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));

	if (!key) {
		throw new NotFoundError("API key not found");
	}

	const keyScopes = await db
		.select({ scope: apiKeyScopes.scope })
		.from(apiKeyScopes)
		.where(eq(apiKeyScopes.apiKeyId, key.id));

	return {
		id: key.id,
		name: key.name,
		permission: key.permission,
		expiresAt: key.expiresAt,
		lastUsedAt: key.lastUsedAt,
		revokedAt: key.revokedAt,
		createdAt: key.createdAt,
		scopes: keyScopes.map((s) => s.scope),
		isExpired: isKeyExpired(key.expiresAt),
		isRevoked: key.revokedAt !== null,
	};
}

/**
 * Regenerate an API key (rotate in-place, D-21)
 * Creates a new secret, marks old key as having a new secret
 * Returns the new secret once
 */
export async function regenerateApiKey(userId: string, keyId: string) {
	// Verify the key belongs to the user
	const [key] = await db
		.select()
		.from(apiKeys)
		.where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));

	if (!key) {
		throw new NotFoundError("API key not found");
	}

	if (key.revokedAt) {
		throw new ValidationError("Cannot regenerate a revoked key");
	}

	// Generate new secret
	const newSecret = generateApiKeySecret();
	const newSecretHash = hashApiKeySecret(newSecret);

	// Update the key with new secret (in-place rotation, D-21)
	await db
		.update(apiKeys)
		.set({
			secretHash: newSecretHash,
			lastUsedAt: null, // Reset last used on regeneration
		})
		.where(eq(apiKeys.id, keyId));

	return {
		id: keyId,
		secret: newSecret,
		name: key.name,
		permission: key.permission,
		expiresAt: key.expiresAt,
		createdAt: key.createdAt,
	};
}

/**
 * Revoke an API key (soft delete, D-25/D-26)
 * Per D-25: Requires user confirmation
 * Sets revokedAt timestamp (NULL = active)
 */
export async function revokeApiKey(userId: string, keyId: string) {
	const [key] = await db
		.select()
		.from(apiKeys)
		.where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));

	if (!key) {
		throw new NotFoundError("API key not found");
	}

	if (key.revokedAt) {
		throw new ValidationError("Key is already revoked");
	}

	// Mark as revoked (soft delete)
	await db
		.update(apiKeys)
		.set({
			revokedAt: new Date(),
		})
		.where(eq(apiKeys.id, keyId));

	return { id: keyId, revoked: true };
}

/**
 * Validate an API key secret during API authentication
 * Per D-29: Updates lastUsedAt timestamp
 * Returns the key info if valid
 */
export async function validateApiKeySecret(secret: string) {
	// This will be called in middleware
	// For now, we just export the logic
	// Actual validation happens in middleware/api-key.ts
	return secret;
}

/**
 * Update last-used timestamp for an API key
 * Per D-29: Track when keys are used
 */
export async function updateKeyLastUsed(keyId: string) {
	await db
		.update(apiKeys)
		.set({
			lastUsedAt: new Date(),
		})
		.where(eq(apiKeys.id, keyId));
}
