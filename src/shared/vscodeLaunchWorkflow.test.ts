/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("vscode launch workflow", () => {
  test("uses tasks to start the frontend and Tauri launch flows", () => {
    const launchJson = readTextFile("../../.vscode/launch.json");

    expect(launchJson).toContain('"Launch Frontend (Chrome, 1420)"');
    expect(launchJson).toContain('"preLaunchTask": "Run Frontend Dev Server"');
    expect(launchJson).toContain('"Attach Frontend (Chrome, 1420)"');
    expect(launchJson).toContain('"Launch Tauri Desktop"');
    expect(launchJson).toContain('"preLaunchTask": "Run Tauri Dev"');
    expect(launchJson).toContain('"Launch Tauri Desktop + Attach Frontend"');
    expect(launchJson).toContain('"compounds"');
    expect(launchJson).not.toContain('"command": "pnpm start"');
  });
});
