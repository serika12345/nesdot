import { isLeft } from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { describe, expect, it } from "vitest";
import { SpriteTileND } from "../project/project";
import { getArrayItem, getMatrixItem } from "../../shared/arrayAccess";
import { assertTileSize, makeTile, resizeTileND } from "./utils";

function createTallTile(): SpriteTileND {
  return {
    width: 8,
    height: 16,
    paletteIndex: 2,
    pixels: Array.from({ length: 16 }, (_, y) =>
      Array.from({ length: 8 }, () => (y < 8 ? 1 : 2)),
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
  it("does not attach backing state to the source tile", () => {
    const source = createTallTile();

    resizeTileND(source, 8, 8, {
      anchor: "top-left",
      fill: 0,
    });

    expect(source).not.toHaveProperty("__backing");
  });

  it("does not mutate an existing backing on the source tile", () => {
    const shrunk = resizeTileND(createTallTile(), 8, 8, {
      anchor: "top-left",
      fill: 0,
    });
    const backingOption = O.fromNullable(shrunk.__backing);
    expect(O.isSome(backingOption)).toBe(true);
    if (O.isNone(backingOption)) {
      return;
    }

    const backingBefore = {
      width: backingOption.value.width,
      height: backingOption.value.height,
      offsetX: backingOption.value.offsetX,
      offsetY: backingOption.value.offsetY,
      pixels: backingOption.value.pixels.map((row) => row.slice()),
    };

    resizeTileND(shrunk, 8, 16, {
      anchor: "bottom",
      fill: 0,
    });

    expect(backingOption.value.width).toBe(backingBefore.width);
    expect(backingOption.value.height).toBe(backingBefore.height);
    expect(backingOption.value.offsetX).toBe(backingBefore.offsetX);
    expect(backingOption.value.offsetY).toBe(backingBefore.offsetY);
    expect(backingOption.value.pixels).toEqual(backingBefore.pixels);
  });

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
    const baseTile: SpriteTileND = makeTile(8, 1, 0);
    const firstRowOption = getArrayItem(baseTile.pixels, 0);
    const lastRowOption = getArrayItem(baseTile.pixels, 7);
    expect(O.isSome(firstRowOption)).toBe(true);
    expect(O.isSome(lastRowOption)).toBe(true);
    if (O.isNone(firstRowOption) || O.isNone(lastRowOption)) {
      return;
    }

    const tile: SpriteTileND = {
      ...baseTile,
      pixels: baseTile.pixels.map((row, y) => {
        if (y === 0) {
          return row.map((value, x) => (x === 0 ? 1 : value));
        }
        if (y === 7) {
          return row.map((value, x) => (x === 0 ? 2 : value));
        }
        return row;
      }),
    };

    const expanded = resizeTileND(tile, 8, 16, { anchor: "bottom", fill: 0 });

    expect(getMatrixItem(expanded.pixels, 0, 0)).toEqual(O.some(0));
    expect(getMatrixItem(expanded.pixels, 8, 0)).toEqual(O.some(1));
    expect(getMatrixItem(expanded.pixels, 15, 0)).toEqual(O.some(2));
  });
});
