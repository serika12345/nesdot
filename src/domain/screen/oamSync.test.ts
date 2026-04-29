import { describe, expect, it } from "vitest";
import { type SpriteInScreen } from "../project/project";
import { toOamEntryFromScreenSprite } from "./oamSync";

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
