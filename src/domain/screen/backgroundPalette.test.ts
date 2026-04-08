import { isLeft, isRight } from "fp-ts/Either";
import { describe, expect, it } from "vitest";
import { createEmptyScreenBackground } from "../project/projectV2";
import {
  getScreenBackgroundPaletteLinearIndex,
  resolveScreenBackgroundPaletteIndexAtTile,
  setScreenBackgroundPalette,
} from "./backgroundPalette";

describe("backgroundPalette", () => {
  it("resolves a visible 16x16 background region into a linear index", () => {
    const result = getScreenBackgroundPaletteLinearIndex(15, 14);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(239);
    }
  });

  it("updates the targeted palette region", () => {
    const background = createEmptyScreenBackground();
    const result = setScreenBackgroundPalette(background, 1, 2, 3);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.paletteIndices[33]).toBe(3);
    }
  });

  it("resolves tile coordinates through the 16x16 background region grid", () => {
    const background = createEmptyScreenBackground();
    const updated = setScreenBackgroundPalette(background, 1, 2, 2);

    expect(isRight(updated)).toBe(true);
    if (isRight(updated)) {
      const paletteIndex = resolveScreenBackgroundPaletteIndexAtTile(
        updated.right,
        3,
        5,
      );

      expect(isRight(paletteIndex)).toBe(true);
      if (isRight(paletteIndex)) {
        expect(paletteIndex.right).toBe(2);
      }
    }
  });

  it("rejects out-of-bounds background regions", () => {
    const background = createEmptyScreenBackground();
    const result = setScreenBackgroundPalette(background, 16, 0, 1);

    expect(isLeft(result)).toBe(true);
  });
});
