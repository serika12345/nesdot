/// <reference types="node" />

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readTextFile = (relativePath: string): string => {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
};

describe("editorconfig workflow", () => {
  test("defines shared editor defaults for the repository", () => {
    const editorConfig = readTextFile("../../.editorconfig");

    expect(editorConfig).toContain("root = true");
    expect(editorConfig).toContain("charset = utf-8");
    expect(editorConfig).toContain("end_of_line = lf");
    expect(editorConfig).toContain("insert_final_newline = true");
    expect(editorConfig).toContain("trim_trailing_whitespace = true");
    expect(editorConfig).toContain("indent_style = space");
    expect(editorConfig).toContain("indent_size = 2");
    expect(editorConfig).toContain("[*.md]");
    expect(editorConfig).toContain("trim_trailing_whitespace = false");
    expect(editorConfig).toContain("[*.rs]");
    expect(editorConfig).toContain("indent_size = 4");
  });

  test("recommends editorconfig support in VS Code", () => {
    const extensionsJson = readTextFile("../../.vscode/extensions.json");

    expect(extensionsJson).toContain('"editorconfig.editorconfig"');
  });
});
