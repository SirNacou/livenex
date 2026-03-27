import { Elysia } from "elysia";

const app = new Elysia({ prefix: "/api" })
	.get("/", () => "Hello World")
	.get("/hello/:name", ({ params }) => `Hello ${params.name}!`);

type Server = typeof app;

export { app, type Server };
