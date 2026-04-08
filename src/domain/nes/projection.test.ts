import { describe, expect, it } from "vitest";
import { getMatrixItem } from "../../shared/arrayAccess";
import { createEmptySpriteTile } from "../project/project";
import {
  BackgroundTile,
  ProjectStateV2,
  createDefaultProjectStateV2,
  createEmptyBackgroundTile,
} from "../project/projectV2";
import { nesIndexToCssHex } from "./palette";
import {
  buildAttributeTable,
  buildNameTable,
  buildNesProjection,
  buildOamFromScreenSprites,
} from "./projection";
import { renderScreenToHexArray } from "./rendering";

const setBackgroundTilePixel = (
  tile: BackgroundTile,
  y: number,
  x: number,
  value: 0 | 1 | 2 | 3,
): BackgroundTile => ({
  ...tile,
  pixels: tile.pixels.map((row, rowIndex) =>
    rowIndex === y
      ? row.map((pixel, columnIndex) => (columnIndex === x ? value : pixel))
      : row,
  ),
});

const updateBackgroundTile = (
  state: ProjectStateV2,
  tileIndex: number,
  nextTile: BackgroundTile,
): ProjectStateV2 => ({
  ...state,
  backgroundTiles: state.backgroundTiles.map((tile, index) =>
    index === tileIndex ? nextTile : tile,
  ),
});

const expectRenderedHex = (
  rendered: string[][],
  y: number,
  x: number,
  expectedIndex: number,
): void => {
  const pixelOption = getMatrixItem(rendered, y, x);
  expect(pixelOption._tag).toBe("Some");
  if (pixelOption._tag === "None") {
    return;
  }

  expect(pixelOption.value).toBe(nesIndexToCssHex(expectedIndex));
};

describe("projection", () => {
  it("builds a name table directly from normalized screen background tiles", () => {
    const state = createDefaultProjectStateV2();
    const nextState = {
      ...state,
      screen: {
        ...state.screen,
        background: {
          ...state.screen.background,
          tileIndices: state.screen.background.tileIndices.map((tile, index) =>
            index === 0 ? 7 : tile,
          ),
        },
      },
    };

    const nameTable = buildNameTable(nextState.screen.background);

    expect(nameTable.tileIndices[0]).toBe(7);
    expect(nameTable.tileIndices).toHaveLength(960);
  });

  it("packs 16x16 palette regions into NES attribute bytes", () => {
    const state = createDefaultProjectStateV2();
    const nextState = {
      ...state,
      screen: {
        ...state.screen,
        background: {
          ...state.screen.background,
          paletteIndices: state.screen.background.paletteIndices.map(
            (paletteIndex, index) => {
              if (index === 0) {
                return 1;
              }
              if (index === 1) {
                return 2;
              }
              if (index === 16) {
                return 3;
              }
              return paletteIndex;
            },
          ),
        },
      },
    };

    const attributeTable = buildAttributeTable(nextState.screen.background);

    expect(attributeTable.bytes[0]).toBe(0x39);
  });

  it("fills off-screen quadrants with palette 0 when deriving the last attribute row", () => {
    const state = createDefaultProjectStateV2();
    const nextState = {
      ...state,
      screen: {
        ...state.screen,
        background: {
          ...state.screen.background,
          paletteIndices: state.screen.background.paletteIndices.map(
            (paletteIndex, index) => {
              if (index === 224) {
                return 2;
              }
              if (index === 225) {
                return 3;
              }
              return paletteIndex;
            },
          ),
        },
      },
    };

    const attributeTable = buildAttributeTable(nextState.screen.background);

    expect(attributeTable.bytes[56]).toBe(0x0e);
  });

  it("builds OAM entries directly from normalized screen sprites", () => {
    const oam = buildOamFromScreenSprites([
      {
        ...createEmptySpriteTile(8, 2),
        x: 12,
        y: 34,
        spriteIndex: 9,
        priority: "behindBg",
        flipH: true,
        flipV: false,
      },
    ]);

    expect(oam).toEqual([
      {
        x: 12,
        y: 33,
        tileIndex: 9,
        attributeByte: 0b0110_0010,
      },
    ]);
  });

  it("renders background pixels from a normalized v2 project via NES projection", () => {
    const state = createDefaultProjectStateV2();
    const highlightedTile = setBackgroundTilePixel(
      state.backgroundTiles[0] ?? createEmptyBackgroundTile(),
      0,
      0,
      3,
    );
    const withTile = updateBackgroundTile(state, 0, highlightedTile);
    const nextBackgroundPalettes: ProjectStateV2["palettes"]["background"] = [
      withTile.palettes.background[0],
      withTile.palettes.background[1],
      [45, 5, 6, 7],
      withTile.palettes.background[3],
    ];
    const nextScreenSprites: ProjectStateV2["screen"]["sprites"] = [
      {
        ...createEmptySpriteTile(8, 0),
        x: 12,
        y: 34,
        spriteIndex: 9,
        priority: "front",
        flipH: false,
        flipV: false,
      },
    ];
    const withPalette: ProjectStateV2 = {
      ...withTile,
      palettes: {
        ...withTile.palettes,
        universalBackgroundColor: 45,
        background: nextBackgroundPalettes,
      },
      screen: {
        ...withTile.screen,
        background: {
          ...withTile.screen.background,
          tileIndices: withTile.screen.background.tileIndices.map(
            (tile, index) => (index === 0 ? 0 : tile),
          ),
          paletteIndices: withTile.screen.background.paletteIndices.map(
            (paletteIndex, index) => (index === 0 ? 2 : paletteIndex),
          ),
        },
        sprites: nextScreenSprites,
      },
    };

    const nesProjection = buildNesProjection(withPalette);
    const rendered = renderScreenToHexArray(
      {
        width: withPalette.screen.width,
        height: withPalette.screen.height,
        sprites: Array.from(withPalette.screen.sprites),
      },
      nesProjection,
    );

    expectRenderedHex(rendered, 0, 0, 7);
    expectRenderedHex(rendered, 0, 1, 45);
    expect(nesProjection.oam[0]).toEqual({
      x: 12,
      y: 33,
      tileIndex: 9,
      attributeByte: 0,
    });
  });
});
