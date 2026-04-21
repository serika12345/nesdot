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
  test("keeps the application entrypoint free of emotion bootstrap code", () => {
    const mainSource = readTextFile("../../src/main.tsx");

    expect(mainSource).not.toContain("@emotion/cache");
    expect(mainSource).not.toContain("@emotion/react");
    expect(mainSource).not.toContain("createCache");
    expect(mainSource).not.toContain("CacheProvider");
    expect(mainSource).not.toContain("getCspNonce");
    expect(mainSource).toContain("ThemeProvider");
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
  });
});
