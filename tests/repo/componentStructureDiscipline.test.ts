import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const componentsRoot = path.join(projectRoot, "src/presentation/components");
const groupedComponentsRoots = [
  path.join(componentsRoot, "bgMode"),
  path.join(componentsRoot, "characterMode"),
  path.join(componentsRoot, "screenMode"),
  path.join(componentsRoot, "spriteMode"),
  path.join(componentsRoot, "common"),
];
const allowedFeatureRootDirectories: ReadonlyArray<string> = ["logic", "ui"];

type TsxFileMetric = Readonly<{
  filePath: string;
  value: number;
}>;

type DirectoryListing = Readonly<{
  directoryPath: string;
  entryNames: ReadonlyArray<string>;
}>;

const listTsxFiles = (directoryPath: string): ReadonlyArray<string> =>
  fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      return listTsxFiles(entryPath);
    }

    return entryPath.endsWith(".tsx") ? [entryPath] : [];
  });

const listFilesRecursively = (directoryPath: string): ReadonlyArray<string> =>
  fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      return listFilesRecursively(entryPath);
    }

    return [entryPath];
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

const listDirectDirectoryNames = (
  directoryPath: string,
): ReadonlyArray<string> =>
  fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() === false) {
      return [];
    }

    return [entry.name];
  });

const listDirectoriesRecursively = (
  directoryPath: string,
): ReadonlyArray<string> =>
  fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() === false) {
      return [];
    }

    const entryPath = path.join(directoryPath, entry.name);

    return [entryPath, ...listDirectoriesRecursively(entryPath)];
  });

const matchesAllowedFeatureRootDirectories = (
  directoryNames: ReadonlyArray<string>,
): boolean => {
  const sortedDirectoryNames = [...directoryNames].sort((left, right) =>
    left.localeCompare(right),
  );

  return (
    sortedDirectoryNames.length === allowedFeatureRootDirectories.length &&
    sortedDirectoryNames.every(
      (directoryName, index) =>
        directoryName === allowedFeatureRootDirectories[index],
    )
  );
};

const isPrimitivesCollectionFile = (filePath: string): boolean =>
  /Primitives\.tsx$/u.test(filePath);

const isLegacyComponentFilename = (filePath: string): boolean =>
  /(?:^|[\\/])(?:index\.tsx|index\.test\.tsx?|styles\.ts|shared\.tsx|types\.ts)$/u.test(
    filePath,
  );

const listUiConceptDirectoryListings = (): ReadonlyArray<DirectoryListing> =>
  groupedComponentsRoots.flatMap((directoryPath) => {
    const uiRootPath = path.join(directoryPath, "ui");

    return listDirectDirectoryNames(uiRootPath).map((entryName) => ({
      directoryPath: path.join(uiRootPath, entryName),
      entryNames: listDirectDirectoryNames(path.join(uiRootPath, entryName)),
    }));
  });

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
  it("keeps each feature root split into ui and logic directories", () => {
    const offenders = groupedComponentsRoots
      .map((directoryPath) => ({
        directoryPath,
        entries: listDirectDirectoryNames(directoryPath),
      }))
      .filter(
        ({ entries }) =>
          matchesAllowedFeatureRootDirectories(entries) === false,
      )
      .map(
        ({ directoryPath, entries }) =>
          `${path.relative(projectRoot, directoryPath)}:${entries.join(",")}`,
      );

    expect(offenders).toStrictEqual([]);
  });

  it("keeps major component directories free of direct TSX files", () => {
    const offenders = groupedComponentsRoots
      .flatMap(listDirectTsxFiles)
      .map((filePath) => path.relative(projectRoot, filePath));

    expect(offenders).toStrictEqual([]);
  });

  it("keeps presentation component directories free of empty folders", () => {
    const offenders = listDirectoriesRecursively(componentsRoot)
      .filter((directoryPath) => fs.readdirSync(directoryPath).length === 0)
      .map((directoryPath) => path.relative(projectRoot, directoryPath));

    expect(offenders).toStrictEqual([]);
  });

  it("keeps ui concept directories flat", () => {
    const offenders = listUiConceptDirectoryListings()
      .filter(({ entryNames }) => entryNames.length > 0)
      .map(({ directoryPath, entryNames }) => {
        const relativeDirectoryPath = path.relative(projectRoot, directoryPath);

        return `${relativeDirectoryPath}:${entryNames.join(",")}`;
      });

    expect(offenders).toStrictEqual([]);
  });

  it("avoids legacy component placeholder filenames", () => {
    const offenders = listFilesRecursively(componentsRoot)
      .filter(isLegacyComponentFilename)
      .map((filePath) => path.relative(projectRoot, filePath));

    expect(offenders).toStrictEqual([]);
  });

  it("avoids generic hooks folders under component logic", () => {
    const offenders = groupedComponentsRoots
      .map((directoryPath) => path.join(directoryPath, "logic"))
      .flatMap(listDirectoriesRecursively)
      .filter((directoryPath) => path.basename(directoryPath) === "hooks")
      .map((directoryPath) => path.relative(projectRoot, directoryPath));

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
