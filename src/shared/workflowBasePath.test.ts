import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("deployment workflow base paths", () => {
  test("sets an explicit pages base path in the pages workflow", () => {
    const workflow = readTextFile("../../.github/workflows/deploy-pages.yml");

    expect(workflow).toContain(
      "VITE_BASE_PATH: /${{ github.event.repository.name }}/",
    );
  });

  test("sets an explicit root base path in the desktop release workflow", () => {
    const workflow = readTextFile(
      "../../.github/workflows/release-tauri-desktop.yml",
    );

    expect(workflow).toContain("VITE_BASE_PATH: /");
  });
});
