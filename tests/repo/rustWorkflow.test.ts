/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("rust workflow", () => {
  test("defines rust verification scripts", () => {
    const packageJson = readTextFile("../../package.json");

    expect(packageJson).toContain(
      '"rust:fmt": "cargo fmt --manifest-path src-tauri/Cargo.toml"',
    );
    expect(packageJson).toContain(
      '"rust:fmt:check": "cargo fmt --manifest-path src-tauri/Cargo.toml --check"',
    );
    expect(packageJson).toContain(
      '"rust:check": "cargo check --manifest-path src-tauri/Cargo.toml"',
    );
    expect(packageJson).toContain(
      '"rust:lint": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings"',
    );
    expect(packageJson).toContain(
      '"rust:test": "cargo test --manifest-path src-tauri/Cargo.toml"',
    );
    expect(packageJson).toContain(
      '"verify:rust": "pnpm rust:fmt:check && pnpm rust:check && pnpm rust:lint && pnpm rust:test"',
    );
  });

  test("runs rust verification in CI", () => {
    const ciWorkflow = readTextFile("../../.github/workflows/ci.yml");

    expect(ciWorkflow).toContain("pnpm verify:rust");
  });

  test("runs rust verification before desktop releases", () => {
    const releaseWorkflow = readTextFile(
      "../../.github/workflows/release-tauri-desktop.yml",
    );

    expect(releaseWorkflow).toContain("pnpm verify:rust");
  });

  test("documents rust verification in AGENTS instructions", () => {
    const agentsInstructions = readTextFile("../../AGENTS.md");

    expect(agentsInstructions).toContain("`pnpm verify:rust`");
  });

  test("documents rust verification in the safe coding skill", () => {
    const safeCodingSkill = readTextFile(
      "../../.github/skills/nesdot-safe-coding/SKILL.md",
    );

    expect(safeCodingSkill).toContain("pnpm verify:rust");
  });
});
