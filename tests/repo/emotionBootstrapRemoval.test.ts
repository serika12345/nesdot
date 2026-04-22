/// <reference types="node" />

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

const listProjectFiles = (rootPath: string): ReadonlyArray<string> => {
  const directoryEntries = readdirSync(rootPath);

  return directoryEntries.flatMap((entryName) => {
    const entryPath = path.join(rootPath, entryName);

    if (statSync(entryPath).isDirectory()) {
      return listProjectFiles(entryPath);
    }

    return [entryPath];
  });
};

describe("tauri csp style bootstrap", () => {
  test("keeps the application entrypoint free of emotion bootstrap code", () => {
    const mainSource = readTextFile("../../src/main.tsx");

    expect(mainSource).not.toContain("@emotion/cache");
    expect(mainSource).not.toContain("@emotion/react");
    expect(mainSource).not.toContain("createCache");
    expect(mainSource).not.toContain("CacheProvider");
    expect(mainSource).not.toContain("getCspNonce");
    expect(mainSource).toContain("@radix-ui/themes/styles.css");
    expect(mainSource).toContain("Theme");
    expect(mainSource).not.toContain("@mui/material-pigment-css/styles.css");
    expect(mainSource).not.toContain("ThemeProvider");
  });

  test("keeps index.html free of the tauri style nonce placeholder", () => {
    const indexHtml = readTextFile("../../src/index.html");

    expect(indexHtml).not.toContain('name="csp-nonce"');
    expect(indexHtml).not.toContain("__TAURI_STYLE_NONCE__");
  });

  test("removes the csp nonce lookup helper", () => {
    expect(
      existsSync(
        path.join(projectRoot, "src/infrastructure/browser/getCspNonce.ts"),
      ),
    ).toBe(false);
  });

  test("removes direct emotion runtime dependencies from package.json", () => {
    const packageJson = readTextFile("../../package.json");

    expect(packageJson).not.toContain('"@emotion/cache"');
    expect(packageJson).not.toContain('"@emotion/react"');
    expect(packageJson).toContain('"@radix-ui/themes"');
  });

  test("keeps src and entry config free of mui and pigment imports", () => {
    const projectFiles = [
      ...listProjectFiles(path.join(projectRoot, "src")),
      path.join(projectRoot, "vite.config.ts"),
    ];
    const offenders = projectFiles.flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");

      if (
        source.includes("@mui/") === true ||
        source.includes("@pigment-css/") === true
      ) {
        return [path.relative(projectRoot, filePath)];
      }

      return [];
    });

    expect(offenders).toStrictEqual([]);
  });
});
