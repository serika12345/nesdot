import { ESLint, type Linter } from "eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const lintedFilePath = "tests/repo/fixtures/type-import-rule-fixture.tsx";
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
        message.ruleId === "@typescript-eslint/consistent-type-imports",
    )
    .map((message) => message.message);
};

describe("@typescript-eslint/consistent-type-imports", () => {
  test(
    "allows import type declarations and inline type specifiers",
    async () => {
      await expect(
        getRuleMessages(`
        import type { CSSProperties } from "react";
        import { type ReactNode, useState } from "react";

        type Props = {
          children: ReactNode;
          style: CSSProperties;
        };

        export const Example = ({ children, style }: Props) => {
          const [count] = useState(0);

          return (
            <div data-count={count} style={style}>
              {children}
            </div>
          );
        };
      `),
      ).resolves.toStrictEqual([]);
    },
    lintTestTimeoutMs,
  );

  test(
    "rejects type-only named imports without import type",
    async () => {
      await expect(
        getRuleMessages(`
        import { CSSProperties } from "react";

        type Props = {
          style: CSSProperties;
        };

        export const Example = ({ style }: Props) => <div style={style} />;
      `),
      ).resolves.toStrictEqual([
        "All imports in the declaration are only used as types. Use `import type`.",
      ]);
    },
    lintTestTimeoutMs,
  );

  test(
    "rejects mixed imports that omit inline type modifiers",
    async () => {
      await expect(
        getRuleMessages(`
        import { ReactNode, useState } from "react";

        type Props = {
          children: ReactNode;
        };

        export const Example = ({ children }: Props) => {
          const [count] = useState(0);

          return <div data-count={count}>{children}</div>;
        };
      `),
      ).resolves.toStrictEqual(['Imports "ReactNode" are only used as type.']);
    },
    lintTestTimeoutMs,
  );
});
