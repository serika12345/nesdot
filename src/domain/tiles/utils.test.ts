import { describe, expect, it } from "vitest";
import { makeTile } from "./utils";

describe("makeTile", () => {
  it("creates an 8-pixel wide tile filled with the requested value", () => {
    const tile = makeTile(8, 3, 2);

    expect(tile.width).toBe(8);
    expect(tile.height).toBe(8);
    expect(tile.paletteIndex).toBe(3);
    expect(tile.pixels.every((row) => row.every((value) => value === 2))).toBe(
      true,
    );
  });
});
