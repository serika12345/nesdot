import { describe, expect, test } from "vitest";
import { isStandalonePwaRuntime } from "./pwaRuntime";

describe("isStandalonePwaRuntime", () => {
  test("detects the standalone display mode", () => {
    expect(
      isStandalonePwaRuntime(
        {
          matchMedia: (query) => ({
            matches: query === "(display-mode: standalone)",
          }),
        },
        {},
      ),
    ).toBe(true);
  });

  test("detects the window-controls-overlay display mode", () => {
    expect(
      isStandalonePwaRuntime(
        {
          matchMedia: (query) => ({
            matches: query === "(display-mode: window-controls-overlay)",
          }),
        },
        {},
      ),
    ).toBe(true);
  });

  test("detects navigator standalone mode", () => {
    expect(
      isStandalonePwaRuntime(
        {
          matchMedia: () => ({
            matches: false,
          }),
        },
        {
          standalone: true,
        },
      ),
    ).toBe(true);
  });

  test("returns false outside standalone pwa runtime", () => {
    expect(
      isStandalonePwaRuntime(
        {
          matchMedia: () => ({
            matches: false,
          }),
        },
        {
          standalone: false,
        },
      ),
    ).toBe(false);
  });
});
