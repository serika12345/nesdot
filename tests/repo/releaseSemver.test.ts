import * as E from "fp-ts/Either";
import { describe, expect, test } from "vitest";
import { bumpSemver } from "../../src/shared/releaseSemver";

describe("bumpSemver", () => {
  test("increments patch by default", () => {
    expect(bumpSemver("0.1.5", "patch")).toEqual(E.right("0.1.6"));
  });

  test("increments minor and resets patch", () => {
    expect(bumpSemver("0.1.5", "minor")).toEqual(E.right("0.2.0"));
  });

  test("increments major and resets minor and patch", () => {
    expect(bumpSemver("0.1.5", "major")).toEqual(E.right("1.0.0"));
  });

  test("returns left on invalid semver input", () => {
    expect(bumpSemver("0.1", "patch")).toEqual(
      E.left("Invalid semver version: 0.1"),
    );
  });
});
