/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("system library verification workflow", () => {
  test("defines a dedicated system library verification script", () => {
    const packageJson = readTextFile("../../package.json");

    expect(packageJson).toContain(
      '"verify:system-libraries": "node scripts/verify-system-libraries.mjs"',
    );
  });

  test("defines a focused VS Code entry point for the system library check", () => {
    const tasksJson = readTextFile("../../.vscode/tasks.json");

    expect(tasksJson).toContain('"Verify System Libraries"');
    expect(tasksJson).toContain('"pnpm verify:system-libraries"');
  });

  test("documents when to run the system library check in the development manual", () => {
    const manual = readTextFile("../../docs/development-manual.md");

    expect(manual).toContain("pnpm verify:system-libraries");
    expect(manual).toContain("system library");
    expect(manual).toContain("webkitgtk_4_1");
  });

  test("keeps the system library check focused on reviewed Linux Tauri inputs", () => {
    const verificationScript = readTextFile(
      "../../scripts/verify-system-libraries.mjs",
    );
    const policyScript = readTextFile(
      "../../scripts/system-library-policy.mjs",
    );

    expect(verificationScript).toContain("nix eval --json");
    expect(verificationScript).toContain("meta.license");
    expect(verificationScript).toContain(
      "extractLinuxBuildInputPackageNames(flakeText)",
    );
    expect(policyScript).toContain("linuxBuildInputs\\s*=\\s*with pkgs;");
    expect(policyScript).toContain("webkitgtk_4_1");
    expect(policyScript).toContain("gtk3");
    expect(verificationScript).toContain("reviewed");
  });
});
