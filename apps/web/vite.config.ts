import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Keep 5173 free for telegram-miniapp; web uses 5174.
    port: 5174,
    host: true,
  },
  preview: {
    port: 5174,
    host: true,
  },
});
