import { describe, expect, it } from "vitest";
import { createDefaultNesProjectState } from "../store/nesProjectState";
import { Screen, SpriteInScreen } from "../store/projectState";
import {
  MAX_SCREEN_SPRITES,
  MAX_SPRITES_PER_SCANLINE,
  scanNesSpriteConstraints,
  scanScreenSpriteConstraints,
} from "./constraints";

function createSprite(y: number, spriteIndex: number): SpriteInScreen {
  return {
    width: 8,
    height: 8,
    paletteIndex: 0,
    x: 0,
    y,
    spriteIndex,
    pixels: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 1)),
  };
}

function createScreen(sprites: SpriteInScreen[]): Screen {
  return {
    width: 256,
    height: 240,
    sprites,
  };
}

describe("scanScreenSpriteConstraints", () => {
  it("accepts screens within both sprite limits", () => {
    const sprites = Array.from(
      { length: MAX_SPRITES_PER_SCANLINE },
      (_, index) => createSprite(index * 8, index),
    );

    expect(scanScreenSpriteConstraints(createScreen(sprites))).toEqual({
      ok: true,
    });
  });

  it("reports when the total sprite count exceeds the global limit", () => {
    const sprites = Array.from({ length: MAX_SCREEN_SPRITES + 1 }, (_, index) =>
      createSprite(index * 8, index),
    );
    const result = scanScreenSpriteConstraints(createScreen(sprites));

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.errors[0] : "").toContain(
      `上限(${MAX_SCREEN_SPRITES})`,
    );
  });

  it("clips off-screen coordinates while checking per-scanline sprite count", () => {
    const sprites = Array.from(
      { length: MAX_SPRITES_PER_SCANLINE + 1 },
      (_, index) => createSprite(-4, index),
    );
    const result = scanScreenSpriteConstraints(createScreen(sprites));

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.errors[0] : "").toContain(
      `上限(${MAX_SPRITES_PER_SCANLINE})`,
    );
    expect(result.ok === false ? result.errors[0] : "").toContain(
      "y=0, 1, 2, 3",
    );
  });
});

describe("scanNesSpriteConstraints", () => {
  it("accepts NES state when all sprites are outside visible scanlines", () => {
    const nes = createDefaultNesProjectState();
    const hiddenOam = nes.oam.map((entry) => ({ ...entry, y: 240 }));

    expect(scanNesSpriteConstraints({ ...nes, oam: hiddenOam })).toEqual({
      ok: true,
    });
  });

  it("reports when oam entry count exceeds the global limit", () => {
    const nes = createDefaultNesProjectState();
    const extendedOam = [
      ...nes.oam,
      {
        x: 0,
        y: 0,
        tileIndex: 0,
        attributeByte: 0,
      },
    ];

    const result = scanNesSpriteConstraints({ ...nes, oam: extendedOam });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.errors[0] : "").toContain(
      `上限(${MAX_SCREEN_SPRITES})`,
    );
  });

  it("applies OAM y+1 rule and per-scanline 8-sprite limit", () => {
    const nes = createDefaultNesProjectState();
    const overflowOam = nes.oam.map((entry, index) =>
      index <= MAX_SPRITES_PER_SCANLINE
        ? { ...entry, y: -1 }
        : { ...entry, y: 240 },
    );

    const result = scanNesSpriteConstraints({ ...nes, oam: overflowOam });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.errors[0] : "").toContain(
      `上限(${MAX_SPRITES_PER_SCANLINE})`,
    );
    expect(result.ok === false ? result.errors[0] : "").toContain(
      "y=0, 1, 2, 3, 4, 5, 6, 7",
    );
  });

  it("uses sprite size from ppuControl for scanline evaluation", () => {
    const nes = createDefaultNesProjectState();
    const overflowOam = nes.oam.map((entry, index) =>
      index <= MAX_SPRITES_PER_SCANLINE
        ? { ...entry, y: 8 }
        : { ...entry, y: 240 },
    );
    const result = scanNesSpriteConstraints({
      ...nes,
      ppuControl: {
        ...nes.ppuControl,
        spriteSize: 16,
      },
      oam: overflowOam,
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.errors[0] : "").toContain(
      "y=9, 10, 11",
    );
    expect(result.ok === false ? result.errors[0] : "").toContain("18");
  });
});
