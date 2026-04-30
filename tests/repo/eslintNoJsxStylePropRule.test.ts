import { ESLint, type Linter } from "eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const lintedFilePath = "tests/repo/fixtures/no-jsx-style-prop-rule-fixture.tsx";
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
      (message) => message.ruleId === "ui-style-guidance/no-jsx-style-prop",
    )
    .map((message) => message.message);
};

describe("ui-style-guidance/no-jsx-style-prop", () => {
  test(
    "allows semantic and class-based JSX props",
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
    "rejects JSX style props",
    async () => {
      await expect(
        getRuleMessages(`
        export const Example = () => (
          <div style={{ width: "100%" }} />
        );
      `),
      ).resolves.toStrictEqual([
        "Do not use the JSX `style` prop. Express styling through shared components, CSS Modules, semantic props, or validated runtime geometry boundaries instead.",
      ]);
    },
    lintTestTimeoutMs,
  );
});
