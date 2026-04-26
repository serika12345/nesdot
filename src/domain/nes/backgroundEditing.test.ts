import * as E from "fp-ts/Either";
import { describe, expect, it } from "vitest";
import {
  decodeBackgroundTileAtIndex,
  replaceBackgroundTilePixel,
  replaceBackgroundTilePixels,
  setAttributeTablePaletteAtPixel,
  setNameTableTileAtPixel,
} from "./backgroundEditing";
import { createEmptyAttributeTable, createEmptyNameTable } from "./nesProject";

describe("backgroundEditing", () => {
  it("replaces a pixel inside a background tile CHR block", () => {
    const chrBytes = Array.from({ length: 4096 }, () => 0);

    const result = replaceBackgroundTilePixel(chrBytes, 5, 1, 2, 1);

    expect(E.isRight(result)).toBe(true);

    if (E.isRight(result)) {
      const tile = decodeBackgroundTileAtIndex(result.right, 5);

      expect(E.isRight(tile)).toBe(true);
      if (E.isRight(tile)) {
        expect(tile.right.pixels[2]?.[1]).toBe(1);
      }
    }
  });

  it("updates only the target tile bitplane bytes for a pixel write", () => {
    const chrBytes = Array.from({ length: 4096 }, (_, index) => {
      if (index === 0) {
        return 0b00010000;
      }

      if (index === 8) {
        return 0b00100000;
      }

      return 0;
    });

    const result = replaceBackgroundTilePixel(chrBytes, 0, 1, 0, 3);

    expect(E.isRight(result)).toBe(true);

    if (E.isRight(result)) {
      const changedIndices = result.right
        .map((value, index) => ({ index, value }))
        .filter(({ index, value }) => value !== chrBytes[index]);

      expect(changedIndices).toEqual([
        { index: 0, value: 0b01010000 },
        { index: 8, value: 0b00100000 | 0b01000000 },
      ]);
    }
  });

  it("replaces multiple pixels inside a background tile CHR block", () => {
    const chrBytes = Array.from({ length: 4096 }, () => 0);

    const result = replaceBackgroundTilePixels(chrBytes, 2, [
      { pixelX: 0, pixelY: 0, nextColorIndex: 1 },
      { pixelX: 7, pixelY: 0, nextColorIndex: 2 },
      { pixelX: 3, pixelY: 4, nextColorIndex: 3 },
    ]);

    expect(E.isRight(result)).toBe(true);

    if (E.isRight(result)) {
      const tile = decodeBackgroundTileAtIndex(result.right, 2);

      expect(E.isRight(tile)).toBe(true);
      if (E.isRight(tile)) {
        expect(tile.right.pixels[0]?.[0]).toBe(1);
        expect(tile.right.pixels[0]?.[7]).toBe(2);
        expect(tile.right.pixels[4]?.[3]).toBe(3);
      }
    }
  });

  it("uses the last queued background pixel write for duplicate coordinates", () => {
    const chrBytes = Array.from({ length: 4096 }, () => 0);

    const result = replaceBackgroundTilePixels(chrBytes, 0, [
      { pixelX: 1, pixelY: 1, nextColorIndex: 1 },
      { pixelX: 1, pixelY: 1, nextColorIndex: 2 },
    ]);

    expect(E.isRight(result)).toBe(true);

    if (E.isRight(result)) {
      const tile = decodeBackgroundTileAtIndex(result.right, 0);

      expect(E.isRight(tile)).toBe(true);
      if (E.isRight(tile)) {
        expect(tile.right.pixels[1]?.[1]).toBe(2);
      }
    }
  });

  it("updates the name table tile index at a pixel position", () => {
    const nameTable = createEmptyNameTable();

    const result = setNameTableTileAtPixel(nameTable, 17, 9, 23);

    expect(result).toEqual(
      E.right({
        ...nameTable,
        tileIndices: nameTable.tileIndices.map((tileIndex, index) =>
          index === 34 ? 23 : tileIndex,
        ),
      }),
    );
  });

  it("updates the correct attribute table quadrant from a pixel position", () => {
    const attributeTable = createEmptyAttributeTable();

    const result = setAttributeTablePaletteAtPixel(attributeTable, 20, 4, 3);

    expect(result).toEqual(
      E.right({
        ...attributeTable,
        bytes: attributeTable.bytes.map((value, index) =>
          index === 0 ? 0b00001100 : value,
        ),
      }),
    );
  });

  it("rejects tile pixel writes outside 8x8 bounds", () => {
    const chrBytes = Array.from({ length: 4096 }, () => 0);

    const result = replaceBackgroundTilePixel(chrBytes, 0, 8, 0, 1);

    expect(E.isLeft(result)).toBe(true);
  });

  it("rejects batched tile pixel writes outside 8x8 bounds", () => {
    const chrBytes = Array.from({ length: 4096 }, () => 0);

    const result = replaceBackgroundTilePixels(chrBytes, 0, [
      { pixelX: 1, pixelY: 8, nextColorIndex: 1 },
    ]);

    expect(E.isLeft(result)).toBe(true);
  });
});
