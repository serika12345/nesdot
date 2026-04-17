import * as O from "fp-ts/Option";
import { describe, expect, it } from "vitest";
import {
  createCharacterSet,
  type CharacterSet,
} from "../../../../domain/characters/characterSet";
import { createDefaultNesProjectState } from "../../../../domain/nes/nesProject";
import { makeTile } from "../../../../domain/tiles/utils";
import { createScreenModeCharacterPreviewCards } from "./screenModeCharacterPreviewCards";

const PREVIEW_TRANSPARENT_HEX = "#00000000";

const getOnlyPreviewCard = (characterSets: ReadonlyArray<CharacterSet>) => {
  const cards = createScreenModeCharacterPreviewCards({
    characterSets,
    spritePalettes: createDefaultNesProjectState().spritePalettes,
    sprites: [makeTile(8, 0, 1), makeTile(8, 1, 2)],
  });

  const cardOption = O.fromNullable(cards[0]);
  expect(O.isSome(cardOption)).toBe(true);

  return cardOption;
};

describe("createScreenModeCharacterPreviewCards", () => {
  it("normalizes sprite placements into a compact preview grid", () => {
    const cardOption = getOnlyPreviewCard([
      createCharacterSet({
        id: "hero",
        name: "Hero",
        sprites: [
          { spriteIndex: 0, x: 20, y: 12, layer: 0 },
          { spriteIndex: 1, x: 28, y: 20, layer: 1 },
        ],
      }),
    ]);

    if (O.isNone(cardOption)) {
      return;
    }

    expect(cardOption.value.spriteCount).toBe(2);
    expect(O.isSome(cardOption.value.previewGrid)).toBe(true);

    if (O.isNone(cardOption.value.previewGrid)) {
      return;
    }

    expect(cardOption.value.previewGrid.value).toHaveLength(16);

    const firstRowOption = O.fromNullable(
      cardOption.value.previewGrid.value[0],
    );
    expect(O.isSome(firstRowOption)).toBe(true);

    if (O.isNone(firstRowOption)) {
      return;
    }

    expect(firstRowOption.value).toHaveLength(16);

    const topLeftPixelOption = O.fromNullable(firstRowOption.value[0]);
    expect(O.isSome(topLeftPixelOption)).toBe(true);

    if (O.isNone(topLeftPixelOption)) {
      return;
    }

    expect(topLeftPixelOption.value).not.toBe(PREVIEW_TRANSPARENT_HEX);

    const lastRowOption = O.fromNullable(
      cardOption.value.previewGrid.value[15],
    );
    expect(O.isSome(lastRowOption)).toBe(true);

    if (O.isNone(lastRowOption)) {
      return;
    }

    const bottomRightPixelOption = O.fromNullable(lastRowOption.value[15]);
    expect(O.isSome(bottomRightPixelOption)).toBe(true);

    if (O.isNone(bottomRightPixelOption)) {
      return;
    }

    expect(bottomRightPixelOption.value).not.toBe(PREVIEW_TRANSPARENT_HEX);
  });

  it("falls back to an empty preview when a referenced sprite is missing", () => {
    const cardOption = getOnlyPreviewCard([
      createCharacterSet({
        id: "invalid",
        name: "Invalid Hero",
        sprites: [{ spriteIndex: 3, x: 0, y: 0, layer: 0 }],
      }),
    ]);

    if (O.isNone(cardOption)) {
      return;
    }

    expect(O.isNone(cardOption.value.previewGrid)).toBe(true);
  });
});
