import { describe, expect, test } from "vitest";

import { getViteBase } from "./viteBase";

describe("getViteBase", () => {
  test("returns the root base while serving in GitHub Actions", () => {
    expect(
      getViteBase("serve", {
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "paseri3739/nesdot",
      }),
    ).toBe("/");
  });

  test("returns the root base while building without repository metadata", () => {
    expect(getViteBase("build", {})).toBe("/");
  });

  test("returns the repository base while building in GitHub Actions", () => {
    expect(
      getViteBase("build", {
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "paseri3739/nesdot",
      }),
    ).toBe("/nesdot/");
  });

  test("prioritizes a manually configured base path", () => {
    expect(
      getViteBase("build", {
        VITE_BASE_PATH: "custom-path",
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "paseri3739/nesdot",
      }),
    ).toBe("/custom-path/");
  });
});
