import { describe, expect, it } from "vitest";
import {
  createDefaultNesProjectState,
  NesProjectState,
} from "../store/nesProjectState";
import { Palettes } from "../store/projectState";
import {
  resolveScreenRenderPalettes,
  resolveSpriteRenderPalettes,
} from "./drawingPath";

const legacyPalettes: Palettes = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
];

const buildNes = (): NesProjectState => {
  const nes = createDefaultNesProjectState();
  return {
    ...nes,
    backgroundPalettes: [
      [16, 17, 18, 19],
      [20, 21, 22, 23],
      [24, 25, 26, 27],
      [28, 29, 30, 31],
    ],
    spritePalettes: [
      [32, 33, 34, 35],
      [36, 37, 38, 39],
      [40, 41, 42, 43],
      [44, 45, 46, 47],
    ],
  };
};

describe("drawingPath palette resolver", () => {
  it("uses NES background palettes for screen rendering when NES state exists", () => {
    const nes = buildNes();

    expect(resolveScreenRenderPalettes(legacyPalettes, nes)).toEqual(
      nes.backgroundPalettes,
    );
  });

  it("uses NES sprite palettes for sprite rendering when NES state exists", () => {
    const nes = buildNes();

    expect(resolveSpriteRenderPalettes(legacyPalettes, nes)).toEqual(
      nes.spritePalettes,
    );
  });

  it("falls back to legacy palettes when NES state is missing", () => {
    expect(resolveScreenRenderPalettes(legacyPalettes)).toEqual(legacyPalettes);
    expect(resolveSpriteRenderPalettes(legacyPalettes)).toEqual(legacyPalettes);
  });
});
