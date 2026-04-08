/// <reference types="vitest/config" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { getViteBase } from "./src/shared/viteBase";

const host = process.env.TAURI_DEV_HOST;
const appVersion = process.env.npm_package_version ?? "0.0.0";

export default defineConfig(({ command }) => {
  const base = getViteBase(command);

  return {
    root: "src",
    publicDir: "../public",
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    },
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
    build: {
      outDir: "../dist",
      emptyOutDir: true,
    },
    clearScreen: false,
    test: {
      environment: "node",
      include: ["**/*.test.ts"],
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
  };
});
