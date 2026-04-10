import * as O from "fp-ts/Option";
import { describe, expect, it } from "vitest";
import { getMatrixItem } from "../../shared/arrayAccess";
import {
  ColorIndexOfPalette,
  Screen,
  SpriteInScreen,
  SpriteTile,
} from "../project/project";
import {
  createDefaultProjectStateV2,
  createEmptyBackgroundTile,
  type BackgroundTile,
  type ProjectStateV2,
} from "../project/projectV2";
import {
  createDefaultNesProjectState,
  NES_EMPTY_BACKGROUND_TILE_INDEX,
  NesBackgroundPalettes,
  NesSpritePalettes,
} from "./nesProject";
import { nesIndexToCssHex } from "./palette";
import { buildNesProjection } from "./projection";
import {
  renderBackgroundTileToHexArray,
  renderProjectStateV2ToHexArray,
  renderScreenToHexArray,
  renderSpriteTileToHexArray,
} from "./rendering";

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

function createBackgroundTile(fill: ColorIndexOfPalette = 0): BackgroundTile {
  return {
    ...createEmptyBackgroundTile(),
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

function setTilePixel<
  T extends {
    pixels: ReadonlyArray<ReadonlyArray<ColorIndexOfPalette>>;
  },
>(tile: T, y: number, x: number, value: ColorIndexOfPalette): T {
  return {
    ...tile,
    pixels: tile.pixels.map((row, rowIndex) =>
      rowIndex === y
        ? row.map((pixel, columnIndex) => (columnIndex === x ? value : pixel))
        : row,
    ),
  };
}

const cloneNesState = (
  source: ReturnType<typeof createDefaultNesProjectState>,
): ReturnType<typeof createDefaultNesProjectState> => ({
  ...source,
  nameTable: {
    ...source.nameTable,
    tileIndices: source.nameTable.tileIndices.slice(),
  },
  attributeTable: {
    ...source.attributeTable,
    bytes: source.attributeTable.bytes.slice(),
  },
  backgroundPalettes: [
    [
      source.backgroundPalettes[0][0],
      source.backgroundPalettes[0][1],
      source.backgroundPalettes[0][2],
      source.backgroundPalettes[0][3],
    ],
    [
      source.backgroundPalettes[1][0],
      source.backgroundPalettes[1][1],
      source.backgroundPalettes[1][2],
      source.backgroundPalettes[1][3],
    ],
    [
      source.backgroundPalettes[2][0],
      source.backgroundPalettes[2][1],
      source.backgroundPalettes[2][2],
      source.backgroundPalettes[2][3],
    ],
    [
      source.backgroundPalettes[3][0],
      source.backgroundPalettes[3][1],
      source.backgroundPalettes[3][2],
      source.backgroundPalettes[3][3],
    ],
  ],
  spritePalettes: [
    [
      source.spritePalettes[0][0],
      source.spritePalettes[0][1],
      source.spritePalettes[0][2],
      source.spritePalettes[0][3],
    ],
    [
      source.spritePalettes[1][0],
      source.spritePalettes[1][1],
      source.spritePalettes[1][2],
      source.spritePalettes[1][3],
    ],
    [
      source.spritePalettes[2][0],
      source.spritePalettes[2][1],
      source.spritePalettes[2][2],
      source.spritePalettes[2][3],
    ],
    [
      source.spritePalettes[3][0],
      source.spritePalettes[3][1],
      source.spritePalettes[3][2],
      source.spritePalettes[3][3],
    ],
  ],
  chrBytes: source.chrBytes.slice(),
  oam: source.oam.map((entry) => ({ ...entry })),
});

const updateBackgroundPalettes = (
  palettes: NesBackgroundPalettes,
  paletteIndex: number,
  next: [number, number, number, number],
): NesBackgroundPalettes => [
  paletteIndex === 0 ? next : palettes[0],
  paletteIndex === 1 ? next : palettes[1],
  paletteIndex === 2 ? next : palettes[2],
  paletteIndex === 3 ? next : palettes[3],
];

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
    const tile = setTilePixel(
      setTilePixel(setTilePixel(createSpriteTile(), 0, 1, 1), 0, 2, 2),
      0,
      3,
      3,
    );

    const rendered = renderSpriteTileToHexArray(tile, palettes);

    expectRenderedHex(rendered, 0, 0, 0);
    expectRenderedHex(rendered, 0, 1, 1);
    expectRenderedHex(rendered, 0, 2, 21);
    expectRenderedHex(rendered, 0, 3, 34);
  });
});

describe("renderBackgroundTileToHexArray", () => {
  it("renders palette slot 0 with the universal background color", () => {
    const tile = setTilePixel(
      setTilePixel(setTilePixel(createBackgroundTile(), 0, 1, 1), 0, 2, 2),
      0,
      3,
      3,
    );

    const rendered = renderBackgroundTileToHexArray(tile, [45, 1, 21, 34], 13);

    expectRenderedHex(rendered, 0, 0, 13);
    expectRenderedHex(rendered, 0, 1, 1);
    expectRenderedHex(rendered, 0, 2, 21);
    expectRenderedHex(rendered, 0, 3, 34);
  });
});

describe("renderScreenToHexArray", () => {
  it("renders sprite pixels over the background and treats sprite slot 0 as transparent", () => {
    const nesBase = cloneNesState(createDefaultNesProjectState());
    const nes = {
      ...nesBase,
      universalBackgroundColor: 45,
      nameTable: {
        ...nesBase.nameTable,
        tileIndices: nesBase.nameTable.tileIndices.map((value, index) =>
          index === 0 ? 0 : value,
        ),
      },
      attributeTable: {
        ...nesBase.attributeTable,
        bytes: nesBase.attributeTable.bytes.map((value, index) =>
          index === 0 ? 0b00000001 : value,
        ),
      },
      backgroundPalettes: updateBackgroundPalettes(
        nesBase.backgroundPalettes,
        1,
        [45, 2, 22, 35],
      ),
      chrBytes: nesBase.chrBytes.map((value, index) => {
        if (index >= 0 && index < 8) {
          return 0b00000000;
        }
        if (index >= 8 && index < 16) {
          return 0b11111111;
        }
        return value;
      }),
    };

    const sprite = setTilePixel(
      setTilePixel(createScreenSprite({}), 0, 0, 0),
      0,
      1,
      1,
    );

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
    const nesBase = cloneNesState(createDefaultNesProjectState());
    const nes = {
      ...nesBase,
      universalBackgroundColor: 45,
      nameTable: {
        ...nesBase.nameTable,
        tileIndices: nesBase.nameTable.tileIndices.map((value, index) =>
          index === 0 ? 0 : value,
        ),
      },
      attributeTable: {
        ...nesBase.attributeTable,
        bytes: nesBase.attributeTable.bytes.map((value, index) =>
          index === 0 ? 0b00000001 : value,
        ),
      },
      backgroundPalettes: updateBackgroundPalettes(
        nesBase.backgroundPalettes,
        1,
        [45, 2, 22, 35],
      ),
      chrBytes: nesBase.chrBytes.map((value, index) => {
        if (index >= 0 && index < 8) {
          return 0b00000000;
        }
        if (index >= 8 && index < 16) {
          return 0b11111111;
        }
        return value;
      }),
    };

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
    const sprite: SpriteInScreen = setTilePixel(
      {
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
      },
      0,
      0,
      1,
    );

    const rendered = renderScreenToHexArray(createScreen([sprite]), nes);

    expectRenderedHex(rendered, 10, 10, 0);
    expectRenderedHex(rendered, 17, 17, 1);
  });

  it("renders background directly from nameTable+attributeTable+CHR when NES state is provided", () => {
    const nesBase = cloneNesState(createDefaultNesProjectState());
    const nes = {
      ...nesBase,
      universalBackgroundColor: 45,
      nameTable: {
        ...nesBase.nameTable,
        tileIndices: nesBase.nameTable.tileIndices.map((value, index) =>
          index === 0 ? 0 : value,
        ),
      },
      attributeTable: {
        ...nesBase.attributeTable,
        bytes: nesBase.attributeTable.bytes.map((value, index) =>
          index === 0 ? 0b00000010 : value,
        ),
      },
      backgroundPalettes: updateBackgroundPalettes(
        nesBase.backgroundPalettes,
        2,
        [45, 5, 6, 7],
      ),
      chrBytes: nesBase.chrBytes.map((value, index) => {
        if (index === 0 || index === 8) {
          return 0b10000000;
        }
        return value;
      }),
    };

    const rendered = renderScreenToHexArray(createScreen([]), nes);

    expectRenderedHex(rendered, 0, 0, 7);
    expectRenderedHex(rendered, 0, 1, 45);
  });

  it("treats the empty background tile sentinel as unplaced even if tile 255 has pixels", () => {
    const nesBase = cloneNesState(createDefaultNesProjectState());
    const lastTileChrStart = 255 * 16;
    const nes = {
      ...nesBase,
      universalBackgroundColor: 45,
      backgroundPalettes: updateBackgroundPalettes(
        nesBase.backgroundPalettes,
        0,
        [45, 5, 6, 7],
      ),
      nameTable: {
        ...nesBase.nameTable,
        tileIndices: nesBase.nameTable.tileIndices.map(
          () => NES_EMPTY_BACKGROUND_TILE_INDEX,
        ),
      },
      chrBytes: nesBase.chrBytes.map((value, index) => {
        if (index === lastTileChrStart || index === lastTileChrStart + 8) {
          return 0b10000000;
        }

        return value;
      }),
    };

    const rendered = renderScreenToHexArray(createScreen([]), nes);

    expectRenderedHex(rendered, 0, 0, 45);
  });

  it("renders background from the normalized v2 project state through NES projection", () => {
    const state = createDefaultProjectStateV2();
    const nextBackgroundPalettes: ProjectStateV2["palettes"]["background"] = [
      state.palettes.background[0],
      state.palettes.background[1],
      [45, 5, 6, 7],
      state.palettes.background[3],
    ];
    const nextState: ProjectStateV2 = {
      ...state,
      backgroundTiles: state.backgroundTiles.map((tile, tileIndex) =>
        tileIndex === 0 ? setTilePixel(tile, 0, 0, 3) : tile,
      ),
      palettes: {
        ...state.palettes,
        universalBackgroundColor: 45,
        background: nextBackgroundPalettes,
      },
      screen: {
        ...state.screen,
        background: {
          ...state.screen.background,
          tileIndices: state.screen.background.tileIndices.map((tile, index) =>
            index === 0 ? 0 : tile,
          ),
          paletteIndices: state.screen.background.paletteIndices.map(
            (paletteIndex, index) => (index === 0 ? 2 : paletteIndex),
          ),
        },
      },
    };

    const rendered = renderScreenToHexArray(
      {
        width: nextState.screen.width,
        height: nextState.screen.height,
        sprites: Array.from(nextState.screen.sprites),
      },
      buildNesProjection(nextState),
    );

    expectRenderedHex(rendered, 0, 0, 7);
    expectRenderedHex(rendered, 0, 1, 45);
  });

  it("renders directly from a normalized v2 project state", () => {
    const state = createDefaultProjectStateV2();
    const nextBackgroundPalettes: ProjectStateV2["palettes"]["background"] = [
      state.palettes.background[0],
      state.palettes.background[1],
      [45, 5, 6, 7],
      state.palettes.background[3],
    ];
    const nextState: ProjectStateV2 = {
      ...state,
      backgroundTiles: state.backgroundTiles.map((tile, tileIndex) =>
        tileIndex === 0 ? setTilePixel(tile, 0, 0, 3) : tile,
      ),
      palettes: {
        ...state.palettes,
        universalBackgroundColor: 45,
        background: nextBackgroundPalettes,
      },
      screen: {
        ...state.screen,
        background: {
          ...state.screen.background,
          tileIndices: state.screen.background.tileIndices.map((tile, index) =>
            index === 0 ? 0 : tile,
          ),
          paletteIndices: state.screen.background.paletteIndices.map(
            (paletteIndex, index) => (index === 0 ? 2 : paletteIndex),
          ),
        },
      },
    };

    const rendered = renderProjectStateV2ToHexArray(nextState);

    expectRenderedHex(rendered, 0, 0, 7);
    expectRenderedHex(rendered, 0, 1, 45);
  });
});
