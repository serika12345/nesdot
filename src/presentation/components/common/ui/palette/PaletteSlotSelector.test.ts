import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const cssModulePath = path.join(
  currentDirectory,
  "PaletteSlotSelector.module.css",
);

describe("PaletteSlotSelector styles", () => {
  it("uses the resolved NES color variable for visible swatches", () => {
    const source = fs.readFileSync(cssModulePath, "utf8");

    expect(source).toContain("background-color: var(--nes-color);");
  });
});
