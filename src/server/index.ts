import { Elysia, t } from "elysia";
import { AppError } from "#/lib/errors";
import {
	createApiKey,
	listUserApiKeys,
	regenerateApiKey,
	revokeApiKey,
} from "#/lib/handlers/api-keys";
import { requireApiKey } from "#/lib/middleware/api-key";
import { getCurrentUser } from "#/lib/middleware/auth";

const app = new Elysia({ prefix: "/api" })
	// Health check endpoint
	.get("/", () => ({ ok: true, data: "API ready" }))
	.get("/hello/:name", ({ params }) => ({
		ok: true,
		data: `Hello ${params.name}!`,
	}))
	// API Key Management Routes
	// POST /api/keys - Create a new API key
	.post(
		"/keys",
		async ({ request, body: reqBody }) => {
			try {
				// Session authentication only for creating keys
				const cookie = request.headers.get("cookie");
				if (!cookie) {
					throw new Error("No session cookie");
				}
				const user = await getCurrentUser(cookie);

				// Validate input
				const body = reqBody as {
					name?: string;
					permission?: string;
					scopes?: string[];
					expiresAt?: string;
				};

				if (!body.name || !body.permission) {
					return {
						ok: false,
						error: "VALIDATION_ERROR",
						message: "name and permission are required",
						statusCode: 400,
					};
				}

				if (body.permission !== "read" && body.permission !== "read_write") {
					return {
						ok: false,
						error: "VALIDATION_ERROR",
						message: 'permission must be "read" or "read_write"',
						statusCode: 400,
					};
				}

				const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

				const newKey = await createApiKey(user.id, {
					name: body.name,
					permission: body.permission as "read" | "read_write",
					scopes: body.scopes,
					expiresAt,
				});

				return {
					ok: true,
					data: newKey, // ONLY return includes the secret (D-22)
					statusCode: 201,
				};
			} catch (error) {
				const err = error as AppError | Error;
				if (err instanceof AppError) {
					return {
						ok: false,
						error: err.code,
						message: err.message,
						statusCode: err.statusCode,
					};
				}
				return {
					ok: false,
					error: "INTERNAL_ERROR",
					message: err.message || "Internal server error",
					statusCode: 500,
				};
			}
		},
		{
			body: t.Object({
				name: t.String({ minLength: 1, maxLength: 255 }),
				permission: t.Union([t.Literal("read"), t.Literal("read_write")]),
				scopes: t.Optional(t.Array(t.String())),
				expiresAt: t.Optional(t.String()),
			}),
		},
	)
	// GET /api/keys - List all keys for authenticated user
	.get("/keys", async ({ request }) => {
		try {
			// Support both session auth and API key auth
			const authHeader = request.headers.get("Authorization");
			let userId: string;

			if (authHeader && authHeader.startsWith("Bearer ")) {
				// API key authentication
				const keyInfo = await requireApiKey(authHeader);
				userId = keyInfo.userId;
			} else {
				// Session authentication
				const cookie = request.headers.get("cookie");
				if (!cookie) {
					throw new Error("No session cookie");
				}
				const user = await getCurrentUser(cookie);
				userId = user.id;
			}

			const keys = await listUserApiKeys(userId);
			return {
				ok: true,
				data: keys,
				statusCode: 200,
			};
		} catch (error) {
			const err = error as AppError | Error;
			if (err instanceof AppError) {
				return {
					ok: false,
					error: err.code,
					message: err.message,
					statusCode: err.statusCode,
				};
			}
			return {
				ok: false,
				error: "INTERNAL_ERROR",
				message: err.message || "Internal server error",
				statusCode: 500,
			};
		}
	})
	// POST /api/keys/:id/regenerate - Rotate key in-place (D-21)
	.post("/keys/:id/regenerate", async ({ request, params: { id } }) => {
		try {
			const cookie = request.headers.get("cookie");
			if (!cookie) {
				throw new Error("No session cookie");
			}
			const user = await getCurrentUser(cookie);

			const newKeyData = await regenerateApiKey(user.id, id);
			return {
				ok: true,
				data: newKeyData, // ONLY return includes new secret
				statusCode: 200,
			};
		} catch (error) {
			const err = error as AppError | Error;
			if (err instanceof AppError) {
				return {
					ok: false,
					error: err.code,
					message: err.message,
					statusCode: err.statusCode,
				};
			}
			return {
				ok: false,
				error: "INTERNAL_ERROR",
				message: err.message || "Internal server error",
				statusCode: 500,
			};
		}
	})
	// DELETE /api/keys/:id - Revoke a key (D-25/D-26)
	.delete("/keys/:id", async ({ request, params: { id } }) => {
		try {
			const cookie = request.headers.get("cookie");
			if (!cookie) {
				throw new Error("No session cookie");
			}
			const user = await getCurrentUser(cookie);

			const result = await revokeApiKey(user.id, id);
			return {
				ok: true,
				data: result,
				statusCode: 200,
			};
		} catch (error) {
			const err = error as AppError | Error;
			if (err instanceof AppError) {
				return {
					ok: false,
					error: err.code,
					message: err.message,
					statusCode: err.statusCode,
				};
			}
			return {
				ok: false,
				error: "INTERNAL_ERROR",
				message: err.message || "Internal server error",
				statusCode: 500,
			};
		}
	});

export type Server = typeof app;

export { app };
