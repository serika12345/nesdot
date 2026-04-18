/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("tauri CSP runtime verification", () => {
  test("keeps a dedicated macOS runtime verifier wired through package scripts", () => {
    const packageJson = readTextFile("../../package.json");
    const verifierScript = readTextFile("../../scripts/verify-tauri-csp.mjs");

    expect(packageJson).toContain(
      '"verify:tauri:csp": "node scripts/verify-tauri-csp.mjs"',
    );
    expect(verifierScript).toContain('execFileSync("nix", ["build"]');
    expect(verifierScript).toContain("result/bin/nesdot");
    expect(verifierScript).toContain('spawn(\n    "log"');
    expect(verifierScript).toContain('"stream"');
    expect(verifierScript).toContain("Content Security");
    expect(verifierScript).toContain("console-error");
  });

  test("documents the macOS runtime verifier for release checks", () => {
    const readme = readTextFile("../../README.md");
    const releaseChecklist = readTextFile("../../docs/release-checklist.md");

    expect(readme).toContain("pnpm verify:tauri:csp");
    expect(releaseChecklist).toContain("pnpm verify:tauri:csp");
  });
});
