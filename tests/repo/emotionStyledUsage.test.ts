/// <reference types="node" />

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const srcRoot = path.join(projectRoot, "src");

const listFilesRecursively = (directoryPath: string): ReadonlyArray<string> => {
  return readdirSync(directoryPath).flatMap((entryName) => {
    const entryPath = path.join(directoryPath, entryName);

    if (statSync(entryPath).isDirectory() === true) {
      return listFilesRecursively(entryPath);
    }

    return [entryPath];
  });
};

describe("emotion styled usage", () => {
  test("keeps application source free of styled wrappers", () => {
    const styledOffenders = listFilesRecursively(srcRoot)
      .filter((filePath) => /\.(ts|tsx)$/u.test(filePath))
      .filter((filePath) => readFileSync(filePath, "utf8").includes("styled("))
      .map((filePath) => path.relative(projectRoot, filePath));

    expect(styledOffenders).toStrictEqual([]);
  });
});
