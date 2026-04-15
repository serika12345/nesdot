import { describe, expect, test } from "vitest";

import { licenseExpressionAllowsNonGplPath } from "../../scripts/license-policy.mjs";

describe("licenseExpressionAllowsNonGplPath", () => {
  test("rejects a direct GPL-family expression", () => {
    expect(licenseExpressionAllowsNonGplPath("GPL-3.0-only")).toBe(false);
    expect(licenseExpressionAllowsNonGplPath("LGPL-2.1-or-later")).toBe(false);
  });

  test("accepts an expression when a permissive OR branch exists", () => {
    expect(licenseExpressionAllowsNonGplPath("MIT OR GPL-3.0-only")).toBe(true);
    expect(
      licenseExpressionAllowsNonGplPath(
        "MIT OR Apache-2.0 OR LGPL-2.1-or-later",
      ),
    ).toBe(true);
  });

  test("rejects expressions that require a GPL-family branch", () => {
    expect(licenseExpressionAllowsNonGplPath("MIT AND GPL-3.0-only")).toBe(
      false,
    );
    expect(
      licenseExpressionAllowsNonGplPath(
        "(MIT OR Apache-2.0) AND LGPL-2.1-or-later",
      ),
    ).toBe(false);
  });

  test("normalizes slash-delimited dual-license expressions", () => {
    expect(licenseExpressionAllowsNonGplPath("MIT/Apache-2.0")).toBe(true);
  });

  test("throws on malformed expressions", () => {
    expect(() => {
      return licenseExpressionAllowsNonGplPath("MIT OR (GPL-3.0-only");
    }).toThrow(/Unexpected end of license expression/u);
  });
});
