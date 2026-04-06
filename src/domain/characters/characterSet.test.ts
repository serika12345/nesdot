import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { describe, expect, it } from "vitest";
import { createDefaultNesProjectState } from "../nes/nesProject";
import { makeTile } from "../tiles/utils";
import {
  addCharacterSprite,
  buildCharacterPreviewHexGrid,
  createCharacterSet,
  expandCharacterToScreenSprites,
  removeCharacterSprite,
  setCharacterSprite,
} from "./characterSet";

const createCharacter = () =>
  createCharacterSet({
    id: "hero",
    name: "Hero",
    sprites: [
      { spriteIndex: 0, x: 0, y: 0, layer: 0 },
      { spriteIndex: 1, x: 8, y: 0, layer: 1 },
    ],
  });

describe("characterSet", () => {
  it("creates empty set by default", () => {
    const set = createCharacterSet({
      id: "ch-1",
      name: "test",
    });

    expect(set.sprites).toEqual([]);
  });

  it("adds a sprite with normalized values", () => {
    const set = createCharacterSet({ id: "c1", name: "c1" });
    const updated = addCharacterSprite(set, {
      spriteIndex: 3,
      x: 12,
      y: 34,
      layer: 2,
    });

    expect(updated.sprites).toEqual([
      { spriteIndex: 3, x: 12, y: 34, layer: 2 },
    ]);
  });

  it("updates a target sprite with validation", () => {
    const original = createCharacter();
    const result = setCharacterSprite(original, 1, {
      spriteIndex: 7,
      x: 22,
      y: 14,
      layer: 4,
    });

    expect(E.isRight(result)).toBe(true);
    if (E.isLeft(result)) {
      return;
    }

    expect(result.right.sprites[1]).toEqual({
      spriteIndex: 7,
      x: 22,
      y: 14,
      layer: 4,
    });
    expect(original.sprites[1]).toEqual({
      spriteIndex: 1,
      x: 8,
      y: 0,
      layer: 1,
    });

    const invalid = setCharacterSprite(original, 99, {
      spriteIndex: 0,
      x: 0,
      y: 0,
      layer: 0,
    });
    expect(E.isLeft(invalid)).toBe(true);
  });

  it("removes a target sprite with validation", () => {
    const original = createCharacter();
    const result = removeCharacterSprite(original, 0);

    expect(E.isRight(result)).toBe(true);
    if (E.isLeft(result)) {
      return;
    }

    expect(result.right.sprites).toHaveLength(1);
    expect(result.right.sprites[0]).toEqual({
      spriteIndex: 1,
      x: 8,
      y: 0,
      layer: 1,
    });
  });

  it("expands to screen sprites using per-sprite coordinates", () => {
    const character = createCharacterSet({
      id: "expand",
      name: "expand",
      sprites: [
        { spriteIndex: 0, x: 1, y: 2, layer: 3 },
        { spriteIndex: 1, x: 9, y: 12, layer: 1 },
      ],
    });
    const sprites = [makeTile(8, 0), makeTile(16, 1)];

    const result = expandCharacterToScreenSprites(character, {
      baseX: 40,
      baseY: 56,
      sprites,
    });

    expect(E.isRight(result)).toBe(true);
    if (E.isLeft(result)) {
      return;
    }

    expect(result.right).toHaveLength(2);
    expect(result.right[0]).toMatchObject({
      spriteIndex: 1,
      x: 49,
      y: 68,
    });
    expect(result.right[1]).toMatchObject({
      spriteIndex: 0,
      x: 41,
      y: 58,
    });
  });

  it("returns left when a referenced sprite index does not exist", () => {
    const set = createCharacterSet({
      id: "invalid",
      name: "invalid",
      sprites: [{ spriteIndex: 99, x: 0, y: 0, layer: 0 }],
    });

    const result = expandCharacterToScreenSprites(set, {
      baseX: 0,
      baseY: 0,
      sprites: [makeTile(8, 0)],
    });

    expect(E.isLeft(result)).toBe(true);
  });

  it("builds preview grid with composed sprite pixels", () => {
    const character = createCharacterSet({
      id: "preview",
      name: "preview",
      sprites: [
        { spriteIndex: 0, x: 0, y: 0, layer: 1 },
        { spriteIndex: 1, x: 4, y: 4, layer: 0 },
      ],
    });
    const sprites = [makeTile(8, 0, 1), makeTile(16, 1, 2)];
    const palettes = createDefaultNesProjectState().spritePalettes;
    const transparentHex = "#00000000";

    const result = buildCharacterPreviewHexGrid(character, {
      sprites,
      palettes,
      transparentHex,
    });

    expect(E.isRight(result)).toBe(true);
    if (E.isLeft(result)) {
      return;
    }

    expect(result.right.length).toBeGreaterThanOrEqual(20);
    const firstRow = O.fromNullable(result.right[0]);
    expect(O.isSome(firstRow)).toBe(true);
    if (O.isNone(firstRow)) {
      return;
    }

    expect(firstRow.value.length).toBeGreaterThanOrEqual(12);

    const overlapPixel = pipe(
      O.fromNullable(result.right[6]),
      O.chain((row) => O.fromNullable(row[6])),
    );
    expect(O.isSome(overlapPixel)).toBe(true);
    if (O.isNone(overlapPixel)) {
      return;
    }

    expect(overlapPixel.value).not.toBe(transparentHex);
  });

  it("returns left when preview references a missing sprite", () => {
    const character = createCharacterSet({
      id: "preview-invalid",
      name: "preview-invalid",
      sprites: [{ spriteIndex: 42, x: 0, y: 0, layer: 0 }],
    });
    const palettes = createDefaultNesProjectState().spritePalettes;

    const result = buildCharacterPreviewHexGrid(character, {
      sprites: [makeTile(8, 0, 1)],
      palettes,
      transparentHex: "#00000000",
    });

    expect(E.isLeft(result)).toBe(true);
  });

  it("does not mutate source data when building preview", () => {
    const character = createCharacterSet({
      id: "preview-pure",
      name: "preview-pure",
      sprites: [
        { spriteIndex: 0, x: 2, y: 3, layer: 1 },
        { spriteIndex: 1, x: 4, y: 5, layer: 0 },
      ],
    });
    const sprites = [makeTile(8, 0, 1), makeTile(16, 1, 2)];
    const palettes = createDefaultNesProjectState().spritePalettes;
    const characterBefore = structuredClone(character);
    const spritesBefore = structuredClone(sprites);

    const result = buildCharacterPreviewHexGrid(character, {
      sprites,
      palettes,
      transparentHex: "#00000000",
    });

    expect(E.isRight(result)).toBe(true);
    expect(character).toEqual(characterBefore);
    expect(sprites).toEqual(spritesBefore);
  });
});
