/// <reference types="vitest/config" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const host = process.env.TAURI_DEV_HOST;
const githubRepository = process.env.GITHUB_REPOSITORY;
const repositoryName =
  typeof githubRepository === "string" ? githubRepository.split("/")[1] : "";
const base =
  process.env.GITHUB_ACTIONS === "true" && repositoryName.length > 0
    ? `/${repositoryName}/`
    : "/";

export default defineConfig(() => ({
  plugins: [
    react({ jsxImportSource: "@emotion/react" }),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "favicon-32x32.png",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "nesdot",
        short_name: "nesdot",
        description: "An NES screen emulator built with Tauri and React.",
        theme_color: "#0d1726",
        background_color: "#0d1726",
        display: "standalone",
        start_url: base,
        scope: base,
        lang: "ja",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-192x192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "pwa-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
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
