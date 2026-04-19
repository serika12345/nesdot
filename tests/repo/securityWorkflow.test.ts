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
      '"verify:tauri:csp": "node scripts/verify-tauri-csp.mjs"',
    );
    expect(packageJson).toContain(
      '"verify:tauri:csp:if-supported": "node scripts/verify-tauri-csp-if-supported.mjs"',
    );
    expect(packageJson).toContain(
      '"verify:cve": "node scripts/verify-cves.mjs"',
    );
    expect(packageJson).toContain(
      '"verify": "pnpm format:check && pnpm lint && pnpm typecheck:safety && pnpm verify:security && pnpm test"',
    );
    expect(packageJson).toContain("pnpm verify:tauri:csp:if-supported");
  });

  test("defines VS Code tasks for targeted security verification", () => {
    const tasksJson = readTextFile("../../.vscode/tasks.json");

    expect(tasksJson).toContain('"Verify Security"');
    expect(tasksJson).toContain('"Verify Tauri CSP"');
    expect(tasksJson).toContain('"Verify CVE"');
    expect(tasksJson).toContain('"pnpm verify:security"');
    expect(tasksJson).toContain('"pnpm verify:tauri:csp"');
    expect(tasksJson).toContain('"pnpm verify:cve"');
  });

  test("documents the security verification gate", () => {
    const readme = readTextFile("../../README.md");

    expect(readme).toContain("pnpm verify:security");
    expect(readme).toContain("pnpm verify:tauri:csp");
    expect(readme).toContain("pnpm verify:cve");
    expect(readme).toContain("baseline");
  });

  test("keeps security verification focused on supply chain, csp, updater, JSON boundaries, and CI wiring", () => {
    const securityScript = readTextFile("../../scripts/verify-security.mjs");
    const tauriConfigText = readTextFile("../../src-tauri/tauri.conf.json");
    const tauriConfig = JSON.parse(tauriConfigText);
    const eslintConfig = readTextFile("../../eslint.config.js");
    const ciWorkflow = readTextFile("../../.github/workflows/ci.yml");
    const flakeNix = readTextFile("../../flake.nix");
    const cveScript = readTextFile("../../scripts/verify-cves.mjs");
    const cveBaseline = readTextFile("../../scripts/cve-audit-baseline.json");
    const screenModeProjectActions = readTextFile(
      "../../src/presentation/components/screenMode/logic/useScreenModeProjectActions.ts",
    );
    const spriteModeProjectActions = readTextFile(
      "../../src/presentation/components/spriteMode/logic/spriteModeProjectActions.ts",
    );
    const mainSource = readTextFile("../../src/main.tsx");
    const indexHtml = readTextFile("../../src/index.html");

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
    expect(securityScript).toContain("style-src-elem");
    expect(securityScript).toContain("style-src-attr");
    expect(securityScript).toContain("checkInlineStyleAttributeBoundaries");
    expect(securityScript).toContain("checkTauriStyleNonceBootstrap");
    expect(securityScript).toContain("checkTauriStartupLazyBoundaries");
    expect(securityScript).toContain("cssText");

    expect(tauriConfig.app.security.freezePrototype).toBe(true);
    expect(tauriConfig.app.security.csp["default-src"]).toEqual(["'self'"]);
    expect(tauriConfig.app.security.csp["connect-src"]).toContain("'self'");
    expect(tauriConfig.app.security.csp["img-src"]).toEqual([
      "'self'",
      "blob:",
      "data:",
    ]);
    expect(tauriConfig.app.security.csp["style-src"]).toEqual(["'self'"]);
    expect(tauriConfig.app.security.csp).not.toHaveProperty("style-src-elem");
    expect(tauriConfig.app.security.csp["style-src-attr"]).toEqual(["'none'"]);
    expect(tauriConfig.app.security.devCsp["default-src"]).toEqual(
      tauriConfig.app.security.csp["default-src"],
    );
    expect(tauriConfig.app.security.devCsp["script-src"]).toEqual(
      tauriConfig.app.security.csp["script-src"],
    );
    expect(tauriConfig.app.security.devCsp["style-src"]).toEqual(["'self'"]);
    expect(tauriConfig.app.security.devCsp).not.toHaveProperty(
      "style-src-elem",
    );
    expect(tauriConfig.app.security.devCsp["style-src-attr"]).toEqual(
      tauriConfig.app.security.csp["style-src-attr"],
    );
    expect(tauriConfig.app.security.headers["X-Content-Type-Options"]).toBe(
      "nosniff",
    );

    expect(eslintConfig).toContain('"no-eval": "error"');
    expect(eslintConfig).toContain('"no-implied-eval": "error"');
    expect(eslintConfig).toContain('"no-new-func": "error"');
    expect(eslintConfig).toContain('"no-script-url": "error"');
    expect(eslintConfig).toContain("dangerouslySetInnerHTML");
    expect(eslintConfig).toContain("insertAdjacentHTML");
    expect(eslintConfig).toContain("innerHTML");

    expect(mainSource).toContain("CacheProvider");
    expect(mainSource).toContain("createCache");
    expect(mainSource).toContain("getCspNonce");
    expect(indexHtml).toContain('name="csp-nonce"');
    expect(indexHtml).toContain("__TAURI_STYLE_NONCE__");
    expect(screenModeProjectActions).not.toContain(
      'import useImportImage from "../../../../infrastructure/browser/useImportImage"',
    );
    expect(screenModeProjectActions).toContain(
      'import("../../../../infrastructure/browser/useImportImage")',
    );
    expect(spriteModeProjectActions).not.toContain(
      'import useImportImage from "../../../../infrastructure/browser/useImportImage"',
    );
    expect(spriteModeProjectActions).toContain(
      'import("../../../../infrastructure/browser/useImportImage")',
    );

    expect(ciWorkflow).toContain("pnpm verify:cve");
    expect(ciWorkflow).toContain("verify-macos-tauri-csp:");
    expect(ciWorkflow).toContain("pnpm verify:tauri:csp");
    expect(flakeNix).toContain("cargo-audit");
    expect(cveScript).toContain('"pnpm"');
    expect(cveScript).toContain('"audit"');
    expect(cveScript).toContain('"--audit-level=moderate"');
    expect(cveScript).toContain('"cargo"');
    expect(cveScript).toContain('"src-tauri/Cargo.lock"');
    expect(cveBaseline).toContain("GHSA-5c6j-r48x-rmvq");
  });
});
