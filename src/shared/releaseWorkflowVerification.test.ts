/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("release workflow verification", () => {
  test("runs full verification before pages deployment", () => {
    const workflow = readTextFile("../../.github/workflows/deploy-pages.yml");

    expect(workflow).toContain("pnpm verify:full");
    expect(workflow).toContain("pnpm build");
  });

  test("runs full verification before desktop releases", () => {
    const workflow = readTextFile(
      "../../.github/workflows/release-tauri-desktop.yml",
    );

    expect(workflow).toContain("pnpm verify:full");
    expect(workflow).toContain("pnpm verify:rust");
  });
});
