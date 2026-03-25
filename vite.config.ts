/// <reference types="vitest/config" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;
const githubRepository = process.env.GITHUB_REPOSITORY;
const repositoryName =
  typeof githubRepository === "string" ? githubRepository.split("/")[1] : "";
const base =
  process.env.GITHUB_ACTIONS === "true" && repositoryName.length > 0
    ? `/${repositoryName}/`
    : "/";

export default defineConfig(() => ({
  plugins: [react({ jsxImportSource: "@emotion/react" })],
  base,
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
