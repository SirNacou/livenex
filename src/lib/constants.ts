// Session configuration per D-08, D-14, D-15
export const SESSION_CONFIG = {
	expirationDays: 30,
	sameSite: "strict" as const,
	secure: process.env.NODE_ENV === "production" || false, // D-15: Allow HTTP in dev
	httpOnly: true,
} as const;

// API key configuration per D-20
export const API_KEY_CONFIG = {
	defaultExpirationDays: 90, // Can be overridden at creation
	minSecretLength: 32,
	maxNameLength: 255,
} as const;
