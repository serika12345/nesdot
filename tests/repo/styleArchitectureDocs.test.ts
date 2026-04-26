/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("style architecture docs", () => {
  test("documents the current static styling status and runtime transition notes", () => {
    const status = readTextFile("../../docs/static-styling-status.md");
    const transition = readTextFile(
      "../../docs/style-runtime-transition-notes.md",
    );

    expect(status).toContain("# Static Styling Status");
    expect(status).toContain("static shared components");
    expect(status).toContain("CSS Modules");
    expect(transition).toContain("# Style Runtime Transition Notes");
    expect(transition).toContain("static CSS");
    expect(transition).toContain("runtime `<style>`");
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

  test("links the styling docs from the development manual", () => {
    const manual = readTextFile("../../docs/development-manual.md");

    expect(manual).toContain("docs/static-css-architecture.md");
    expect(manual).toContain("docs/static-styling-status.md");
    expect(manual).toContain("docs/style-runtime-transition-notes.md");
  });
});
