/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("style architecture docs", () => {
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

  test("links the static CSS architecture from the development manual", () => {
    const manual = readTextFile("../../docs/development-manual.md");

    expect(manual).toContain("docs/static-css-architecture.md");
  });
});
