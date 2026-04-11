import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const componentsRoot = path.join(projectRoot, "src/presentation/components");
const groupedComponentsRoots = [
  path.join(componentsRoot, "characterMode"),
  path.join(componentsRoot, "screenMode"),
  path.join(componentsRoot, "spriteMode"),
  path.join(componentsRoot, "common"),
];

type TsxFileMetric = Readonly<{
  filePath: string;
  value: number;
}>;

const listTsxFiles = (directoryPath: string): ReadonlyArray<string> =>
  fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      return listTsxFiles(entryPath);
    }

    return entryPath.endsWith(".tsx") ? [entryPath] : [];
  });

const listDirectTsxFiles = (directoryPath: string): ReadonlyArray<string> =>
  fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isFile() === false) {
      return [];
    }

    return entry.name.endsWith(".tsx")
      ? [path.join(directoryPath, entry.name)]
      : [];
  });

const isPrimitivesCollectionFile = (filePath: string): boolean =>
  /Primitives(?:[\\/]index)?\.tsx$/u.test(filePath);

const countPublicComponentExports = (source: string): number => {
  const exportedConstCount = Array.from(
    source.matchAll(/^export const [A-Z][A-Za-z0-9_]*\b/gmu),
  ).length;
  const exportedFunctionCount = Array.from(
    source.matchAll(/^export function [A-Z][A-Za-z0-9_]*\b/gmu),
  ).length;

  return exportedConstCount + exportedFunctionCount;
};

const toRelativeMetricLabel = ({ filePath, value }: TsxFileMetric): string =>
  `${path.relative(projectRoot, filePath)}:${value}`;

describe("presentation component file discipline", () => {
  it("keeps major component directories free of direct TSX files", () => {
    const offenders = groupedComponentsRoots
      .flatMap(listDirectTsxFiles)
      .map((filePath) => path.relative(projectRoot, filePath));

    expect(offenders).toStrictEqual([]);
  });

  it("keeps each component file to one public component export", () => {
    const offenders = listTsxFiles(componentsRoot)
      .filter((filePath) => isPrimitivesCollectionFile(filePath) === false)
      .map(
        (filePath): TsxFileMetric => ({
          filePath,
          value: countPublicComponentExports(fs.readFileSync(filePath, "utf8")),
        }),
      )
      .filter((metric) => metric.value !== 1)
      .map(toRelativeMetricLabel);

    expect(offenders).toStrictEqual([]);
  });

  it("allows multiple public exports only in *Primitives files", () => {
    const offenders = listTsxFiles(componentsRoot)
      .map(
        (filePath): TsxFileMetric => ({
          filePath,
          value: countPublicComponentExports(fs.readFileSync(filePath, "utf8")),
        }),
      )
      .filter((metric) => metric.value > 1)
      .filter((metric) => isPrimitivesCollectionFile(metric.filePath) === false)
      .map(toRelativeMetricLabel);

    expect(offenders).toStrictEqual([]);
  });

  it("keeps *Primitives files as named collection modules", () => {
    const offenders = listTsxFiles(componentsRoot)
      .filter((filePath) => isPrimitivesCollectionFile(filePath) === true)
      .map(
        (filePath): TsxFileMetric => ({
          filePath,
          value: countPublicComponentExports(fs.readFileSync(filePath, "utf8")),
        }),
      )
      .filter((metric) => metric.value < 2)
      .map(toRelativeMetricLabel);

    expect(offenders).toStrictEqual([]);
  });
});
