import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const srcRoot = path.join(projectRoot, "src");
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

const getLineCount = (source: string): number => {
  if (source.length === 0) {
    return 0;
  }

  return source.split(/\r\n|\n|\r/u).length;
};

const toRelativeMetricLabel = ({ filePath, value }: TsxFileMetric): string =>
  `${path.relative(projectRoot, filePath)}:${value}`;

describe("tsx line-count discipline", () => {
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
