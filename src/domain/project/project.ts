import {
  createDefaultNesProjectState,
  NesProjectState,
} from "../nes/nesProject";

export type ColorIndexOfPalette = 0 | 1 | 2 | 3;
export type PaletteIndex = 0 | 1 | 2 | 3;
export type SpritePriority = "front" | "behindBg";
export type ProjectSpriteSize = 8 | 16;

export interface SpriteTile {
  width: 8;
  height: 8 | 16;
  paletteIndex: PaletteIndex;
  pixels: ColorIndexOfPalette[][];
}

export type SpriteInScreen = SpriteTile & {
  x: number;
  y: number;
  spriteIndex: number;
  priority: SpritePriority;
  flipH: boolean;
  flipV: boolean;
};

export type Screen = {
  width: 256;
  height: 240;
  sprites: SpriteInScreen[];
};

export type Backing = {
  pixels: ColorIndexOfPalette[][];
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  fill: ColorIndexOfPalette;
};

export type SpriteTileND = SpriteTile & { __backing?: Backing };

export interface ProjectState {
  spriteSize: ProjectSpriteSize;
  screen: Screen;
  sprites: SpriteTile[];
  nes: NesProjectState;
}

export const createEmptySpriteTile = (
  height: ProjectSpriteSize,
  paletteIndex: PaletteIndex = 0,
): SpriteTile => ({
  width: 8,
  height,
  paletteIndex,
  pixels: Array.from({ length: height }, () => Array.from({ length: 8 }, () => 0)),
});

export const createDefaultProjectState = (
  spriteSize: ProjectSpriteSize = 8,
): ProjectState => {
  const nes = createDefaultNesProjectState();

  return {
    spriteSize,
    screen: {
      width: 256,
      height: 240,
      sprites: [],
    },
    sprites: Array.from({ length: 64 }, () => createEmptySpriteTile(spriteSize)),
    nes: {
      ...nes,
      ppuControl: {
        ...nes.ppuControl,
        spriteSize,
      },
    },
  };
};
