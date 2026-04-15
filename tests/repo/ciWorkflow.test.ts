/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("ci-equivalent verification workflow", () => {
  test("defines a one-shot local command for the full CI-equivalent verification", () => {
    const packageJson = readTextFile("../../package.json");

    expect(packageJson).toContain(
      '"verify:ui:console": "pnpm test:e2e:console"',
    );
    expect(packageJson).toContain('"verify:ci":');
    expect(packageJson).toContain("pnpm nix:check-pnpm-deps-hash");
    expect(packageJson).toContain("pnpm install --frozen-lockfile");
    expect(packageJson).toContain("pnpm verify:licenses");
    expect(packageJson).toContain("pnpm verify:rust");
    expect(packageJson).toContain("pnpm verify:ui:console");
    expect(packageJson).toContain("pnpm verify:cve");
  });

  test("documents the one-shot local CI-equivalent verification command", () => {
    const readme = readTextFile("../../README.md");

    expect(readme).toContain("pnpm verify:ci");
    expect(readme).toContain("CI 相当");
  });

  test("keeps the main CI job from rerunning the base verification unnecessarily", () => {
    const workflow = readTextFile("../../.github/workflows/ci.yml");

    expect(workflow).toContain("pnpm verify:ui:console");
    expect(workflow).toContain("pnpm verify:cve");
    expect(workflow).not.toContain("pnpm e2e:install && pnpm verify:ui'");
    expect(workflow).not.toContain("audit-cves:");
  });
});
