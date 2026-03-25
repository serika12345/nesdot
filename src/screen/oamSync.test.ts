import { describe, expect, it } from "vitest";
import { createDefaultNesProjectState } from "../store/nesProjectState";
import { Screen, SpriteInScreen } from "../store/projectState";
import { mergeScreenIntoNesOam, toOamEntryFromScreenSprite } from "./oamSync";

const createSprite = (overrides: Partial<SpriteInScreen>): SpriteInScreen => ({
  width: 8,
  height: 8,
  paletteIndex: 0,
  pixels: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0)),
  x: 0,
  y: 0,
  spriteIndex: 0,
  priority: "front",
  flipH: false,
  flipV: false,
  ...overrides,
});

const createScreen = (sprites: SpriteInScreen[]): Screen => ({
  width: 256,
  height: 240,
  sprites,
});

describe("toOamEntryFromScreenSprite", () => {
  it("maps visible coordinates and sprite index into OAM representation", () => {
    const sprite = createSprite({
      x: 12,
      y: 34,
      spriteIndex: 56,
      paletteIndex: 2,
    });

    expect(toOamEntryFromScreenSprite(sprite)).toEqual({
      x: 12,
      y: 33,
      tileIndex: 56,
      attributeByte: 2,
    });
  });

  it("encodes palette, priority and flip flags in attribute byte", () => {
    const sprite = createSprite({
      x: 12,
      y: 34,
      spriteIndex: 56,
      paletteIndex: 2,
      priority: "behindBg",
      flipH: true,
      flipV: true,
    });

    expect(toOamEntryFromScreenSprite(sprite)).toEqual({
      x: 12,
      y: 33,
      tileIndex: 56,
      attributeByte: 226,
    });
  });
});

describe("mergeScreenIntoNesOam", () => {
  it("replaces nes.oam with entries derived from screen sprites", () => {
    const nes = createDefaultNesProjectState();
    const screen = createScreen([
      createSprite({ x: 1, y: 10, spriteIndex: 3, paletteIndex: 1 }),
      createSprite({ x: 2, y: 20, spriteIndex: 4, paletteIndex: 3 }),
    ]);

    const merged = mergeScreenIntoNesOam(nes, screen);

    expect(merged.oam).toEqual([
      { x: 1, y: 9, tileIndex: 3, attributeByte: 1 },
      { x: 2, y: 19, tileIndex: 4, attributeByte: 3 },
    ]);
  });

  it("keeps non-OAM NES fields unchanged", () => {
    const nes = createDefaultNesProjectState();
    const screen = createScreen([]);

    const merged = mergeScreenIntoNesOam(nes, screen);

    expect(merged.ppuControl).toEqual(nes.ppuControl);
    expect(merged.backgroundPalettes).toEqual(nes.backgroundPalettes);
  });
});
