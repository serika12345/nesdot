import { ESLint, type Linter } from "eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const lintedFilePath =
  "src/presentation/components/characterMode/core/CharacterMode/index.tsx";
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
): Promise<ReadonlyArray<Pick<Linter.LintMessage, "ruleId" | "message">>> => {
  const messages = await lintSnippet(source);

  return messages
    .filter((message) =>
      [
        "no-restricted-syntax",
        "no-eval",
        "no-implied-eval",
        "no-new-func",
        "no-script-url",
      ].includes(message.ruleId ?? ""),
    )
    .map((message) => ({
      ruleId: message.ruleId,
      message: message.message,
    }));
};

describe("security API restrictions", () => {
  test(
    "allows explicit text-based DOM updates",
    async () => {
      await expect(
        getRuleMessages(`
        export const Example = (element: HTMLElement) => {
          element.textContent = "safe";

          return <div>safe</div>;
        };
      `),
      ).resolves.toStrictEqual([]);
    },
    lintTestTimeoutMs,
  );

  test(
    "rejects raw HTML injection APIs",
    async () => {
      await expect(
        getRuleMessages(`
        export const Example = (element: HTMLElement) => {
          element.innerHTML = "<p>x</p>";
          element.insertAdjacentHTML("beforeend", "<p>y</p>");
          document.write("<p>z</p>");

          const markup = { __html: "<p>danger</p>" };

          return <div dangerouslySetInnerHTML={markup} />;
        };
      `),
      ).resolves.toStrictEqual([
        {
          ruleId: "no-restricted-syntax",
          message:
            "Do not assign raw HTML with `innerHTML` or `outerHTML`. Render elements explicitly or sanitize at a dedicated boundary.",
        },
        {
          ruleId: "no-restricted-syntax",
          message:
            "Do not inject raw HTML with `insertAdjacentHTML`. Render elements explicitly or sanitize at a dedicated boundary.",
        },
        {
          ruleId: "no-restricted-syntax",
          message:
            "Do not use `document.write`. Use explicit DOM construction instead.",
        },
        {
          ruleId: "no-restricted-syntax",
          message:
            "Do not use `dangerouslySetInnerHTML`. Render trusted elements explicitly instead.",
        },
      ]);
    },
    lintTestTimeoutMs,
  );

  test(
    "rejects dynamic code execution APIs",
    async () => {
      await expect(
        getRuleMessages(`
        export const Example = () => {
          eval("2 + 2");
          const dynamicFunction = new Function("return 1");
          window.setTimeout("alert('x')", 1000);
          window.setInterval("alert('y')", 1000);
          window.location.href = "javascript:alert('z')";

          return dynamicFunction();
        };
      `),
      ).resolves.toStrictEqual([
        {
          ruleId: "no-eval",
          message: "eval can be harmful.",
        },
        {
          ruleId: "no-new-func",
          message: "The Function constructor is eval.",
        },
        {
          ruleId: "no-implied-eval",
          message:
            "Implied eval. Consider passing a function instead of a string.",
        },
        {
          ruleId: "no-implied-eval",
          message:
            "Implied eval. Consider passing a function instead of a string.",
        },
        {
          ruleId: "no-script-url",
          message: "Script URL is a form of eval.",
        },
      ]);
    },
    lintTestTimeoutMs,
  );
});
