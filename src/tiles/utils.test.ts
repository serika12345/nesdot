import { isLeft } from "fp-ts/Either";
import { describe, expect, it } from "vitest";
import { ColorIndexOfPalette, SpriteTileND } from "../store/projectState";
import { assertTileSize, makeTile, resizeTileND } from "./utils";

function createTallTile(): SpriteTileND {
  return {
    width: 8,
    height: 16,
    paletteIndex: 2,
    pixels: Array.from({ length: 16 }, (_, y) =>
      Array.from({ length: 8 }, () => (y < 8 ? 1 : 2) as ColorIndexOfPalette),
    ),
  };
}

describe("makeTile", () => {
  it("creates an 8-pixel wide tile filled with the requested value", () => {
    const tile = makeTile(8, 3, 2);

    expect(tile.width).toBe(8);
    expect(tile.height).toBe(8);
    expect(tile.paletteIndex).toBe(3);
    expect(tile.pixels.every((row) => row.every((value) => value === 2))).toBe(
      true,
    );
  });
});

describe("assertTileSize", () => {
  it("rejects dimensions that are not positive multiples of 8", () => {
    const result = assertTileSize(7, 8);
    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left).toContain(
        "Tile size must be positive and multiples of 8",
      );
    }
  });
});

describe("resizeTileND", () => {
  it("preserves hidden pixels when shrinking and expanding with the same anchor", () => {
    const shrunk = resizeTileND(createTallTile(), 8, 8, {
      anchor: "top-left",
      fill: 0,
    });
    const expanded = resizeTileND(shrunk, 8, 16, {
      anchor: "top-left",
      fill: 0,
    });

    expect(expanded.paletteIndex).toBe(2);
    expect(
      expanded.pixels
        .slice(0, 8)
        .every((row) => row.every((value) => value === 1)),
    ).toBe(true);
    expect(
      expanded.pixels
        .slice(8)
        .every((row) => row.every((value) => value === 2)),
    ).toBe(true);
  });

  it("positions content according to the requested anchor when expanding", () => {
    const tile = makeTile(8, 1, 0) as SpriteTileND;
    tile.pixels[0][0] = 1;
    tile.pixels[7][0] = 2;

    const expanded = resizeTileND(tile, 8, 16, { anchor: "bottom", fill: 0 });

    expect(expanded.pixels[0][0]).toBe(0);
    expect(expanded.pixels[8][0]).toBe(1);
    expect(expanded.pixels[15][0]).toBe(2);
  });
});
