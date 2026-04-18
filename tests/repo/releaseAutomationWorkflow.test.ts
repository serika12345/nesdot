/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("release automation workflow", () => {
  test("runs repository verification before pushing a release", () => {
    const releaseAutomation = readTextFile(
      "../../scripts/release-automation.mjs",
    );

    expect(releaseAutomation).toContain('flakeNix: "flake.nix"');
    expect(releaseAutomation).toContain('cargoLock: "src-tauri/Cargo.lock"');
    expect(releaseAutomation).toContain(
      'run(["pnpm", "exec", "prettier", "--write", ...filePaths]);',
    );
    expect(releaseAutomation).toContain(
      'run(["pnpm", "nix:sync-pnpm-deps-hash"]);',
    );
    expect(releaseAutomation).toContain('run(["pnpm", "verify"]);');
    expect(releaseAutomation).toContain('run(["pnpm", "test:e2e:console"]);');
    expect(releaseAutomation).toContain('run(["pnpm", "verify:rust"]);');
    expect(releaseAutomation).toContain('process.platform === "darwin"');
    expect(releaseAutomation).toContain('run(["pnpm", "verify:tauri:csp"]);');
    expect(releaseAutomation).toContain("RELEASE_FILES.flakeNix,");
  });
});
