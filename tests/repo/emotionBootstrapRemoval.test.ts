/// <reference types="node" />

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("tauri csp style bootstrap", () => {
  test("keeps the application entrypoint wired for emotion nonce injection", () => {
    const mainSource = readTextFile("../../src/main.tsx");

    expect(mainSource).toContain("@emotion/cache");
    expect(mainSource).toContain("@emotion/react");
    expect(mainSource).toContain("createCache");
    expect(mainSource).toContain("CacheProvider");
    expect(mainSource).toContain("getCspNonce");
    expect(mainSource).toContain("ThemeProvider");
  });

  test("keeps index.html wired with the tauri style nonce placeholder", () => {
    const indexHtml = readTextFile("../../src/index.html");

    expect(indexHtml).toContain('name="csp-nonce"');
    expect(indexHtml).toContain("__TAURI_STYLE_NONCE__");
  });

  test("keeps the csp nonce lookup helper available", () => {
    expect(
      existsSync(
        path.join(projectRoot, "src/infrastructure/browser/getCspNonce.ts"),
      ),
    ).toBe(true);
  });

  test("keeps direct emotion runtime dependencies in package.json", () => {
    const packageJson = readTextFile("../../package.json");

    expect(packageJson).toContain('"@emotion/cache"');
    expect(packageJson).toContain('"@emotion/react"');
  });
});
