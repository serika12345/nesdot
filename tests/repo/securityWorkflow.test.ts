/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("security verification workflow", () => {
  test("defines dedicated security and CVE verification scripts", () => {
    const packageJson = readTextFile("../../package.json");

    expect(packageJson).toContain(
      '"verify:security": "node scripts/verify-security.mjs"',
    );
    expect(packageJson).toContain(
      '"verify:cve": "node scripts/verify-cves.mjs"',
    );
    expect(packageJson).toContain(
      '"verify": "pnpm format:check && pnpm lint && pnpm typecheck:safety && pnpm verify:security && pnpm test"',
    );
  });

  test("defines VS Code tasks for targeted security verification", () => {
    const tasksJson = readTextFile("../../.vscode/tasks.json");

    expect(tasksJson).toContain('"Verify Security"');
    expect(tasksJson).toContain('"Verify CVE"');
    expect(tasksJson).toContain('"pnpm verify:security"');
    expect(tasksJson).toContain('"pnpm verify:cve"');
  });

  test("documents the security verification gate", () => {
    const readme = readTextFile("../../README.md");

    expect(readme).toContain("pnpm verify:security");
    expect(readme).toContain("pnpm verify:cve");
    expect(readme).toContain("baseline");
  });

  test("keeps security verification focused on supply chain, csp, updater, JSON boundaries, and CI wiring", () => {
    const securityScript = readTextFile("../../scripts/verify-security.mjs");
    const tauriConfig = readTextFile("../../src-tauri/tauri.conf.json");
    const eslintConfig = readTextFile("../../eslint.config.js");
    const ciWorkflow = readTextFile("../../.github/workflows/ci.yml");
    const flakeNix = readTextFile("../../flake.nix");
    const cveScript = readTextFile("../../scripts/verify-cves.mjs");
    const cveBaseline = readTextFile("../../scripts/cve-audit-baseline.json");

    expect(securityScript).toContain("strictDepBuilds: true");
    expect(securityScript).toContain("minimumReleaseAge: 1440");
    expect(securityScript).toContain("blockExoticSubdeps: true");
    expect(securityScript).toContain("onlyBuiltDependencies:");
    expect(securityScript).toContain("pnpm install --frozen-lockfile");
    expect(securityScript).not.toContain("pnpm licenses list --json");
    expect(securityScript).not.toContain("cargo metadata");
    expect(securityScript).toContain(
      "src/infrastructure/browser/useImportImage.ts",
    );
    expect(securityScript).toContain("ProjectImportSchema.safeParse(parsed)");
    expect(securityScript).toContain("pubkey");
    expect(securityScript).toContain('endpoint.startsWith("https://")');
    expect(securityScript).toContain("freezePrototype");
    expect(securityScript).toContain("devCsp");
    expect(securityScript).toContain("no-eval");

    expect(tauriConfig).toContain('"freezePrototype": true');
    expect(tauriConfig).toContain('"csp": {');
    expect(tauriConfig).toContain('"devCsp": {');
    expect(tauriConfig).toContain('"default-src"');
    expect(tauriConfig).toContain('"connect-src"');
    expect(tauriConfig).toContain('"img-src"');
    expect(tauriConfig).toContain('"style-src"');
    expect(tauriConfig).toContain('"X-Content-Type-Options": "nosniff"');

    expect(eslintConfig).toContain('"no-eval": "error"');
    expect(eslintConfig).toContain('"no-implied-eval": "error"');
    expect(eslintConfig).toContain('"no-new-func": "error"');
    expect(eslintConfig).toContain('"no-script-url": "error"');
    expect(eslintConfig).toContain("dangerouslySetInnerHTML");
    expect(eslintConfig).toContain("insertAdjacentHTML");
    expect(eslintConfig).toContain("innerHTML");

    expect(ciWorkflow).toContain("pnpm verify:cve");
    expect(flakeNix).toContain("cargo-audit");
    expect(cveScript).toContain('"pnpm"');
    expect(cveScript).toContain('"audit"');
    expect(cveScript).toContain('"--audit-level=moderate"');
    expect(cveScript).toContain('"cargo"');
    expect(cveScript).toContain('"src-tauri/Cargo.lock"');
    expect(cveBaseline).toContain("GHSA-5c6j-r48x-rmvq");
  });
});
