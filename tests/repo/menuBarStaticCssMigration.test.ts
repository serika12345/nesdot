/// <reference types="node" />

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const menuDirectoryPath = path.join(
  projectRoot,
  "src/presentation/components/common/ui/menu",
);

const readProjectFile = (relativePath: string): string => {
  return readFileSync(path.join(projectRoot, relativePath), "utf8");
};

const listMenuFileNames = (): ReadonlyArray<string> => {
  return readdirSync(menuDirectoryPath);
};

describe("menu bar static CSS migration", () => {
  test("keeps the menu bar folder free of styled wrappers", () => {
    const fileNames = listMenuFileNames();
    const styledOffenders = fileNames.flatMap((fileName) => {
      const filePath = path.join(menuDirectoryPath, fileName);

      if (statSync(filePath).isFile() === false) {
        return [];
      }

      const source = readFileSync(filePath, "utf8");

      return source.includes("styled(") ? [fileName] : [];
    });

    expect(styledOffenders).toStrictEqual([]);
    expect(fileNames).toContain("MenuBar.module.css");
    expect(fileNames).not.toContain("MenuBarStyle.ts");
  });

  test("imports the menu bar CSS module directly", () => {
    const menuBarSource = readProjectFile(
      "src/presentation/components/common/ui/menu/MenuBar.tsx",
    );

    expect(menuBarSource).toContain("./MenuBar.module.css");
    expect(menuBarSource).not.toContain("./MenuBarStyle");
    expect(menuBarSource).not.toContain("@mui/material");
    expect(menuBarSource).not.toContain("useTheme");
  });
});
