/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("GitHub Actions JavaScript runtime", () => {
  test("uses a Node 24 compatible checkout action in CI", () => {
    const workflow = readTextFile("../../.github/workflows/ci.yml");

    expect(workflow).toContain("actions/checkout@v6");
    expect(workflow).not.toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24");
  });

  test("uses Node 24 compatible actions in PR safety checks", () => {
    const workflow = readTextFile("../../.github/workflows/pr-safety.yml");

    expect(workflow).toContain("actions/checkout@v6");
    expect(workflow).toContain("actions/setup-node@v6");
    expect(workflow).toContain('node-version: "24"');
    expect(workflow).not.toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24");
  });

  test("uses Node 24 compatible pages actions", () => {
    const workflow = readTextFile("../../.github/workflows/deploy-pages.yml");

    expect(workflow).toContain("actions/checkout@v6");
    expect(workflow).toContain("actions/configure-pages@v6");
    expect(workflow).toContain("actions/upload-artifact@v7");
    expect(workflow).toContain("name: github-pages");
    expect(workflow).toContain("$RUNNER_TEMP/artifact.tar");
    expect(workflow).toContain("--hard-dereference");
    expect(workflow).toContain("actions/deploy-pages@v5");
    expect(workflow).not.toContain("github-pages.tar.gz");
    expect(workflow).not.toContain("actions/upload-pages-artifact");
    expect(workflow).not.toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24");
  });

  test("uses Node 24 compatible release actions", () => {
    const workflow = readTextFile(
      "../../.github/workflows/release-tauri-desktop.yml",
    );

    expect(workflow).toContain("actions/checkout@v6");
    expect(workflow).toContain("actions/setup-node@v6");
    expect(workflow).not.toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24");
  });
});
