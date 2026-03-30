import { Elysia } from "elysia";

const app = new Elysia({
  prefix: "/api",
}).get("/", () => "Hello World!");

const AppType = typeof app;

export { app, type AppType };
