import { createHash, randomBytes } from "crypto";
import { API_KEY_CONFIG } from "./constants";

/**
 * Generate a cryptographically secure API key
 * Returns a 40-character base64-like string
 * Per D-22: Secret is generated once, never logged or stored plaintext
 */
export function generateApiKeySecret(): string {
	// Generate 30 random bytes (~240 bits) → 40 characters in base64url
	const randomPart = randomBytes(30).toString("base64url");
	// Trim to 40 chars exactly
	return randomPart.substring(0, 40);
}

/**
 * Hash an API key secret for storage
 * Uses SHA-256 for comparison without plaintext exposure
 * Per D-22: Never store plaintext secrets
 */
export function hashApiKeySecret(secret: string): string {
	return createHash("sha256").update(secret).digest("hex");
}

/**
 * Verify an API key secret against its hash
 * Used during validation middleware
 */
export function verifyApiKeySecret(secret: string, hash: string): boolean {
	const computedHash = hashApiKeySecret(secret);
	return computedHash === hash;
}

/**
 * Validate API key permissions (D-19)
 * Valid: 'read' or 'read_write'
 */
export function isValidPermission(
	permission: string,
): permission is "read" | "read_write" {
	return permission === "read" || permission === "read_write";
}

/**
 * Check if an API key is expired
 * Per D-20: NULL expiresAt = never expires (1 year default if specified)
 */
export function isKeyExpired(expiresAt: Date | null | undefined): boolean {
	if (!expiresAt) {
		return false; // Never expires if not specified
	}
	return new Date() > expiresAt;
}

/**
 * Calculate default expiration date
 * Per D-20: Defaults to 90 days (configurable)
 */
export function calculateDefaultExpiration(
	offsetDays: number = API_KEY_CONFIG.defaultExpirationDays,
): Date {
	const date = new Date();
	date.setDate(date.getDate() + offsetDays);
	return date;
}

/**
 * Validate key name (D-28: User-defined label)
 */
export function isValidKeyName(name: string): boolean {
	return (
		typeof name === "string" &&
		name.length > 0 &&
		name.length <= API_KEY_CONFIG.maxNameLength
	);
}
