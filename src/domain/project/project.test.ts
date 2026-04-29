import { describe, expect, it } from "vitest";
import { NES_EMPTY_BACKGROUND_TILE_INDEX } from "../nes/nesProject";
import {
  PROJECT_BACKGROUND_TILE_COUNT,
  PROJECT_SPRITE_TILE_COUNT,
  SCREEN_BACKGROUND_PALETTE_INDEX_COUNT,
  SCREEN_BACKGROUND_TILE_INDEX_COUNT,
  createDefaultProjectState,
} from "./project";

describe("project", () => {
  it("creates an 8x8 project by default", () => {
    const state = createDefaultProjectState();

    expect(state.formatVersion).toBe(2);
    expect(state.spriteSize).toBe(8);
    expect(state.spriteTiles).toHaveLength(PROJECT_SPRITE_TILE_COUNT);
    expect(state.spriteTiles.every((sprite) => sprite.height === 8)).toBe(true);
    expect(state.backgroundTiles).toHaveLength(PROJECT_BACKGROUND_TILE_COUNT);
    expect(state.screen.background.tileIndices).toHaveLength(
      SCREEN_BACKGROUND_TILE_INDEX_COUNT,
    );
    expect(
      state.screen.background.tileIndices.every(
        (tileIndex) => tileIndex === NES_EMPTY_BACKGROUND_TILE_INDEX,
      ),
    ).toBe(true);
    expect(state.screen.background.paletteIndices).toHaveLength(
      SCREEN_BACKGROUND_PALETTE_INDEX_COUNT,
    );
  });

  it("creates an 8x16 project when requested", () => {
    const state = createDefaultProjectState(16);

    expect(state.spriteSize).toBe(16);
    expect(state.spriteTiles).toHaveLength(PROJECT_SPRITE_TILE_COUNT);
    expect(state.spriteTiles.every((sprite) => sprite.height === 16)).toBe(
      true,
    );
  });
});
