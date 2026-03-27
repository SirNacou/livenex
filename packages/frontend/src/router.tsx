import { RootRoute, Router } from "@tanstack/react-router";
import { RootLayout } from "../layouts/root-layout.js";

const rootRoute = new RootRoute({
  component: RootLayout,
});

export const routeTree = rootRoute.addChildren([]);

export const router = new Router({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
