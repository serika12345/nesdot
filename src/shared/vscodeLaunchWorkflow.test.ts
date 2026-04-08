/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("vscode launch workflow", () => {
  test("uses tasks to start the frontend and Rust debug launch flows", () => {
    const launchJson = readTextFile("../../.vscode/launch.json");

    expect(launchJson).toContain('"Launch Frontend (Chrome, 1420)"');
    expect(launchJson).toContain('"preLaunchTask": "Run Frontend Dev Server"');
    expect(launchJson).toContain('"Attach Frontend (Chrome, 1420)"');
    expect(launchJson).toContain('"Launch Tauri Desktop"');
    expect(launchJson).toContain('"type": "lldb"');
    expect(launchJson).toContain(
      '"program": "${workspaceFolder}/src-tauri/target/debug/nesdot"',
    );
    expect(launchJson).toContain('"preLaunchTask": "Prepare Tauri Rust Debug"');
    expect(launchJson).toContain('"Launch Tauri Desktop + Attach Frontend"');
    expect(launchJson).toContain('"compounds"');
    expect(launchJson).not.toContain('"command": "pnpm start"');
  });

  test("recommends the Rust debugger extension for VS Code", () => {
    const extensionsJson = readTextFile("../../.vscode/extensions.json");

    expect(extensionsJson).toContain('"rust-lang.rust-analyzer"');
    expect(extensionsJson).toContain('"vadimcn.vscode-lldb"');
  });

  test("configures CodeLLDB to use the system macOS debugserver path", () => {
    const settingsJson = readTextFile("../../.vscode/settings.json");

    expect(settingsJson).toContain('"lldb.adapterEnv": {');
    expect(settingsJson).toContain('"LLDB_DEBUGSERVER_PATH"');
    expect(settingsJson).toContain(
      '"/Library/Developer/CommandLineTools/Library/PrivateFrameworks/LLDB.framework/Versions/A/Resources/debugserver"',
    );
  });
});
