/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("wsl workflow", () => {
  test("documents the recommended WSL workflow in the README", () => {
    const readme = readTextFile("../../README.md");

    expect(readme).toContain("## WSL での開発");
    expect(readme).toContain("Remote - WSL");
    expect(readme).toContain("/mnt/c");
    expect(readme).toContain("direnv allow");
    expect(readme).toContain("pnpm doctor:wsl");
    expect(readme).toContain("WSLg");
  });

  test("recommends the VS Code Remote - WSL extension", () => {
    const extensionsJson = readTextFile("../../.vscode/extensions.json");

    expect(extensionsJson).toContain('"ms-vscode-remote.remote-wsl"');
  });

  test("defines a WSL doctor script and VS Code task", () => {
    const packageJson = readTextFile("../../package.json");
    const tasksJson = readTextFile("../../.vscode/tasks.json");
    const doctorScript = readTextFile("../../scripts/doctor-wsl.mjs");

    expect(packageJson).toContain(
      '"doctor:wsl": "node scripts/doctor-wsl.mjs"',
    );
    expect(tasksJson).toContain('"Run WSL Doctor"');
    expect(tasksJson).toContain('"pnpm doctor:wsl"');
    expect(doctorScript).toContain("WSL_DISTRO_NAME");
    expect(doctorScript).toContain('"/mnt/"');
    expect(doctorScript).toContain("WAYLAND_DISPLAY");
  });

  test("adds Linux runtime dependencies that help WSL GUI and browser workflows", () => {
    const flakeNix = readTextFile("../../flake.nix");

    expect(flakeNix).toContain("dbus");
    expect(flakeNix).toContain("xdg-utils");
    expect(flakeNix).toContain("libxkbcommon");
    expect(flakeNix).toContain("wayland");
    expect(flakeNix).toContain("nspr");
    expect(flakeNix).toContain("nss");
    expect(flakeNix).toContain("xorg.libX11");
    expect(flakeNix).toContain("xorg.libXcursor");
    expect(flakeNix).toContain("xorg.libXi");
    expect(flakeNix).toContain("xorg.libXrandr");
    expect(flakeNix).toContain("xorg.libxcb");
  });
});
