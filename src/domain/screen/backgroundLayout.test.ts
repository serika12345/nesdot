import { isLeft, isRight } from "fp-ts/Either";
import { describe, expect, it } from "vitest";
import { createEmptyScreenBackground } from "../project/projectV2";
import {
  getScreenBackgroundTileLinearIndex,
  setScreenBackgroundTile,
} from "./backgroundLayout";

describe("backgroundLayout", () => {
  it("resolves a visible screen tile coordinate into a linear index", () => {
    const result = getScreenBackgroundTileLinearIndex(31, 29);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(959);
    }
  });

  it("updates the targeted tile slot", () => {
    const background = createEmptyScreenBackground();
    const result = setScreenBackgroundTile(background, 1, 1, 42);

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.tileIndices[33]).toBe(42);
    }
  });

  it("rejects out-of-bounds tile coordinates", () => {
    const background = createEmptyScreenBackground();
    const result = setScreenBackgroundTile(background, 32, 0, 7);

    expect(isLeft(result)).toBe(true);
  });
});
