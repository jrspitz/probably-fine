import { defineConfig } from "vite";

// Deployment base path. Set VITE_BASE_PATH at build time, e.g.
//   VITE_BASE_PATH=/my-app/ npm run build
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
});
