import { describe, expect, it } from "vitest";
import { createDefaultProjectState } from "./project";

describe("project", () => {
  it("creates an 8x8 project by default", () => {
    const state = createDefaultProjectState();

    expect(state.spriteSize).toBe(8);
    expect(state.nes.ppuControl.spriteSize).toBe(8);
    expect(state.sprites).toHaveLength(64);
    expect(state.sprites.every((sprite) => sprite.height === 8)).toBe(true);
  });

  it("creates an 8x16 project when requested", () => {
    const state = createDefaultProjectState(16);

    expect(state.spriteSize).toBe(16);
    expect(state.nes.ppuControl.spriteSize).toBe(16);
    expect(state.sprites).toHaveLength(64);
    expect(state.sprites.every((sprite) => sprite.height === 16)).toBe(true);
  });
});
