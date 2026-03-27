import { defineConfig } from "@tanstack/react-start/config";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  routers: {
    ssr: {
      entry: "packages/frontend/src/entry.tsx",
      routes: "packages/frontend/src/routes",
    },
  },
});
