import { Elysia } from "elysia";

const app = new Elysia({ prefix: "/api" })
	// Health check endpoint
	.get("/", () => ({ ok: true, data: "API ready" }))
	.get("/hello/:name", ({ params }) => ({
		ok: true,
		data: `Hello ${params.name}!`,
	}));

export type Server = typeof app;

export { app };
