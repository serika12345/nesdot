import { isLeft, isRight } from "fp-ts/Either";
import { describe, expect, it } from "vitest";
import { createEmptyScreenBackground } from "../project/projectV2";
import {
  getScreenBackgroundPaletteLinearIndex,
  getScreenBackgroundPalettePlacementFromPixel,
  paintScreenBackgroundPalettes,
  resolveScreenBackgroundPaletteIndexAtPixel,
  resolveScreenBackgroundPaletteIndexAtTile,
  setScreenBackgroundPalette,
  setScreenBackgroundPaletteAtPixel,
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

  it("snaps a screen pixel coordinate to a 16x16 palette region", () => {
    const result = getScreenBackgroundPalettePlacementFromPixel(31, 17);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toEqual({
        regionX: 1,
        regionY: 1,
        snappedPixelX: 16,
        snappedPixelY: 16,
        linearIndex: 17,
      });
    }
  });

  it("updates the targeted palette region from screen pixel coordinates", () => {
    const background = createEmptyScreenBackground();
    const result = setScreenBackgroundPaletteAtPixel(background, 31, 17, 2);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.paletteIndices[17]).toBe(2);
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

  it("resolves a palette region through screen pixel coordinates", () => {
    const background = createEmptyScreenBackground();
    const updated = setScreenBackgroundPalette(background, 2, 1, 3);

    expect(isRight(updated)).toBe(true);
    if (isRight(updated)) {
      const paletteIndex = resolveScreenBackgroundPaletteIndexAtPixel(
        updated.right,
        33,
        24,
      );

      expect(isRight(paletteIndex)).toBe(true);
      if (isRight(paletteIndex)) {
        expect(paletteIndex.right).toBe(3);
      }
    }
  });

  it("paints multiple background palette regions in one operation", () => {
    const background = createEmptyScreenBackground();
    const result = paintScreenBackgroundPalettes(
      background,
      [
        { regionX: 1, regionY: 1 },
        { regionX: 2, regionY: 1 },
      ],
      1,
    );

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.paletteIndices[17]).toBe(1);
      expect(result.right.paletteIndices[18]).toBe(1);
    }
  });

  it("rejects out-of-bounds background regions", () => {
    const background = createEmptyScreenBackground();
    const result = setScreenBackgroundPalette(background, 16, 0, 1);

    expect(isLeft(result)).toBe(true);
  });
});
