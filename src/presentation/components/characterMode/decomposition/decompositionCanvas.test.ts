import { describe, expect, it } from "vitest";
import { type CharacterDecompositionCanvas } from "../../../../domain/characters/characterDecomposition";
import { nesIndexToCssHex } from "../../../../domain/nes/palette";
import { createDecompositionCanvasRgba } from "./decompositionCanvas";

const toRgbTriplet = (nesColorIndex: number): readonly [number, number, number] => {
  const hex = nesIndexToCssHex(nesColorIndex);

  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
};

describe("createDecompositionCanvasRgba", () => {
  it("maps decomposition pixels into RGBA slots", () => {
    const firstPalette: readonly [number, number, number, number] = [
      0x0f,
      0x11,
      0x21,
      0x31,
    ];
    const secondPalette: readonly [number, number, number, number] = [
      0x0f,
      0x16,
      0x26,
      0x36,
    ];
    const thirdPalette: readonly [number, number, number, number] = [
      0x0f,
      0x19,
      0x29,
      0x39,
    ];
    const fourthPalette: readonly [number, number, number, number] = [
      0x0f,
      0x1c,
      0x2c,
      0x3c,
    ];
    const spritePalettes = [
      firstPalette,
      secondPalette,
      thirdPalette,
      fourthPalette,
    ];
    const canvas: CharacterDecompositionCanvas = {
      width: 2,
      height: 2,
      pixels: [
        [
          { kind: "transparent" },
          { kind: "color", paletteIndex: 0, colorIndex: 1 },
        ],
        [
          { kind: "color", paletteIndex: 1, colorIndex: 2 },
          { kind: "color", paletteIndex: 3, colorIndex: 3 },
        ],
      ],
    };

    const rgba = createDecompositionCanvasRgba(canvas, spritePalettes);
    const firstColor = toRgbTriplet(firstPalette[1]);
    const secondColor = toRgbTriplet(secondPalette[2]);
    const thirdColor = toRgbTriplet(fourthPalette[3]);

    expect(Array.from(rgba)).toEqual([
      0,
      0,
      0,
      0,
      firstColor[0],
      firstColor[1],
      firstColor[2],
      255,
      secondColor[0],
      secondColor[1],
      secondColor[2],
      255,
      thirdColor[0],
      thirdColor[1],
      thirdColor[2],
      255,
    ]);
  });

  it("keeps pixels transparent when palette entries are missing", () => {
    const spritePalettes: ReadonlyArray<ReadonlyArray<number>> = [
      [0x0f],
      [0x0f],
      [0x0f],
      [0x0f],
    ];
    const canvas: CharacterDecompositionCanvas = {
      width: 1,
      height: 1,
      pixels: [[{ kind: "color", paletteIndex: 0, colorIndex: 3 }]],
    };

    const rgba = createDecompositionCanvasRgba(canvas, spritePalettes);

    expect(Array.from(rgba)).toEqual([0, 0, 0, 0]);
  });
});
