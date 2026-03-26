import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { describe, expect, it } from "vitest";
import {
  PaletteIndex,
  SpriteTile,
  createEmptySpriteTile,
} from "../project/project";
import {
  CharacterDecompositionCanvas,
  CharacterDecompositionPixel,
  analyzeCharacterDecomposition,
  applyCharacterDecomposition,
} from "./characterDecomposition";

const transparentPixel: CharacterDecompositionPixel = {
  kind: "transparent",
};

const colorPixel = (
  paletteIndex: PaletteIndex,
  colorIndex: 1 | 2 | 3,
): CharacterDecompositionPixel => ({
  kind: "color",
  paletteIndex,
  colorIndex,
});

const createCanvas = (
  width: number,
  height: number,
  entries: ReadonlyArray<{
    x: number;
    y: number;
    pixel: CharacterDecompositionPixel;
  }>,
): CharacterDecompositionCanvas => ({
  width,
  height,
  pixels: Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const entry = entries.find(
        (candidate) => candidate.x === x && candidate.y === y,
      );

      return entry?.pixel ?? transparentPixel;
    }),
  ),
});

const createPaintedTile = (
  height: 8 | 16,
  paletteIndex: PaletteIndex,
  entries: ReadonlyArray<{
    x: number;
    y: number;
    colorIndex: 1 | 2 | 3;
  }>,
): SpriteTile => ({
  ...createEmptySpriteTile(height, paletteIndex),
  pixels: Array.from({ length: height }, (_, y) =>
    Array.from({ length: 8 }, (_, x) => {
      const entry = entries.find(
        (candidate) => candidate.x === x && candidate.y === y,
      );

      return entry?.colorIndex ?? 0;
    }),
  ),
});

const createSpriteLibrary = (
  height: 8 | 16,
  overrides: ReadonlyArray<{
    index: number;
    sprite: SpriteTile;
  }>,
): SpriteTile[] =>
  Array.from({ length: 64 }, (_, index) => {
    const override = overrides.find((candidate) => candidate.index === index);
    return override?.sprite ?? createEmptySpriteTile(height);
  });

describe("characterDecomposition", () => {
  it("reuses an exactly matching 8x8 sprite when a region fits a single palette", () => {
    const tileEntries: ReadonlyArray<{
      x: number;
      y: number;
      colorIndex: 1 | 2 | 3;
    }> = [
      { x: 1, y: 1, colorIndex: 1 },
      { x: 2, y: 2, colorIndex: 2 },
      { x: 3, y: 4, colorIndex: 3 },
    ];
    const canvas = createCanvas(
      16,
      16,
      tileEntries.map((entry) => ({
        x: entry.x,
        y: entry.y,
        pixel: colorPixel(2, entry.colorIndex),
      })),
    );
    const sprites = createSpriteLibrary(8, [
      {
        index: 0,
        sprite: createPaintedTile(8, 2, tileEntries),
      },
    ]);

    const analysis = analyzeCharacterDecomposition({
      canvas,
      regions: [{ id: "head", x: 0, y: 0 }],
      spriteSize: 8,
      sprites,
    });

    expect(analysis.canApply).toBe(true);
    expect(analysis.reusableSpriteCount).toBe(1);
    expect(analysis.requiredNewSpriteCount).toBe(0);
    expect(analysis.availableEmptySlotCount).toBe(63);

    const firstRegionOption = O.fromNullable(analysis.regions[0]);
    expect(O.isSome(firstRegionOption)).toBe(true);
    if (O.isNone(firstRegionOption)) {
      return;
    }
    const firstRegion = firstRegionOption.value;

    expect(firstRegion.issues).toEqual([]);
    expect(O.isSome(firstRegion.matchedSpriteIndex)).toBe(true);
    if (O.isSome(firstRegion.matchedSpriteIndex)) {
      expect(firstRegion.matchedSpriteIndex.value).toBe(0);
    }

    const result = applyCharacterDecomposition({
      canvas,
      regions: [{ id: "head", x: 0, y: 0 }],
      spriteSize: 8,
      sprites,
    });

    expect(E.isRight(result)).toBe(true);
    if (E.isLeft(result)) {
      return;
    }

    expect(result.right.characterSprites).toEqual([
      { spriteIndex: 0, x: 0, y: 0, layer: 0 },
    ]);
    expect(result.right.sprites[0]).toEqual(sprites[0]);
  });

  it("marks a region invalid when it mixes multiple sprite palettes", () => {
    const canvas = createCanvas(16, 16, [
      { x: 1, y: 1, pixel: colorPixel(0, 1) },
      { x: 2, y: 2, pixel: colorPixel(1, 2) },
    ]);
    const sprites = createSpriteLibrary(8, []);

    const analysis = analyzeCharacterDecomposition({
      canvas,
      regions: [{ id: "mixed", x: 0, y: 0 }],
      spriteSize: 8,
      sprites,
    });

    expect(analysis.canApply).toBe(false);
    const firstRegionOption = O.fromNullable(analysis.regions[0]);
    expect(O.isSome(firstRegionOption)).toBe(true);
    if (O.isNone(firstRegionOption)) {
      return;
    }
    const firstRegion = firstRegionOption.value;

    expect(firstRegion.issues).toContain("mixed-palette");

    const result = applyCharacterDecomposition({
      canvas,
      regions: [{ id: "mixed", x: 0, y: 0 }],
      spriteSize: 8,
      sprites,
    });

    expect(E.isLeft(result)).toBe(true);
  });

  it("allocates the first empty 8x16 slot for a valid new region", () => {
    const tileEntries: ReadonlyArray<{
      x: number;
      y: number;
      colorIndex: 1 | 2 | 3;
    }> = [
      { x: 1, y: 1, colorIndex: 1 },
      { x: 2, y: 9, colorIndex: 2 },
      { x: 4, y: 14, colorIndex: 3 },
    ];
    const canvas = createCanvas(
      32,
      32,
      tileEntries.map((entry) => ({
        x: entry.x + 8,
        y: entry.y + 4,
        pixel: colorPixel(3, entry.colorIndex),
      })),
    );
    const sprites = createSpriteLibrary(16, [
      {
        index: 0,
        sprite: createPaintedTile(16, 0, [{ x: 0, y: 0, colorIndex: 1 }]),
      },
    ]);

    const analysis = analyzeCharacterDecomposition({
      canvas,
      regions: [{ id: "body", x: 8, y: 4 }],
      spriteSize: 16,
      sprites,
    });

    expect(analysis.canApply).toBe(true);
    expect(analysis.reusableSpriteCount).toBe(0);
    expect(analysis.requiredNewSpriteCount).toBe(1);
    expect(analysis.availableEmptySlotCount).toBe(63);

    const result = applyCharacterDecomposition({
      canvas,
      regions: [{ id: "body", x: 8, y: 4 }],
      spriteSize: 16,
      sprites,
    });

    expect(E.isRight(result)).toBe(true);
    if (E.isLeft(result)) {
      return;
    }

    expect(result.right.characterSprites).toEqual([
      { spriteIndex: 1, x: 8, y: 4, layer: 0 },
    ]);
    expect(result.right.sprites[1]).toEqual(createPaintedTile(16, 3, tileEntries));
  });

  it("rejects overlapping cut regions", () => {
    const canvas = createCanvas(16, 16, [
      { x: 1, y: 1, pixel: colorPixel(0, 1) },
      { x: 5, y: 1, pixel: colorPixel(0, 2) },
    ]);
    const sprites = createSpriteLibrary(8, []);

    const analysis = analyzeCharacterDecomposition({
      canvas,
      regions: [
        { id: "left", x: 0, y: 0 },
        { id: "right", x: 4, y: 0 },
      ],
      spriteSize: 8,
      sprites,
    });

    expect(analysis.canApply).toBe(false);
    expect(
      analysis.regions.some((region: { issues: string[] }) =>
        region.issues.includes("overlap"),
      ),
    ).toBe(true);
  });

  it("fails without mutating sprite results when no empty slot is available", () => {
    const fullLibrary = Array.from({ length: 64 }, (_, index) =>
      createPaintedTile(8, 0, [
        {
          x: index % 8,
          y: Math.floor(index / 8),
          colorIndex: 1,
        },
      ]),
    );
    const canvas = createCanvas(16, 16, [
      { x: 1, y: 1, pixel: colorPixel(2, 3) },
      { x: 2, y: 2, pixel: colorPixel(2, 1) },
    ]);

    const analysis = analyzeCharacterDecomposition({
      canvas,
      regions: [{ id: "full", x: 0, y: 0 }],
      spriteSize: 8,
      sprites: fullLibrary,
    });

    expect(analysis.canApply).toBe(false);
    expect(analysis.requiredNewSpriteCount).toBe(1);
    expect(analysis.availableEmptySlotCount).toBe(0);

    const result = applyCharacterDecomposition({
      canvas,
      regions: [{ id: "full", x: 0, y: 0 }],
      spriteSize: 8,
      sprites: fullLibrary,
    });

    expect(E.isLeft(result)).toBe(true);
  });
});
