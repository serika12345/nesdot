/// <reference types="vitest/config" />

import { pigment } from "@pigment-css/vite-plugin";
import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";
import {
  defineConfig,
  type ConfigPluginContext,
  type Plugin,
  type PluginOption,
} from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { appTheme } from "./src/presentation/theme";
import { getViteBase } from "./src/shared/viteBase";

const host = process.env.TAURI_DEV_HOST;
const appVersion = process.env.npm_package_version ?? "0.0.0";
const require = createRequire(import.meta.url);
const pigmentConfig = {
  theme: appTheme,
  transformLibraries: ["@mui/material"],
};

type ViteConfigHook = NonNullable<Plugin["config"]>;
type ExtractHookHandler<Hook> = Hook extends { handler: infer Handler }
  ? Handler
  : Hook extends (...args: infer Args) => infer Result
    ? (...args: Args) => Result
    : never;
type ViteConfigHandler = ExtractHookHandler<ViteConfigHook>;
type ViteConfigHookArgs = Parameters<ViteConfigHandler>;

const isVitePlugin = (pluginOption: PluginOption): pluginOption is Plugin =>
  pluginOption instanceof Object &&
  !Array.isArray(pluginOption) &&
  "name" in pluginOption;

const isResolvableOptimizeDep = (dependencyName: string): boolean => {
  try {
    require.resolve(dependencyName);
    return true;
  } catch {
    return false;
  }
};

const patchPigmentConfigPlugin = (plugin: Plugin): Plugin => {
  if (plugin.name !== "pigment-css-config-plugin") {
    return plugin;
  }

  if (typeof plugin.config !== "function") {
    return plugin;
  }

  const originalConfig = plugin.config;

  return {
    ...plugin,
    config(this: ConfigPluginContext, ...args: ViteConfigHookArgs) {
      return Promise.resolve(originalConfig.call(this, ...args)).then(
        (configResult) => {
          const optimizeDeps = configResult?.optimizeDeps;
          const include = optimizeDeps?.include;

          if (!Array.isArray(include)) {
            return configResult;
          }

          return {
            ...configResult,
            optimizeDeps: {
              ...optimizeDeps,
              include: include.filter(isResolvableOptimizeDep),
            },
          };
        },
      );
    },
  };
};

const patchPigmentPluginOptions = (
  pluginOption: PluginOption,
): PluginOption => {
  if (Array.isArray(pluginOption)) {
    return pluginOption.map(patchPigmentPluginOptions);
  }

  if (isVitePlugin(pluginOption)) {
    return patchPigmentConfigPlugin(pluginOption);
  }

  return pluginOption;
};

const pigmentPlugins = patchPigmentPluginOptions(pigment(pigmentConfig));

export default defineConfig(({ command }) => {
  const base = getViteBase(command);

  return {
    root: "src",
    publicDir: "../public",
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    },
    plugins: [
      react(),
      pigmentPlugins,
      VitePWA({
        registerType: "prompt",
        injectRegister: false,
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
    optimizeDeps: {
      include: ["prop-types", "react-is", "hoist-non-react-statics"],
    },
    clearScreen: false,
    test: {
      environment: "node",
      include: ["**/*.test.ts", "../tests/repo/**/*.test.ts"],
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
