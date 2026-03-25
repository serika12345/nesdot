import * as O from "fp-ts/Option";
import { describe, expect, it } from "vitest";
import {
  createDefaultNesProjectState,
  NesSpritePalettes,
} from "../store/nesProjectState";
import {
  ColorIndexOfPalette,
  Screen,
  SpriteInScreen,
  SpriteTile,
} from "../store/projectState";
import { nesIndexToCssHex } from "./palette";
import {
  renderScreenToHexArray,
  renderSpriteTileToHexArray,
} from "./rendering";
import { getArrayItem, getMatrixItem } from "../utils/arrayAccess";

const palettes: NesSpritePalettes = [
  [45, 1, 21, 34],
  [13, 2, 22, 35],
  [7, 3, 23, 36],
  [9, 4, 24, 37],
];

function createSpriteTile(fill: ColorIndexOfPalette = 0): SpriteTile {
  return {
    width: 8,
    height: 8,
    paletteIndex: 0,
    pixels: Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => fill),
    ),
  };
}

function createScreen(sprites: SpriteInScreen[]): Screen {
  return {
    width: 256,
    height: 240,
    sprites,
  };
}

function createScreenSprite(
  overrides: Partial<SpriteInScreen>,
  fill: ColorIndexOfPalette = 0,
): SpriteInScreen {
  return {
    ...createSpriteTile(fill),
    x: 0,
    y: 0,
    spriteIndex: 0,
    priority: "front",
    flipH: false,
    flipV: false,
    ...overrides,
  };
}

function setTilePixel(
  tile: SpriteTile,
  y: number,
  x: number,
  value: ColorIndexOfPalette,
): void {
  const rowOption = getArrayItem(tile.pixels, y);
  expect(O.isSome(rowOption)).toBe(true);
  if (O.isNone(rowOption)) {
    return;
  }

  rowOption.value[x] = value;
}

function expectRenderedHex(
  rendered: string[][],
  y: number,
  x: number,
  expectedIndex: number,
): void {
  const pixelOption = getMatrixItem(rendered, y, x);
  expect(O.isSome(pixelOption)).toBe(true);
  if (O.isNone(pixelOption)) {
    return;
  }

  expect(pixelOption.value).toBe(nesIndexToCssHex(expectedIndex));
}

describe("renderSpriteTileToHexArray", () => {
  it("keeps palette slot 0 transparent for sprite exports", () => {
    const tile = createSpriteTile();
    setTilePixel(tile, 0, 1, 1);
    setTilePixel(tile, 0, 2, 2);
    setTilePixel(tile, 0, 3, 3);

    const rendered = renderSpriteTileToHexArray(tile, palettes);

    expectRenderedHex(rendered, 0, 0, 0);
    expectRenderedHex(rendered, 0, 1, 1);
    expectRenderedHex(rendered, 0, 2, 21);
    expectRenderedHex(rendered, 0, 3, 34);
  });
});

describe("renderScreenToHexArray", () => {
  it("renders sprite pixels over the background and treats sprite slot 0 as transparent", () => {
    const nes = createDefaultNesProjectState();
    nes.universalBackgroundColor = 45;
    nes.nameTable.tileIndices[0] = 0;
    nes.attributeTable.bytes[0] = 0b00000001;
    nes.backgroundPalettes[1] = [45, 2, 22, 35];
    Array.from({ length: 8 }, (_, y) => y).forEach((y) => {
      nes.chrBytes[y] = 0b00000000;
      nes.chrBytes[8 + y] = 0b11111111;
    });

    const sprite = createScreenSprite({});
    setTilePixel(sprite, 0, 0, 0);
    setTilePixel(sprite, 0, 1, 1);

    const rendered = renderScreenToHexArray(createScreen([sprite]), nes);

    expectRenderedHex(rendered, 0, 0, 22);
    expectRenderedHex(rendered, 0, 1, 1);
  });

  it("draws lower OAM index (array order) entries in front when sprites overlap", () => {
    const nes = createDefaultNesProjectState();
    const lowOamSprite = createScreenSprite(
      {
        x: 4,
        y: 4,
        spriteIndex: 0,
        priority: "front",
        flipH: false,
        flipV: false,
      },
      1,
    );
    const highOamSprite = createScreenSprite(
      {
        x: 4,
        y: 4,
        spriteIndex: 1,
        priority: "front",
        flipH: false,
        flipV: false,
      },
      3,
    );

    const rendered = renderScreenToHexArray(
      createScreen([lowOamSprite, highOamSprite]),
      nes,
    );

    expectRenderedHex(rendered, 4, 4, 1);
  });

  it("keeps lower OAM sprite selected before applying behind-bg priority", () => {
    const nes = createDefaultNesProjectState();
    nes.universalBackgroundColor = 45;
    nes.nameTable.tileIndices[0] = 0;
    nes.attributeTable.bytes[0] = 0b00000001;
    nes.backgroundPalettes[1] = [45, 2, 22, 35];
    Array.from({ length: 8 }, (_, y) => y).forEach((y) => {
      nes.chrBytes[y] = 0b00000000;
      nes.chrBytes[8 + y] = 0b11111111;
    });

    const behindBgSprite: SpriteInScreen = {
      ...createScreenSprite(
        {
          x: 0,
          y: 0,
          spriteIndex: 0,
          priority: "behindBg",
          flipH: false,
          flipV: false,
        },
        1,
      ),
    };
    const frontSprite: SpriteInScreen = {
      ...createScreenSprite(
        {
          x: 0,
          y: 0,
          spriteIndex: 1,
          priority: "front",
          flipH: false,
          flipV: false,
        },
        3,
      ),
    };

    const rendered = renderScreenToHexArray(
      createScreen([behindBgSprite, frontSprite]),
      nes,
    );

    expectRenderedHex(rendered, 0, 0, 22);
  });

  it("applies horizontal and vertical flip when drawing sprites", () => {
    const nes = createDefaultNesProjectState();
    const sprite: SpriteInScreen = {
      ...createScreenSprite(
        {
          x: 10,
          y: 10,
          spriteIndex: 0,
          priority: "front",
          flipH: true,
          flipV: true,
        },
        0,
      ),
    };
    setTilePixel(sprite, 0, 0, 1);

    const rendered = renderScreenToHexArray(createScreen([sprite]), nes);

    expectRenderedHex(rendered, 10, 10, 0);
    expectRenderedHex(rendered, 17, 17, 1);
  });

  it("renders background directly from nameTable+attributeTable+CHR when NES state is provided", () => {
    const nes = createDefaultNesProjectState();
    nes.universalBackgroundColor = 45;
    nes.nameTable.tileIndices[0] = 0;
    nes.attributeTable.bytes[0] = 0b00000010;
    nes.backgroundPalettes[2] = [45, 5, 6, 7];
    nes.chrBytes[0] = 0b10000000;
    nes.chrBytes[8] = 0b10000000;

    const rendered = renderScreenToHexArray(createScreen([]), nes);

    expectRenderedHex(rendered, 0, 0, 7);
    expectRenderedHex(rendered, 0, 1, 45);
  });
});
