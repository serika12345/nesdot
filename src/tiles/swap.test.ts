import { describe, expect, it } from "vitest";
import { ColorIndexOfPalette } from "../store/projectState";
import { swap8x8Blocks } from "./swap";

function toColorIndexOfPalette(value: number): ColorIndexOfPalette {
  if (value === 0 || value === 1 || value === 2 || value === 3) {
    return value;
  }
  return 0;
}

function createPixels(): ColorIndexOfPalette[][] {
  return Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) =>
      toColorIndexOfPalette(Math.floor(y / 8) * 2 + Math.floor(x / 8)),
    ),
  );
}

describe("swap8x8Blocks", () => {
  it("swaps the selected blocks without mutating the source array", () => {
    const pixels = createPixels();

    const swapped = swap8x8Blocks(pixels, 0, 0, 8, 8);

    expect(swapped[0][0]).toBe(3);
    expect(swapped[8][8]).toBe(0);
    expect(swapped[0][8]).toBe(1);
    expect(swapped[8][0]).toBe(2);
    expect(pixels[0][0]).toBe(0);
    expect(pixels[8][8]).toBe(3);
  });
});
