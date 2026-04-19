/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("license verification workflow", () => {
  test("defines dedicated license verification scripts", () => {
    const packageJson = readTextFile("../../package.json");

    expect(packageJson).toContain(
      '"verify:licenses": "node scripts/verify-licenses.mjs && node scripts/verify-system-libraries.mjs"',
    );
    expect(packageJson).toContain(
      '"verify:system-libraries": "node scripts/verify-system-libraries.mjs"',
    );
  });

  test("defines VS Code and CI entry points for the license checks", () => {
    const tasksJson = readTextFile("../../.vscode/tasks.json");
    const ciWorkflow = readTextFile("../../.github/workflows/ci.yml");

    expect(tasksJson).toContain('"Verify Licenses"');
    expect(tasksJson).toContain('"Verify System Libraries"');
    expect(tasksJson).toContain('"pnpm verify:licenses"');
    expect(ciWorkflow).toContain("pnpm verify:licenses");
  });

  test("documents the independent license verification flow in the development manual", () => {
    const manual = readTextFile("../../docs/development-manual.md");

    expect(manual).toContain("pnpm verify:licenses");
    expect(manual).toContain("GPL");
    expect(manual).toContain("System Library Verification");
  });

  test("keeps dependency license verification independent from security verification", () => {
    const licenseScript = readTextFile("../../scripts/verify-licenses.mjs");
    const securityScript = readTextFile("../../scripts/verify-security.mjs");

    expect(licenseScript).toContain("pnpm licenses list --json");
    expect(licenseScript).toContain("cargo metadata");
    expect(licenseScript).toContain("GPL");
    expect(securityScript).not.toContain("pnpm licenses list --json");
    expect(securityScript).not.toContain("cargo metadata");
  });
});
