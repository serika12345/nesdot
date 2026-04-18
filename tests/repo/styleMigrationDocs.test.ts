/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("style migration docs", () => {
  test("documents the Emotion removal implementation plan", () => {
    const plan = readTextFile("../../docs/emotion-removal-migration-plan.md");

    expect(plan).toContain("# Emotion Removal Migration Plan");
    expect(plan).toContain("Remove the Emotion runtime");
    expect(plan).toContain("Phase 4: Remove Emotion Entry Points");
    expect(plan).toContain("pnpm verify:tauri:csp");
    expect(plan).toContain("src/main.tsx");
  });

  test("documents the static CSS architecture and future import boundary direction", () => {
    const architecture = readTextFile("../../docs/static-css-architecture.md");

    expect(architecture).toContain("# Static CSS Architecture");
    expect(architecture).toContain("CSS Modules");
    expect(architecture).toContain(
      "import-attributes-based CSS loading localized to component boundaries",
    );
    expect(architecture).toContain("should not grow back into");
    expect(architecture).toContain("Typed Runtime Geometry");
  });

  test("links the migration docs from the README and prep notes", () => {
    const readme = readTextFile("../../README.md");
    const prep = readTextFile("../../docs/plain-mui-migration-prep.md");

    expect(readme).toContain("docs/emotion-removal-migration-plan.md");
    expect(readme).toContain("docs/static-css-architecture.md");
    expect(prep).toContain("docs/emotion-removal-migration-plan.md");
    expect(prep).toContain("docs/static-css-architecture.md");
  });
});
