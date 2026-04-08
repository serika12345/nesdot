import { isLeft, isRight } from "fp-ts/Either";
import { describe, expect, it } from "vitest";
import { createEmptyScreenBackground } from "../project/projectV2";
import {
  getScreenBackgroundTileLinearIndex,
  getScreenBackgroundTilePlacementFromPixel,
  paintScreenBackgroundTiles,
  placeScreenBackgroundTileAtPixel,
  resolveScreenBackgroundTileIndexAtPixel,
  setScreenBackgroundTile,
} from "./backgroundLayout";

describe("backgroundLayout", () => {
  it("resolves a visible screen tile coordinate into a linear index", () => {
    const result = getScreenBackgroundTileLinearIndex(31, 29);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(959);
    }
  });

  it("updates the targeted tile slot", () => {
    const background = createEmptyScreenBackground();
    const result = setScreenBackgroundTile(background, 1, 1, 42);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.tileIndices[33]).toBe(42);
    }
  });

  it("snaps a screen pixel coordinate to an 8x8 background tile", () => {
    const result = getScreenBackgroundTilePlacementFromPixel(15, 9);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toEqual({
        tileX: 1,
        tileY: 1,
        snappedPixelX: 8,
        snappedPixelY: 8,
        linearIndex: 33,
      });
    }
  });

  it("updates a tile slot from screen pixel coordinates", () => {
    const background = createEmptyScreenBackground();
    const result = placeScreenBackgroundTileAtPixel(background, 15, 9, 12);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.tileIndices[33]).toBe(12);
    }
  });

  it("resolves the tile index located under a screen pixel", () => {
    const background = createEmptyScreenBackground();
    const updated = setScreenBackgroundTile(background, 2, 1, 19);

    expect(isRight(updated)).toBe(true);
    if (isRight(updated)) {
      const result = resolveScreenBackgroundTileIndexAtPixel(
        updated.right,
        18,
        12,
      );

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right).toBe(19);
      }
    }
  });

  it("paints multiple background tile cells in one operation", () => {
    const background = createEmptyScreenBackground();
    const result = paintScreenBackgroundTiles(
      background,
      [
        { tileX: 1, tileY: 1 },
        { tileX: 2, tileY: 1 },
      ],
      7,
    );

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.tileIndices[33]).toBe(7);
      expect(result.right.tileIndices[34]).toBe(7);
    }
  });

  it("rejects out-of-bounds tile coordinates", () => {
    const background = createEmptyScreenBackground();
    const result = setScreenBackgroundTile(background, 32, 0, 7);

    expect(isLeft(result)).toBe(true);
  });

  it("rejects out-of-bounds screen pixels", () => {
    const result = getScreenBackgroundTilePlacementFromPixel(256, 0);

    expect(isLeft(result)).toBe(true);
  });
});
