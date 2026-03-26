import * as O from "fp-ts/Option";
import { describe, expect, it } from "vitest";
import {
  ensureSelectedCharacterSpriteIndex,
  getCharacterLayerEntries,
  getNextCharacterSpriteLayer,
  resolveCharacterStagePoint,
  resolveSelectionAfterSpriteRemoval,
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
    expect(ensureSelectedCharacterSpriteIndex(O.some(1), 2)).toEqual(
      O.some(1),
    );
    expect(ensureSelectedCharacterSpriteIndex(O.some(4), 2)).toEqual(O.none);
  });

  it("adjusts selection after a sprite is removed", () => {
    expect(resolveSelectionAfterSpriteRemoval(O.some(3), 1, 4)).toEqual(
      O.some(2),
    );
    expect(resolveSelectionAfterSpriteRemoval(O.some(1), 1, 1)).toEqual(
      O.some(0),
    );
    expect(resolveSelectionAfterSpriteRemoval(O.some(0), 0, 0)).toEqual(
      O.none,
    );
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
});
