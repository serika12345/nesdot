import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const srcRoot = path.join(projectRoot, "src");
const componentsRoot = path.join(projectRoot, "src/presentation/components");
const maxTsxLineCountExclusive = 1000;

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

const isLayoutPrimitivesFile = (filePath: string): boolean =>
  /LayoutPrimitives\.tsx$/u.test(filePath);

const countPublicComponentExports = (source: string): number => {
  const exportedConstCount = Array.from(
    source.matchAll(/^export const [A-Z][A-Za-z0-9_]*\b/gmu),
  ).length;
  const exportedFunctionCount = Array.from(
    source.matchAll(/^export function [A-Z][A-Za-z0-9_]*\b/gmu),
  ).length;

  return exportedConstCount + exportedFunctionCount;
};

const getLineCount = (source: string): number => {
  if (source.length === 0) {
    return 0;
  }

  return source.split(/\r\n|\n|\r/u).length;
};

const toRelativeMetricLabel = ({ filePath, value }: TsxFileMetric): string =>
  `${path.relative(projectRoot, filePath)}:${value}`;

describe("presentation component file discipline", () => {
  it("keeps each component file to one public component export", () => {
    const offenders = listTsxFiles(componentsRoot)
      .filter((filePath) => isLayoutPrimitivesFile(filePath) === false)
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

  it("keeps all TSX files below 1000 lines", () => {
    const offenders = listTsxFiles(srcRoot)
      .map(
        (filePath): TsxFileMetric => ({
          filePath,
          value: getLineCount(fs.readFileSync(filePath, "utf8")),
        }),
      )
      .filter((metric) => metric.value >= maxTsxLineCountExclusive)
      .map(toRelativeMetricLabel);

    expect(offenders).toStrictEqual([]);
  });
});
