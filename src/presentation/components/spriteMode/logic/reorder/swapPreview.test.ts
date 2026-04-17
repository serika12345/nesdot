import * as O from "fp-ts/Option";
import { describe, expect, it } from "vitest";
import { getSwapPreviewTile } from "./swapPreview";

describe("getSwapPreviewTile", () => {
  it("returns the top-left pixel of the 8x8 block for in-range cells", () => {
    const preview = getSwapPreviewTile(13, 10, 16, 16);

    expect(O.isSome(preview)).toBe(true);
    if (O.isNone(preview)) {
      return;
    }

    expect(preview.value.tileX).toBe(8);
    expect(preview.value.tileY).toBe(8);
  });

  it("returns none when the pointer is outside the canvas", () => {
    const outsideLeft = getSwapPreviewTile(-1, 3, 16, 16);
    const outsideRight = getSwapPreviewTile(16, 3, 16, 16);
    const outsideBottom = getSwapPreviewTile(3, 16, 16, 16);

    expect(O.isNone(outsideLeft)).toBe(true);
    expect(O.isNone(outsideRight)).toBe(true);
    expect(O.isNone(outsideBottom)).toBe(true);
  });

  it("keeps the destination tile anchored at 8x8 boundaries", () => {
    const nearEnd = getSwapPreviewTile(15, 15, 16, 16);

    expect(O.isSome(nearEnd)).toBe(true);
    if (O.isNone(nearEnd)) {
      return;
    }

    expect(nearEnd.value.tileX).toBe(8);
    expect(nearEnd.value.tileY).toBe(8);
  });
});
