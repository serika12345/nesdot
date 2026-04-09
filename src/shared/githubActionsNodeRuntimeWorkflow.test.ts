/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

const workflowPaths = Object.freeze([
  "../../.github/workflows/ci.yml",
  "../../.github/workflows/deploy-pages.yml",
  "../../.github/workflows/release-tauri-desktop.yml",
]);

describe("GitHub Actions JavaScript runtime", () => {
  test.each(workflowPaths)(
    "opts into Node 24 for JavaScript actions in %s",
    (relativePath) => {
      const workflow = readTextFile(relativePath);

      expect(workflow).toContain('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"');
    },
  );
});
