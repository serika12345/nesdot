import { type SpriteInScreen } from "../project/project";
import {
  PROJECT_BACKGROUND_TILE_COUNT,
  SCREEN_BACKGROUND_PALETTE_HEIGHT,
  SCREEN_BACKGROUND_PALETTE_WIDTH,
  createEmptyBackgroundTile,
  type ProjectStateV2,
  type ScreenBackground,
} from "../project/projectV2";
import { toOamEntryFromScreenSprite } from "../screen/oamSync";
import { encodeBackgroundTilesToChrBytes } from "./chr";
import {
  type NesAttributeTable,
  type NesBackgroundPalettes,
  type NesNameTable,
  type NesProjectState,
  type NesSpritePalettes,
  type OamSpriteEntry,
} from "./nesProject";

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

const resolveBackgroundPaletteRegion = (
  background: ScreenBackground,
  regionX: number,
  regionY: number,
): number => {
  const isValidX = regionX >= 0 && regionX < SCREEN_BACKGROUND_PALETTE_WIDTH;
  const isValidY = regionY >= 0 && regionY < SCREEN_BACKGROUND_PALETTE_HEIGHT;

  if (isValidX === false || isValidY === false) {
    return 0;
  }

  const linearIndex = regionY * SCREEN_BACKGROUND_PALETTE_WIDTH + regionX;

  return background.paletteIndices[linearIndex] ?? 0;
};

const buildChrBytes = (
  backgroundTiles: ProjectStateV2["backgroundTiles"],
): number[] =>
  Array.from(
    encodeBackgroundTilesToChrBytes(
      Array.from({ length: PROJECT_BACKGROUND_TILE_COUNT }, (_, tileIndex) => {
        return backgroundTiles[tileIndex] ?? createEmptyBackgroundTile();
      }),
    ),
  );

export const buildNameTable = (background: ScreenBackground): NesNameTable => ({
  widthTiles: 32,
  heightTiles: 30,
  tileIndices: Array.from(background.tileIndices),
});

export const buildAttributeTable = (
  background: ScreenBackground,
): NesAttributeTable => ({
  widthBytes: 8,
  heightBytes: 8,
  bytes: Array.from({ length: 64 }, (_, byteIndex) => {
    const byteX = byteIndex % 8;
    const byteY = Math.floor(byteIndex / 8);
    const topLeft = resolveBackgroundPaletteRegion(
      background,
      byteX * 2,
      byteY * 2,
    );
    const topRight = resolveBackgroundPaletteRegion(
      background,
      byteX * 2 + 1,
      byteY * 2,
    );
    const bottomLeft = resolveBackgroundPaletteRegion(
      background,
      byteX * 2,
      byteY * 2 + 1,
    );
    const bottomRight = resolveBackgroundPaletteRegion(
      background,
      byteX * 2 + 1,
      byteY * 2 + 1,
    );

    return topLeft | (topRight << 2) | (bottomLeft << 4) | (bottomRight << 6);
  }),
});

export const buildOamFromScreenSprites = (
  sprites: ReadonlyArray<SpriteInScreen>,
): OamSpriteEntry[] => sprites.map(toOamEntryFromScreenSprite);

export const buildNesProjection = (
  projectState: ProjectStateV2,
): NesProjectState => ({
  chrBytes: buildChrBytes(projectState.backgroundTiles),
  nameTable: buildNameTable(projectState.screen.background),
  attributeTable: buildAttributeTable(projectState.screen.background),
  universalBackgroundColor: projectState.palettes.universalBackgroundColor,
  backgroundPalettes: cloneBackgroundPalettes(projectState.palettes.background),
  spritePalettes: cloneSpritePalettes(projectState.palettes.sprite),
  oam: buildOamFromScreenSprites(projectState.screen.sprites),
  ppuControl: {
    spriteSize: projectState.spriteSize,
    backgroundPatternTable: projectState.ppuControl.backgroundPatternTable,
    spritePatternTable: projectState.ppuControl.spritePatternTable,
  },
});
