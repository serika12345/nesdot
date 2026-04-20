/// <reference types="node" />

import { existsSync, readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

const hasFile = (relativePath: string): boolean => {
  return existsSync(new URL(relativePath, import.meta.url));
};

describe("README product focus", () => {
  test("keeps the top-level README focused on the product and screenshots", () => {
    const readme = readTextFile("../../README.md");

    expect(readme).toContain("## スクリーンショット");
    expect(readme).toContain("## できること");
    expect(readme).toContain("## 再現している NES の制約");
    expect(readme).toContain("docs/assets/readme/sprite-mode.png");
    expect(readme).toContain("docs/assets/readme/character-mode.png");
    expect(readme).toContain("docs/assets/readme/screen-mode.png");
    expect(readme).toContain("docs/development-manual.md");
    expect(readme).toContain("docs/release-checklist.md");

    expect(readme).not.toContain("## 開発コマンド");
    expect(readme).not.toContain("## WSL での開発");
    expect(readme).not.toContain("pnpm verify:ci");
    expect(readme).not.toContain("pnpm verify:security");
    expect(readme).not.toContain("pnpm verify:tauri:csp");
    expect(readme).not.toContain("pnpm doctor:wsl");
    expect(readme).not.toContain("pnpm nix:check-pnpm-deps-hash");
    expect(readme).not.toContain("nix develop -c zsh -lc");
  });

  test("commits the README screenshot assets", () => {
    expect(hasFile("../../docs/assets/readme/sprite-mode.png")).toBe(true);
    expect(hasFile("../../docs/assets/readme/character-mode.png")).toBe(true);
    expect(hasFile("../../docs/assets/readme/screen-mode.png")).toBe(true);
  });
});
