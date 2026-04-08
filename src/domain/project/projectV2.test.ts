import { describe, expect, it } from "vitest";
import {
  PROJECT_BACKGROUND_TILE_COUNT,
  PROJECT_SPRITE_TILE_COUNT,
  SCREEN_BACKGROUND_PALETTE_INDEX_COUNT,
  SCREEN_BACKGROUND_TILE_INDEX_COUNT,
  createDefaultProjectStateV2,
} from "./projectV2";

describe("projectV2", () => {
  it("creates an 8x8 v2 project by default", () => {
    const state = createDefaultProjectStateV2();

    expect(state.formatVersion).toBe(2);
    expect(state.spriteSize).toBe(8);
    expect(state.spriteTiles).toHaveLength(PROJECT_SPRITE_TILE_COUNT);
    expect(state.backgroundTiles).toHaveLength(PROJECT_BACKGROUND_TILE_COUNT);
    expect(state.screen.background.tileIndices).toHaveLength(
      SCREEN_BACKGROUND_TILE_INDEX_COUNT,
    );
    expect(state.screen.background.paletteIndices).toHaveLength(
      SCREEN_BACKGROUND_PALETTE_INDEX_COUNT,
    );
    expect(state.spriteTiles.every((sprite) => sprite.height === 8)).toBe(true);
  });

  it("creates an 8x16 v2 project when requested", () => {
    const state = createDefaultProjectStateV2(16);

    expect(state.spriteSize).toBe(16);
    expect(state.spriteTiles).toHaveLength(PROJECT_SPRITE_TILE_COUNT);
    expect(state.spriteTiles.every((sprite) => sprite.height === 16)).toBe(
      true,
    );
  });
});
