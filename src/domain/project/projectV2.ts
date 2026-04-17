import {
  NES_EMPTY_BACKGROUND_TILE_INDEX,
  createDefaultNesProjectState,
  type NesBackgroundPalettes,
  type NesColorIndex,
  type NesSpritePalettes,
} from "../nes/nesProject";
import {
  createEmptySpriteTile,
  type ColorIndexOfPalette,
  type PaletteIndex,
  type ProjectSpriteSize,
  type SpriteInScreen,
  type SpriteTile,
} from "./project";

export const PROJECT_FORMAT_VERSION = 2;
export const PROJECT_SPRITE_TILE_COUNT = 64;
export const PROJECT_BACKGROUND_TILE_COUNT = 256;
export const SCREEN_BACKGROUND_WIDTH_TILES = 32;
export const SCREEN_BACKGROUND_HEIGHT_TILES = 30;
export const SCREEN_BACKGROUND_TILE_INDEX_COUNT =
  SCREEN_BACKGROUND_WIDTH_TILES * SCREEN_BACKGROUND_HEIGHT_TILES;
export const SCREEN_BACKGROUND_PALETTE_WIDTH = 16;
export const SCREEN_BACKGROUND_PALETTE_HEIGHT = 15;
export const SCREEN_BACKGROUND_PALETTE_INDEX_COUNT =
  SCREEN_BACKGROUND_PALETTE_WIDTH * SCREEN_BACKGROUND_PALETTE_HEIGHT;

export interface BackgroundTile {
  width: 8;
  height: 8;
  pixels: ReadonlyArray<ReadonlyArray<ColorIndexOfPalette>>;
}

export interface ScreenBackground {
  widthTiles: 32;
  heightTiles: 30;
  tileIndices: ReadonlyArray<number>;
  paletteIndices: ReadonlyArray<PaletteIndex>;
}

interface ProjectPalettes {
  universalBackgroundColor: NesColorIndex;
  background: NesBackgroundPalettes;
  sprite: NesSpritePalettes;
}

export interface ProjectStateV2 {
  formatVersion: 2;
  spriteSize: ProjectSpriteSize;
  spriteTiles: ReadonlyArray<SpriteTile>;
  backgroundTiles: ReadonlyArray<BackgroundTile>;
  screen: {
    width: 256;
    height: 240;
    background: ScreenBackground;
    sprites: ReadonlyArray<SpriteInScreen>;
  };
  palettes: ProjectPalettes;
  ppuControl: {
    backgroundPatternTable: 0 | 1;
    spritePatternTable: 0 | 1;
  };
}

const cloneBackgroundPalettes = (
  palettes: NesBackgroundPalettes,
): NesBackgroundPalettes => [
  [palettes[0][0], palettes[0][1], palettes[0][2], palettes[0][3]],
  [palettes[1][0], palettes[1][1], palettes[1][2], palettes[1][3]],
  [palettes[2][0], palettes[2][1], palettes[2][2], palettes[2][3]],
  [palettes[3][0], palettes[3][1], palettes[3][2], palettes[3][3]],
];

const cloneSpritePalettes = (
  palettes: NesSpritePalettes,
): NesSpritePalettes => [
  [palettes[0][0], palettes[0][1], palettes[0][2], palettes[0][3]],
  [palettes[1][0], palettes[1][1], palettes[1][2], palettes[1][3]],
  [palettes[2][0], palettes[2][1], palettes[2][2], palettes[2][3]],
  [palettes[3][0], palettes[3][1], palettes[3][2], palettes[3][3]],
];

export const createEmptyBackgroundTile = (): BackgroundTile => ({
  width: 8,
  height: 8,
  pixels: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0)),
});

export const createEmptyScreenBackground = (): ScreenBackground => ({
  widthTiles: 32,
  heightTiles: 30,
  tileIndices: Array.from(
    { length: SCREEN_BACKGROUND_TILE_INDEX_COUNT },
    () => NES_EMPTY_BACKGROUND_TILE_INDEX,
  ),
  paletteIndices: Array.from(
    { length: SCREEN_BACKGROUND_PALETTE_INDEX_COUNT },
    () => 0,
  ),
});

export const createDefaultProjectStateV2 = (
  spriteSize: ProjectSpriteSize = 8,
): ProjectStateV2 => {
  const nes = createDefaultNesProjectState();

  return {
    formatVersion: PROJECT_FORMAT_VERSION,
    spriteSize,
    spriteTiles: Array.from({ length: PROJECT_SPRITE_TILE_COUNT }, () =>
      createEmptySpriteTile(spriteSize),
    ),
    backgroundTiles: Array.from({ length: PROJECT_BACKGROUND_TILE_COUNT }, () =>
      createEmptyBackgroundTile(),
    ),
    screen: {
      width: 256,
      height: 240,
      background: createEmptyScreenBackground(),
      sprites: [],
    },
    palettes: {
      universalBackgroundColor: nes.universalBackgroundColor,
      background: cloneBackgroundPalettes(nes.backgroundPalettes),
      sprite: cloneSpritePalettes(nes.spritePalettes),
    },
    ppuControl: {
      backgroundPatternTable: nes.ppuControl.backgroundPatternTable,
      spritePatternTable: nes.ppuControl.spritePatternTable,
    },
  };
};
