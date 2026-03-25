import * as E from "fp-ts/Either";
import { describe, expect, it } from "vitest";
import {
  createDefaultNesProjectState,
  createEmptyAttributeTable,
  getAttributeByteIndex,
  getNameTableLinearIndex,
  NES_ATTRIBUTE_TABLE_BYTE_COUNT,
  NES_NAME_TABLE_TILE_COUNT,
  NES_OAM_ENTRY_COUNT,
  resolveBackgroundPaletteIndex,
} from "./nesProjectState";

describe("nesProjectState", () => {
  it("creates NES-sized default structures", () => {
    const state = createDefaultNesProjectState();

    expect(state.nameTable.tileIndices).toHaveLength(NES_NAME_TABLE_TILE_COUNT);
    expect(state.attributeTable.bytes).toHaveLength(NES_ATTRIBUTE_TABLE_BYTE_COUNT);
    expect(state.oam).toHaveLength(NES_OAM_ENTRY_COUNT);
  });

  it("maps tile coordinates to a name table linear index", () => {
    expect(getNameTableLinearIndex(0, 0)).toEqual(E.right(0));
    expect(getNameTableLinearIndex(31, 29)).toEqual(E.right(959));
    expect(E.isLeft(getNameTableLinearIndex(32, 0))).toBe(true);
    expect(E.isLeft(getNameTableLinearIndex(0, 30))).toBe(true);
  });

  it("maps tile coordinates to attribute byte index", () => {
    expect(getAttributeByteIndex(0, 0)).toEqual(E.right(0));
    expect(getAttributeByteIndex(3, 3)).toEqual(E.right(0));
    expect(getAttributeByteIndex(4, 0)).toEqual(E.right(1));
    expect(getAttributeByteIndex(31, 29)).toEqual(E.right(63));
  });

  it("resolves palette index from each quadrant of an attribute byte", () => {
    const table = createEmptyAttributeTable();
    table.bytes[0] = 0b11_10_01_00;

    expect(resolveBackgroundPaletteIndex(table, 0, 0)).toEqual(E.right(0));
    expect(resolveBackgroundPaletteIndex(table, 2, 0)).toEqual(E.right(1));
    expect(resolveBackgroundPaletteIndex(table, 0, 2)).toEqual(E.right(2));
    expect(resolveBackgroundPaletteIndex(table, 2, 2)).toEqual(E.right(3));
  });
});
