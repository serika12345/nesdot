import { describe, expect, it } from "vitest";
import { createDefaultProjectStateV2 } from "./projectV2";

describe("project", () => {
  it("creates an 8x8 project by default", () => {
    const state = createDefaultProjectStateV2();

    expect(state.spriteSize).toBe(8);
    expect(state.spriteTiles).toHaveLength(64);
    expect(state.spriteTiles.every((sprite) => sprite.height === 8)).toBe(true);
    expect(state.screen.background.tileIndices).toHaveLength(960);
    expect(state.screen.background.paletteIndices).toHaveLength(240);
    expect(state.backgroundTiles).toHaveLength(256);
  });

  it("creates an 8x16 project when requested", () => {
    const state = createDefaultProjectStateV2(16);

    expect(state.spriteSize).toBe(16);
    expect(state.spriteTiles).toHaveLength(64);
    expect(state.spriteTiles.every((sprite) => sprite.height === 16)).toBe(
      true,
    );
  });
});
