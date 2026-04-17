import { ESLint, type Linter } from "eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const lintedFilePath =
  "src/presentation/components/characterMode/ui/core/CharacterMode.tsx";
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

const getMuiRuleMessages = async (
  source: string,
): Promise<ReadonlyArray<string>> => {
  const messages = await lintSnippet(source);

  return messages
    .filter((message) => message.ruleId === "mui-guidance/restrict-sx")
    .map((message) => message.message);
};

describe("mui-guidance/restrict-sx", () => {
  test(
    "allows a short shallow sx object",
    async () => {
      await expect(
        getMuiRuleMessages(`
        export const Example = () => (
          <Box sx={{ alignItems: "center", gap: 1, flexShrink: 0 }} />
        );
      `),
      ).resolves.toStrictEqual([]);
    },
    lintTestTimeoutMs,
  );

  test(
    "rejects extracted sx objects",
    async () => {
      await expect(
        getMuiRuleMessages(`
        const sharedSx = { gap: 1 };

        export const Example = () => <Box sx={sharedSx} />;
      `),
      ).resolves.toContain(
        "Keep `sx` inline as a short object literal. Extract reusable styling into a shared component, theme override, or `styled(...)`.",
      );
    },
    lintTestTimeoutMs,
  );

  test(
    "rejects oversized sx objects",
    async () => {
      await expect(
        getMuiRuleMessages(`
        export const Example = () => (
          <Box
            sx={{
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              flexShrink: 0,
              minWidth: 0,
              minHeight: 0,
            }}
          />
        );
      `),
      ).resolves.toContain(
        "`sx` must stay small. Use at most 5 top-level properties before extracting structure.",
      );
    },
    lintTestTimeoutMs,
  );

  test(
    "rejects nested selectors and raw style literals",
    async () => {
      await expect(
        getMuiRuleMessages(`
        export const Example = () => (
          <Box
            sx={{
              color: "#ff00aa",
              border: "1px solid",
              zIndex: 1300,
              "& .MuiButton-root": {
                color: "primary.main",
              },
            }}
          />
        );
      `),
      ).resolves.toStrictEqual([
        "Do not use raw hex colors inside `sx`. Use theme palette tokens instead.",
        "Do not use raw pixel strings inside `sx`. Use theme-backed values instead.",
        "Do not use ad hoc z-index values inside `sx`. Use theme zIndex tokens.",
        "Keep `sx` shallow. Avoid nested selectors, breakpoint objects, and at-rules inline.",
      ]);
    },
    lintTestTimeoutMs,
  );
});
