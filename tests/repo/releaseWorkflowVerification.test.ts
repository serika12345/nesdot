/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";
import { z } from "zod";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

const PackageJsonSchema = z.object({
  version: z.string(),
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
});

const TauriConfigSchema = z.object({
  version: z.string(),
});

describe("release workflow verification", () => {
  test("keeps release versions aligned across package, tauri config, and Cargo", () => {
    const packageJson = PackageJsonSchema.parse(
      JSON.parse(readTextFile("../../package.json")),
    );
    const tauriConfig = TauriConfigSchema.parse(
      JSON.parse(readTextFile("../../src-tauri/tauri.conf.json")),
    );
    const cargoToml = readTextFile("../../src-tauri/Cargo.toml");
    const cargoVersionMatch = cargoToml.match(
      /^version = "(\d+\.\d+\.\d+)"$/mu,
    );

    expect(cargoVersionMatch).not.toBeNull();
    expect(tauriConfig.version).toBe(packageJson.version);
    expect(cargoVersionMatch?.[1]).toBe(packageJson.version);
  });

  test("keeps Playwright packages on the same version", () => {
    const packageJson = PackageJsonSchema.parse(
      JSON.parse(readTextFile("../../package.json")),
    );
    const devDependencies = packageJson.devDependencies ?? {};

    expect(devDependencies["@playwright/test"]).toBe(
      devDependencies.playwright,
    );
  });

  test("runs full verification before pages deployment", () => {
    const workflow = readTextFile("../../.github/workflows/deploy-pages.yml");

    expect(workflow).toContain("pnpm verify:full");
    expect(workflow).toContain("pnpm build");
  });

  test("runs full verification before desktop releases", () => {
    const workflow = readTextFile(
      "../../.github/workflows/release-tauri-desktop.yml",
    );

    expect(workflow).toContain("verify-pnpm-deps-hash:");
    expect(workflow).toContain("pnpm nix:check-pnpm-deps-hash");
    expect(workflow).toContain("needs: verify-pnpm-deps-hash");
    expect(workflow).toContain("pnpm verify:full");
    expect(workflow).toContain("pnpm verify:rust");
  });

  test("runs macOS Tauri CSP runtime verification against the nix-built app", () => {
    const workflow = readTextFile(
      "../../.github/workflows/release-tauri-desktop.yml",
    );

    expect(workflow).toContain("verify-macos-tauri-csp:");
    expect(workflow).toContain("runs-on: macos-latest");
    expect(workflow).toContain("pnpm verify:tauri:csp");
    expect(workflow).toContain(
      "needs: [verify-release, verify-macos-tauri-csp]",
    );
  });
});
