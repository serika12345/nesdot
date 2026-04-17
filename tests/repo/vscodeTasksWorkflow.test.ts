/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("vscode tasks workflow", () => {
  test("runs project tasks inside the Nix dev shell", () => {
    const tasksJson = readTextFile("../../.vscode/tasks.json");

    expect(tasksJson).toContain('"Run Frontend Dev Server"');
    expect(tasksJson).toContain('"Run Tauri Dev"');
    expect(tasksJson).toContain('"command": "nix"');
    expect(tasksJson).toContain('"develop"');
    expect(tasksJson).toContain('"-lc"');
    expect(tasksJson).toContain('"pnpm dev"');
    expect(tasksJson).toContain('"pnpm start"');
  });

  test("defines a background Tauri task for launch integration", () => {
    const tasksJson = readTextFile("../../.vscode/tasks.json");

    expect(tasksJson).toContain('"Run Tauri Dev"');
    expect(tasksJson).toContain('"isBackground": true');
    expect(tasksJson).toContain('"beginsPattern": "ready in"');
    expect(tasksJson).toContain('"endsPattern": "ready in"');
  });

  test("defines tasks that prepare the Rust debug session inside the Nix dev shell", () => {
    const tasksJson = readTextFile("../../.vscode/tasks.json");

    expect(tasksJson).toContain('"Build Tauri Debug Binary"');
    expect(tasksJson).toContain('"Prepare Tauri Rust Debug"');
    expect(tasksJson).toContain(
      '"cargo build --manifest-path src-tauri/Cargo.toml"',
    );
    expect(tasksJson).toContain('"Run Frontend Dev Server"');
  });

  test("defines VS Code tasks for the main verification gates", () => {
    const tasksJson = readTextFile("../../.vscode/tasks.json");

    expect(tasksJson).toContain('"Verify"');
    expect(tasksJson).toContain('"Verify Licenses"');
    expect(tasksJson).toContain('"Verify UI"');
    expect(tasksJson).toContain('"Verify Full"');
    expect(tasksJson).toContain('"Verify Rust"');
    expect(tasksJson).toContain('"Run Unit Tests"');
    expect(tasksJson).toContain('"Run Console E2E"');
    expect(tasksJson).toContain('"Run Full E2E"');
    expect(tasksJson).toContain('"Format Check"');
    expect(tasksJson).toContain('"pnpm verify"');
    expect(tasksJson).toContain('"pnpm verify:licenses"');
    expect(tasksJson).toContain('"pnpm verify:ui"');
    expect(tasksJson).toContain('"pnpm verify:full"');
    expect(tasksJson).toContain('"pnpm verify:rust"');
    expect(tasksJson).toContain('"pnpm test"');
    expect(tasksJson).toContain('"pnpm test:e2e:console"');
    expect(tasksJson).toContain('"pnpm test:e2e"');
    expect(tasksJson).toContain('"pnpm format:check"');
  });
});
