import * as O from "fp-ts/Option";
import { describe, expect, it } from "vitest";
import {
  ensureSelectedCharacterSpriteIndex,
  getCharacterLayerEntries,
  getCharacterLayerEntriesBackToFront,
  getNextCharacterSpriteLayer,
  nudgeCharacterSprite,
  resolveCharacterStagePoint,
  resolveCharacterStageScale,
  resolveSelectionAfterSpriteRemoval,
  resolveVisibleSpriteContextMenu,
  shiftCharacterSpriteLayer,
} from "./characterEditorModel";

describe("characterEditorModel", () => {
  it("orders layer entries from topmost to backmost", () => {
    const entries = getCharacterLayerEntries([
      { spriteIndex: 0, x: 0, y: 0, layer: 1 },
      { spriteIndex: 1, x: 8, y: 0, layer: 3 },
      { spriteIndex: 2, x: 16, y: 0, layer: 3 },
      { spriteIndex: 3, x: 24, y: 0, layer: 0 },
    ]);

    expect(entries.map((entry) => entry.index)).toEqual([2, 1, 0, 3]);
  });

  it("orders layer entries from backmost to topmost", () => {
    const entries = getCharacterLayerEntriesBackToFront([
      { spriteIndex: 0, x: 0, y: 0, layer: 1 },
      { spriteIndex: 1, x: 8, y: 0, layer: 3 },
      { spriteIndex: 2, x: 16, y: 0, layer: 3 },
      { spriteIndex: 3, x: 24, y: 0, layer: 0 },
    ]);

    expect(entries.map((entry) => entry.index)).toEqual([3, 0, 1, 2]);
  });

  it("computes the next layer and caps it at the NES limit", () => {
    expect(getNextCharacterSpriteLayer([])).toBe(0);
    expect(
      getNextCharacterSpriteLayer([
        { spriteIndex: 0, x: 0, y: 0, layer: 62 },
        { spriteIndex: 1, x: 0, y: 0, layer: 63 },
      ]),
    ).toBe(63);
  });

  it("keeps selections within the current sprite count", () => {
    expect(ensureSelectedCharacterSpriteIndex(O.some(1), 2)).toEqual(O.some(1));
    expect(ensureSelectedCharacterSpriteIndex(O.some(4), 2)).toEqual(O.none);
  });

  it("adjusts selection after a sprite is removed", () => {
    expect(resolveSelectionAfterSpriteRemoval(O.some(3), 1, 4)).toEqual(
      O.some(2),
    );
    expect(resolveSelectionAfterSpriteRemoval(O.some(1), 1, 1)).toEqual(
      O.some(0),
    );
    expect(resolveSelectionAfterSpriteRemoval(O.some(0), 0, 0)).toEqual(O.none);
  });

  it("resolves stage points using scale, offset, and bounds", () => {
    expect(
      resolveCharacterStagePoint({
        clientX: 96,
        clientY: 104,
        stageLeft: 20,
        stageTop: 24,
        stageScale: 2,
        offsetX: 16,
        offsetY: 20,
        minX: 0,
        maxX: 255,
        minY: 0,
        maxY: 239,
      }),
    ).toEqual({ x: 30, y: 30 });

    expect(
      resolveCharacterStagePoint({
        clientX: 2,
        clientY: 600,
        stageLeft: 20,
        stageTop: 24,
        stageScale: 2,
        offsetX: 16,
        offsetY: 20,
        minX: 0,
        maxX: 255,
        minY: 0,
        maxY: 239,
      }),
    ).toEqual({ x: 0, y: 239 });
  });

  it("bases preview scale on the 16x16 character canvas standard", () => {
    expect(resolveCharacterStageScale(16, 16, 2)).toBe(32);
    expect(resolveCharacterStageScale(32, 16, 2)).toBe(16);
    expect(resolveCharacterStageScale(320, 256, 2)).toBe(2);
    expect(resolveCharacterStageScale(320, 256, 3)).toBe(3);
  });

  it("nudges a sprite by one pixel and clamps within stage bounds", () => {
    expect(
      nudgeCharacterSprite(
        { spriteIndex: 0, x: 10, y: 12, layer: 3 },
        "left",
        255,
        239,
      ),
    ).toEqual({ spriteIndex: 0, x: 9, y: 12, layer: 3 });

    expect(
      nudgeCharacterSprite(
        { spriteIndex: 0, x: 0, y: 0, layer: 3 },
        "up",
        255,
        239,
      ),
    ).toEqual({ spriteIndex: 0, x: 0, y: 0, layer: 3 });

    expect(
      nudgeCharacterSprite(
        { spriteIndex: 0, x: 255, y: 239, layer: 3 },
        "down",
        255,
        239,
      ),
    ).toEqual({ spriteIndex: 0, x: 255, y: 239, layer: 3 });
  });

  it("shifts a sprite layer and clamps it to the NES range", () => {
    expect(
      shiftCharacterSpriteLayer({ spriteIndex: 0, x: 8, y: 8, layer: 4 }, 1),
    ).toEqual({ spriteIndex: 0, x: 8, y: 8, layer: 5 });

    expect(
      shiftCharacterSpriteLayer({ spriteIndex: 0, x: 8, y: 8, layer: 0 }, -1),
    ).toEqual({ spriteIndex: 0, x: 8, y: 8, layer: 0 });

    expect(
      shiftCharacterSpriteLayer({ spriteIndex: 0, x: 8, y: 8, layer: 63 }, 1),
    ).toEqual({ spriteIndex: 0, x: 8, y: 8, layer: 63 });
  });

  it("shows the sprite context menu only in compose mode with a selection", () => {
    const menu = O.some({
      clientX: 120,
      clientY: 80,
      spriteEditorIndex: 3,
    });

    expect(resolveVisibleSpriteContextMenu(true, true, menu)).toEqual(menu);
    expect(resolveVisibleSpriteContextMenu(false, true, menu)).toEqual(O.none);
    expect(resolveVisibleSpriteContextMenu(true, false, menu)).toEqual(O.none);
    expect(resolveVisibleSpriteContextMenu(false, false, menu)).toEqual(O.none);
  });
});
