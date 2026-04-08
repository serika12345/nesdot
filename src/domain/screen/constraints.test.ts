import { describe, expect, it } from "vitest";
import { createDefaultNesProjectState } from "../nes/nesProject";
import { createEmptySpriteTile, type SpriteInScreen } from "../project/project";
import { createDefaultProjectStateV2 } from "../project/projectV2";
import {
  MAX_SCREEN_SPRITES,
  MAX_SPRITES_PER_SCANLINE,
  scanNesSpriteConstraints,
  scanProjectStateV2SpriteConstraints,
} from "./constraints";

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

describe("scanProjectStateV2SpriteConstraints", () => {
  it("reports scanline overflow from normalized screen sprites", () => {
    const state = createDefaultProjectStateV2();
    const nextSprites: ReadonlyArray<SpriteInScreen> = Array.from(
      { length: 9 },
      (_, index) => ({
        ...createEmptySpriteTile(8),
        x: index * 8,
        y: 0,
        spriteIndex: index,
        priority: "front",
        flipH: false,
        flipV: false,
      }),
    );
    const nextState = {
      ...state,
      screen: {
        ...state.screen,
        sprites: nextSprites,
      },
    };

    const result = scanProjectStateV2SpriteConstraints(nextState);

    expect(result.ok).toBe(false);
    expect(result.ok === false ? result.errors[0] : "").toContain(
      `上限(${MAX_SPRITES_PER_SCANLINE})`,
    );
    expect(result.ok === false ? result.errors[0] : "").toContain(
      "y=0, 1, 2, 3, 4, 5, 6, 7",
    );
  });
});
