import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@web-ui": path.resolve(rootDir, "../web/src"),
    },
  },
  server: {
    port: 5176,
    host: true,
  },
  preview: {
    port: 5176,
    host: true,
  },
});
