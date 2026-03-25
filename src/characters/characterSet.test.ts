import * as E from "fp-ts/Either";
import { describe, expect, it } from "vitest";
import { createDefaultNesProjectState } from "../store/nesProjectState";
import { makeTile } from "../tiles/utils";
import {
  buildCharacterPreviewHexGrid,
  CharacterCell,
  CharacterSet,
  createCharacterSet,
  expandCharacterToScreenSprites,
  resizeCharacterSet,
  setCharacterCell,
} from "./characterSet";

const emptyCell: CharacterCell = { kind: "empty" };

const createCells = (cells: CharacterCell[]): CharacterCell[] => cells;

const createCharacter = (): CharacterSet =>
  createCharacterSet({
    id: "hero",
    name: "Hero",
    rows: 2,
    cols: 2,
    cells: createCells([
      { kind: "sprite", spriteIndex: 0 },
      emptyCell,
      { kind: "sprite", spriteIndex: 1 },
      { kind: "sprite", spriteIndex: 2 },
    ]),
  });

describe("characterSet", () => {
  it("creates missing cells as empty", () => {
    const set = createCharacterSet({
      id: "ch-1",
      name: "test",
      rows: 2,
      cols: 2,
      cells: [{ kind: "sprite", spriteIndex: 3 }],
    });

    expect(set.cells).toHaveLength(4);
    expect(set.cells[0]).toEqual({ kind: "sprite", spriteIndex: 3 });
    expect(set.cells[1]).toEqual({ kind: "empty" });
    expect(set.cells[2]).toEqual({ kind: "empty" });
    expect(set.cells[3]).toEqual({ kind: "empty" });
  });

  it("updates a target cell with validation", () => {
    const original = createCharacter();
    const result = setCharacterCell(original, 1, {
      kind: "sprite",
      spriteIndex: 7,
    });

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right.cells[1]).toEqual({ kind: "sprite", spriteIndex: 7 });
      expect(original.cells[1]).toEqual({ kind: "empty" });
    }

    const invalid = setCharacterCell(original, 99, emptyCell);
    expect(E.isLeft(invalid)).toBe(true);
  });

  it("resizes while preserving overlap and fills new cells as empty", () => {
    const original = createCharacter();
    const resized = resizeCharacterSet(original, 3, 3);

    expect(resized.rows).toBe(3);
    expect(resized.cols).toBe(3);
    expect(resized.cells).toHaveLength(9);
    expect(resized.cells[0]).toEqual({ kind: "sprite", spriteIndex: 0 });
    expect(resized.cells[3]).toEqual({ kind: "sprite", spriteIndex: 1 });
    expect(resized.cells[4]).toEqual({ kind: "sprite", spriteIndex: 2 });
    expect(resized.cells[8]).toEqual({ kind: "empty" });
  });

  it("expands to screen sprites using 8px grid and skips empty cells", () => {
    const character = createCharacter();
    const sprites = [makeTile(8, 0), makeTile(8, 1), makeTile(16, 2)];

    const result = expandCharacterToScreenSprites(character, {
      baseX: 40,
      baseY: 56,
      sprites,
    });

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right).toHaveLength(3);
      expect(result.right[0]).toMatchObject({ x: 40, y: 56, spriteIndex: 0 });
      expect(result.right[1]).toMatchObject({ x: 40, y: 64, spriteIndex: 1 });
      expect(result.right[2]).toMatchObject({
        x: 48,
        y: 64,
        spriteIndex: 2,
        height: 16,
      });
    }
  });

  it("returns left when a referenced sprite index does not exist", () => {
    const set = createCharacterSet({
      id: "invalid",
      name: "invalid",
      rows: 1,
      cols: 1,
      cells: [{ kind: "sprite", spriteIndex: 99 }],
    });
    const sprites = [makeTile(8, 0)];

    const result = expandCharacterToScreenSprites(set, {
      baseX: 0,
      baseY: 0,
      sprites,
    });

    expect(E.isLeft(result)).toBe(true);
  });

  it("builds preview grid with composed sprite pixels", () => {
    const character = createCharacter();
    const sprites = [makeTile(8, 0, 1), makeTile(8, 1, 2), makeTile(16, 2, 3)];
    const palettes = createDefaultNesProjectState().spritePalettes;
    const transparentHex = "#00000000";

    const result = buildCharacterPreviewHexGrid(character, {
      sprites,
      palettes,
      transparentHex,
    });

    expect(E.isRight(result)).toBe(true);
    if (E.isRight(result)) {
      expect(result.right).toHaveLength(24);
      expect(result.right[0]).toHaveLength(16);
      expect(result.right[0][0]).not.toBe(transparentHex);
      expect(result.right[0][12]).toBe(transparentHex);
      expect(result.right[10][0]).not.toBe(transparentHex);
      expect(result.right[20][8]).not.toBe(transparentHex);
    }
  });

  it("returns left when preview references a missing sprite", () => {
    const character = createCharacterSet({
      id: "preview-invalid",
      name: "preview-invalid",
      rows: 1,
      cols: 1,
      cells: [{ kind: "sprite", spriteIndex: 42 }],
    });
    const palettes = createDefaultNesProjectState().spritePalettes;

    const result = buildCharacterPreviewHexGrid(character, {
      sprites: [makeTile(8, 0, 1)],
      palettes,
      transparentHex: "#00000000",
    });

    expect(E.isLeft(result)).toBe(true);
  });
});
