/// <reference types="vitest/config" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// @ts-expect-error process is a Node.js global provided by Vite config execution.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(() => ({
  plugins: [react({ jsxImportSource: "@emotion/react" })],
  clearScreen: false,
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    ...(host
      ? {
          hmr: {
            protocol: "ws",
            host,
            port: 1421,
          },
        }
      : {}),
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
