import { ESLint, type Linter } from "eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const lintedFilePath =
  "tests/repo/fixtures/no-jsx-data-attributes-rule-fixture.tsx";
const lintTestTimeoutMs = 15_000;
const eslint = new ESLint({
  cwd: projectRoot,
  overrideConfigFile: path.join(projectRoot, "eslint.config.js"),
});

const lintSnippet = async (
  source: string,
): Promise<ReadonlyArray<Linter.LintMessage>> => {
  const results = await eslint.lintText(source, {
    filePath: lintedFilePath,
  });

  return results.flatMap((result) => result.messages);
};

const getRuleMessages = async (
  source: string,
): Promise<ReadonlyArray<string>> => {
  const messages = await lintSnippet(source);

  return messages
    .filter(
      (message) =>
        message.ruleId === "ui-style-guidance/no-jsx-data-attributes",
    )
    .map((message) => message.message);
};

describe("ui-style-guidance/no-jsx-data-attributes", () => {
  test(
    "allows non-data JSX attributes",
    async () => {
      await expect(
        getRuleMessages(`
        export const Example = () => (
          <button aria-label="close" className="button" type="button" />
        );
      `),
      ).resolves.toStrictEqual([]);
    },
    lintTestTimeoutMs,
  );

  test(
    "rejects custom data attributes in JSX",
    async () => {
      await expect(
        getRuleMessages(`
        export const Example = () => (
          <div data-open="true" data-panel="library" />
        );
      `),
      ).resolves.toStrictEqual([
        "Do not use custom `data-*` attributes in JSX. Express UI state through className changes or semantic attributes instead.",
        "Do not use custom `data-*` attributes in JSX. Express UI state through className changes or semantic attributes instead.",
      ]);
    },
    lintTestTimeoutMs,
  );
});
