/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("security verification workflow", () => {
  test("defines a dedicated security verification script and includes it in verify", () => {
    const packageJson = readTextFile("../../package.json");

    expect(packageJson).toContain(
      '"verify:security": "node scripts/verify-security.mjs"',
    );
    expect(packageJson).toContain(
      '"verify": "pnpm format:check && pnpm lint && pnpm typecheck:safety && pnpm verify:security && pnpm test"',
    );
  });

  test("defines a VS Code task for targeted security verification", () => {
    const tasksJson = readTextFile("../../.vscode/tasks.json");

    expect(tasksJson).toContain('"Verify Security"');
    expect(tasksJson).toContain('"pnpm verify:security"');
  });

  test("documents the security verification gate", () => {
    const readme = readTextFile("../../README.md");
    const agentsInstructions = readTextFile("../../AGENTS.md");
    const safeCodingSkill = readTextFile(
      "../../.github/skills/nesdot-safe-coding/SKILL.md",
    );

    expect(readme).toContain("pnpm verify:security");
    expect(agentsInstructions).toContain("`pnpm verify:security`");
    expect(safeCodingSkill).toContain("pnpm verify:security");
  });

  test("keeps security verification focused on supply chain, updater, and JSON boundaries", () => {
    const securityScript = readTextFile("../../scripts/verify-security.mjs");

    expect(securityScript).toContain("strictDepBuilds: true");
    expect(securityScript).toContain("minimumReleaseAge: 1440");
    expect(securityScript).toContain("blockExoticSubdeps: true");
    expect(securityScript).toContain("onlyBuiltDependencies:");
    expect(securityScript).toContain("pnpm install --frozen-lockfile");
    expect(securityScript).toContain(
      "src/infrastructure/browser/useImportImage.ts",
    );
    expect(securityScript).toContain("ProjectImportSchema.safeParse(parsed)");
    expect(securityScript).toContain("pubkey");
    expect(securityScript).toContain('endpoint.startsWith("https://")');
  });
});
