import { auth } from "#/lib/auth";
import { AuthenticationError } from "#/lib/errors";

/**
 * Validate session from cookie header
 * Per D-08: Enforce 30-day expiration
 */
export async function requireSession(cookie: string | undefined) {
	if (!cookie) {
		throw new AuthenticationError("No session cookie");
	}

	try {
		const result = await auth.api.getSession({
			headers: {
				cookie,
			},
		});

		if (!result || !result.session) {
			throw new AuthenticationError("Invalid or expired session");
		}

		// Check expiration per D-08
		if (new Date(result.session.expiresAt) < new Date()) {
			throw new AuthenticationError("Session expired");
		}

		return result;
	} catch (err) {
		if (err instanceof AuthenticationError) throw err;
		throw new AuthenticationError("Session validation failed");
	}
}

/**
 * Get the current user from session
 */
export async function getCurrentUser(cookie: string | undefined) {
	const result = await requireSession(cookie);
	return result.user;
}
