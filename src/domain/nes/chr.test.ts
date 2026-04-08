import { isLeft, isRight } from "fp-ts/Either";
import { describe, expect, it } from "vitest";
import { ColorIndexOfPalette, SpriteTile } from "../project/project";
import { BackgroundTile } from "../project/projectV2";
import {
  decodeBackgroundTile,
  encodeBackgroundTile,
  encodeBackgroundTilesToChrBytes,
  tile8x16ToChr,
  tile8x8ToChr,
} from "./chr";

function create8x8Tile(fill: ColorIndexOfPalette): SpriteTile {
  return {
    width: 8,
    height: 8,
    paletteIndex: 0,
    pixels: Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => fill),
    ),
  };
}

function createBackgroundTile(fill: ColorIndexOfPalette): BackgroundTile {
  return {
    width: 8,
    height: 8,
    pixels: Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => fill),
    ),
  };
}

describe("tile8x8ToChr", () => {
  it("converts 2-bit pixels into CHR bitplanes", () => {
    const row: ColorIndexOfPalette[] = [0, 1, 2, 3, 0, 1, 2, 3];
    const tile: SpriteTile = {
      width: 8,
      height: 8,
      paletteIndex: 0,
      pixels: Array.from({ length: 8 }, () => row.slice()),
    };

    const result = tile8x8ToChr(tile);
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(Array.from(result.right)).toEqual([
        0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x33, 0x33, 0x33, 0x33,
        0x33, 0x33, 0x33, 0x33,
      ]);
    }
  });

  it("rejects non-8x8 tiles", () => {
    const tile: SpriteTile = {
      width: 8,
      height: 16,
      paletteIndex: 0,
      pixels: Array.from({ length: 16 }, () =>
        Array.from({ length: 8 }, () => 0),
      ),
    };

    const result = tile8x8ToChr(tile);
    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left).toBe("tile8x8ToChr: 8x8のみ対応");
    }
  });
});

describe("tile8x16ToChr", () => {
  it("concatenates the upper and lower CHR tiles", () => {
    const top = create8x8Tile(1);
    const bottom = create8x8Tile(2);

    const result = tile8x16ToChr(top, bottom);
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(Array.from(result.right)).toEqual([
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      ]);
    }
  });
});

describe("encodeBackgroundTile", () => {
  it("converts background tile pixels into CHR bitplanes", () => {
    const row: ColorIndexOfPalette[] = [0, 1, 2, 3, 0, 1, 2, 3];
    const tile: BackgroundTile = {
      width: 8,
      height: 8,
      pixels: Array.from({ length: 8 }, () => row.slice()),
    };

    const result = encodeBackgroundTile(tile);

    expect(Array.from(result)).toEqual([
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x33, 0x33, 0x33, 0x33,
      0x33, 0x33, 0x33, 0x33,
    ]);
  });

  it("concatenates multiple background tiles into a single CHR byte array", () => {
    const tiles = [createBackgroundTile(1), createBackgroundTile(2)];

    const result = encodeBackgroundTilesToChrBytes(tiles);

    expect(Array.from(result)).toEqual([
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    ]);
  });
});

describe("decodeBackgroundTile", () => {
  it("decodes CHR bitplanes into background tile pixels", () => {
    const result = decodeBackgroundTile([
      0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x33, 0x33, 0x33, 0x33,
      0x33, 0x33, 0x33, 0x33,
    ]);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toEqual({
        width: 8,
        height: 8,
        pixels: Array.from({ length: 8 }, () => [0, 1, 2, 3, 0, 1, 2, 3]),
      });
    }
  });

  it("rejects byte arrays that are not exactly one CHR tile", () => {
    const result = decodeBackgroundTile(Array.from({ length: 15 }, () => 0));

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left).toBe(
        "decodeBackgroundTile: 16バイトのCHRデータが必要です",
      );
    }
  });

  it("round-trips an encoded background tile", () => {
    const tile = createBackgroundTile(3);
    const encoded = encodeBackgroundTile(tile);
    const decoded = decodeBackgroundTile(Array.from(encoded));

    expect(isRight(decoded)).toBe(true);
    if (isRight(decoded)) {
      expect(decoded.right).toEqual(tile);
    }
  });
});
