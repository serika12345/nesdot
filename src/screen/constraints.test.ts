import { describe, expect, it } from "vitest";
import { Screen, SpriteInScreen } from "../store/projectState";
import {
  MAX_SCREEN_SPRITES,
  MAX_SPRITES_PER_SCANLINE,
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
    backgroundTiles: [],
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
