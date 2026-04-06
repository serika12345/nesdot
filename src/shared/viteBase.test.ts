import { describe, expect, test } from "vitest";

import { getViteBase } from "./viteBase";

describe("getViteBase", () => {
  test("returns the root base while serving in GitHub Actions", () => {
    expect(getViteBase("serve")).toBe("/");
  });

  test("returns the root base while building in GitHub Actions", () => {
    expect(getViteBase("build")).toBe("/");
  });

  test("returns the root base while building without repository metadata", () => {
    expect(getViteBase("build")).toBe("/");
  });
});
