/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";
import {
  findViolationLines,
  logPredicate,
} from "../../scripts/verify-tauri-csp-core.mjs";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("tauri CSP runtime verification", () => {
  test("flags representative runtime CSP violations and console errors", () => {
    const inlineStyleViolationLine =
      "WebKit WebContent[12345:67890] Refused to apply inline style because it violates the following Content Security Policy directive: \"style-src 'self'\".";
    const consoleErrorLine =
      "nesdot[12345:67890] console-error [Error] layout bootstrap failed";
    const benignNoiseLine =
      "sandbox csp bootstrap look-up failed while collecting system logs";

    expect(
      findViolationLines([
        inlineStyleViolationLine,
        consoleErrorLine,
        benignNoiseLine,
      ]),
    ).toStrictEqual([inlineStyleViolationLine, consoleErrorLine]);
  });

  test("keeps a dedicated macOS runtime verifier wired through package scripts", () => {
    const packageJson = readTextFile("../../package.json");
    const verifierScript = readTextFile("../../scripts/verify-tauri-csp.mjs");
    const supportedVerifierScript = readTextFile(
      "../../scripts/verify-tauri-csp-if-supported.mjs",
    );
    const mainSource = readTextFile("../../src/main.tsx");
    const tauriRustSource = readTextFile("../../src-tauri/src/lib.rs");

    expect(packageJson).toContain(
      '"verify:tauri:csp": "node scripts/verify-tauri-csp.mjs"',
    );
    expect(packageJson).toContain(
      '"verify:tauri:csp:if-supported": "node scripts/verify-tauri-csp-if-supported.mjs"',
    );
    expect(verifierScript).toContain(
      '"tauri", "build", "--debug", "--no-bundle"',
    );
    expect(supportedVerifierScript).toContain('process.platform !== "darwin"');
    expect(supportedVerifierScript).toContain("verify-tauri-csp.mjs");
    expect(verifierScript).toContain("src-tauri/target/debug/nesdot");
    expect(verifierScript).toContain(
      "NESDOT_VERIFY_TAURI_CSP_DIAGNOSTICS_FILE",
    );
    expect(verifierScript).toContain("NESDOT_VERIFY_TAURI_CSP_SELF_TEST");
    expect(logPredicate).toContain('(process == "nesdot")');
    expect(logPredicate).toContain("Content Security");
    expect(logPredicate).toContain("console");
    expect(mainSource).toContain(
      '"./infrastructure/browser/tauriRuntimeDiagnostics"',
    );
    expect(tauriRustSource).toContain("get_runtime_diagnostics_config");
    expect(tauriRustSource).toContain("record_runtime_diagnostic");
  });

  test("documents the macOS runtime verifier for release checks", () => {
    const readme = readTextFile("../../README.md");
    const releaseChecklist = readTextFile("../../docs/release-checklist.md");

    expect(readme).toContain("pnpm verify:tauri:csp");
    expect(readme).toContain("pnpm tauri build --debug --no-bundle");
    expect(releaseChecklist).toContain("pnpm verify:tauri:csp");
  });
});
