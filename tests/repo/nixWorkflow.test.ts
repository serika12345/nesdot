/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("nix workflow", () => {
  test("defines scripts to check and sync fetchPnpmDeps hash with pnpm-lock changes", () => {
    const packageJson = readTextFile("../../package.json");

    expect(packageJson).toContain(
      '"nix:check-pnpm-deps-hash": "node scripts/sync-flake-pnpm-deps-hash.mjs --check"',
    );
    expect(packageJson).toContain(
      '"nix:sync-pnpm-deps-hash": "node scripts/sync-flake-pnpm-deps-hash.mjs"',
    );
  });

  test("documents how to verify and refresh the flake pnpm hash after lockfile updates in the development manual", () => {
    const manual = readTextFile("../../docs/development-manual.md");

    expect(manual).toContain("pnpm-lock.yaml");
    expect(manual).toContain("flake.nix");
    expect(manual).toContain("pnpm nix:check-pnpm-deps-hash");
    expect(manual).toContain("pnpm nix:sync-pnpm-deps-hash");
  });

  test("ships a sync script that can check hash drift from the dedicated pnpmDeps target", () => {
    const syncScript = readTextFile(
      "../../scripts/sync-flake-pnpm-deps-hash.mjs",
    );

    expect(syncScript).toContain("nix");
    expect(syncScript).toContain(".#pnpmDeps");
    expect(syncScript).toContain("--no-link");
    expect(syncScript).toContain("--check");
    expect(syncScript).toContain("got:");
    expect(syncScript).toContain("pnpm-lock.yaml");
    expect(syncScript).toContain("flake.nix");
  });

  test("keeps CI hash verification lightweight and fail-fast", () => {
    const workflow = readTextFile("../../.github/workflows/ci.yml");

    expect(workflow).toContain("verify-pnpm-deps-hash:");
    expect(workflow).toContain("pnpm nix:check-pnpm-deps-hash");
    expect(workflow).toContain("needs: verify-pnpm-deps-hash");
  });
});
