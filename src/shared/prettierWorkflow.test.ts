import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

const countOccurrences = (source: string, pattern: string): number => {
  return source.split(pattern).length - 1;
};

describe("prettier workflow", () => {
  test("defines prettier scripts and requires format checks in verify", () => {
    const packageJson = readTextFile("../../package.json");

    expect(packageJson).toContain('"format": "prettier --write ."');
    expect(packageJson).toContain('"format:check": "prettier --check ."');
    expect(packageJson).toContain(
      '"verify": "pnpm format:check && pnpm lint && pnpm typecheck:safety && pnpm test"',
    );
  });

  test("runs verify in CI", () => {
    const ciWorkflow = readTextFile("../../.github/workflows/ci.yml");

    expect(ciWorkflow).toContain("pnpm verify");
  });

  test("requires format checks in AGENTS verification steps", () => {
    const agentsInstructions = readTextFile("../../AGENTS.md");

    expect(countOccurrences(agentsInstructions, "`pnpm format:check`")).toBe(5);
  });

  test("requires format checks in the safe coding skill", () => {
    const safeCodingSkill = readTextFile(
      "../../.github/skills/nesdot-safe-coding/SKILL.md",
    );

    expect(safeCodingSkill).toContain("- pnpm format:check");
  });
});
