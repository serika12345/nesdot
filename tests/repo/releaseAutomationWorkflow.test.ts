/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("release automation workflow", () => {
  test("releases from main after synchronizing version metadata", () => {
    const releaseAutomation = readTextFile(
      "../../scripts/release-automation.mjs",
    );

    expect(releaseAutomation).toContain('flakeNix: "flake.nix"');
    expect(releaseAutomation).toContain('cargoLock: "src-tauri/Cargo.lock"');
    expect(releaseAutomation).toContain(
      "--branch=main              Release branch. Default: main",
    );
    expect(releaseAutomation).toContain(
      'getOptionValue(normalizedArgs, "branch") ?? "main"',
    );
    expect(releaseAutomation).toContain(
      "Release automation must run from ${branchName}. Current branch: ${currentBranch}",
    );
    expect(releaseAutomation).toContain(
      "Dry run requires ${branchName} to match ${remoteName}/${branchName}. Run git pull --ff-only first.",
    );
    expect(releaseAutomation).toContain(
      "Release versions must already be aligned across package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml, and src-tauri/Cargo.lock",
    );
    expect(releaseAutomation).toContain(
      'run(["git", "pull", "--ff-only", remoteName, branchName]);',
    );
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
    expect(releaseAutomation).toContain(
      'run(["git", "commit", "-m", `chore: release ${tagName}`]);',
    );
    expect(releaseAutomation).toContain(
      'run(["git", "push", remoteName, branchName]);',
    );
    expect(releaseAutomation).toContain(
      'run(["git", "push", remoteName, tagName]);',
    );
    expect(releaseAutomation).toContain("RELEASE_FILES.flakeNix,");
    expect(releaseAutomation).not.toContain("--source=");
    expect(releaseAutomation).not.toContain("--target=");
    expect(releaseAutomation).not.toContain('run(["git", "merge"');
  });
});
