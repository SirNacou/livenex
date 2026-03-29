import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db";
import * as schema from "#/db/schema";
import { SESSION_CONFIG } from "./constants";

export const auth = betterAuth({
	database: drizzleAdapter(db),
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	basePath: "/api/auth",
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		tanstackStartCookies({
			useSecureCookies: SESSION_CONFIG.secure,
		}),
	],
	session: {
		expiresIn: SESSION_CONFIG.expirationDays * 24 * 60 * 60, // Convert days to seconds
		updateAge: 24 * 60 * 60, // Update session every 24 hours
		cookieAttributes: {
			sameSite: SESSION_CONFIG.sameSite,
			secure: SESSION_CONFIG.secure,
			httpOnly: SESSION_CONFIG.httpOnly,
		},
	},
	// D-04: Password reset deferred, so exclude it
	// D-05: 2FA not included
	// D-02/D-03: OIDC deferred to stretch goal
});

export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
