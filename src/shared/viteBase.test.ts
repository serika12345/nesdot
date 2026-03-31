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

  test("returns the repository base while building in GitHub Actions", () => {
    expect(
      getViteBase("build", {
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "paseri3739/nesdot",
      }),
    ).toBe("/nesdot/");
  });

  test("falls back to the root base without repository metadata", () => {
    expect(
      getViteBase("build", {
        GITHUB_ACTIONS: "true",
      }),
    ).toBe("/");
  });
});
