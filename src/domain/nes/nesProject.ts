import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

const NES_NAME_TABLE_WIDTH_TILES = 32;
const NES_NAME_TABLE_HEIGHT_TILES = 30;
export const NES_NAME_TABLE_TILE_COUNT =
  NES_NAME_TABLE_WIDTH_TILES * NES_NAME_TABLE_HEIGHT_TILES;

const NES_ATTRIBUTE_TABLE_WIDTH_BYTES = 8;
const NES_ATTRIBUTE_TABLE_HEIGHT_BYTES = 8;
export const NES_ATTRIBUTE_TABLE_BYTE_COUNT =
  NES_ATTRIBUTE_TABLE_WIDTH_BYTES * NES_ATTRIBUTE_TABLE_HEIGHT_BYTES;

export const NES_OAM_ENTRY_COUNT = 64;
export const NES_EMPTY_BACKGROUND_TILE_INDEX = -1;

export type NesPaletteIndex = 0 | 1 | 2 | 3;
export type NesColorIndex = number;
type PatternTableSelect = 0 | 1;

export type NesSubPalette = [
  NesColorIndex,
  NesColorIndex,
  NesColorIndex,
  NesColorIndex,
];
export type NesBackgroundPalettes = [
  NesSubPalette,
  NesSubPalette,
  NesSubPalette,
  NesSubPalette,
];
export type NesSpritePalettes = [
  NesSubPalette,
  NesSubPalette,
  NesSubPalette,
  NesSubPalette,
];

export interface NesNameTable {
  widthTiles: 32;
  heightTiles: 30;
  tileIndices: number[];
}

export interface NesAttributeTable {
  widthBytes: 8;
  heightBytes: 8;
  bytes: number[];
}

export interface OamSpriteEntry {
  y: number;
  tileIndex: number;
  attributeByte: number;
  x: number;
}

interface PpuControlState {
  spriteSize: 8 | 16;
  backgroundPatternTable: PatternTableSelect;
  spritePatternTable: PatternTableSelect;
}

export interface NesProjectState {
  chrBytes: number[];
  nameTable: NesNameTable;
  attributeTable: NesAttributeTable;
  universalBackgroundColor: number;
  backgroundPalettes: NesBackgroundPalettes;
  spritePalettes: NesSpritePalettes;
  oam: OamSpriteEntry[];
  ppuControl: PpuControlState;
}

const isPaletteIndex = (value: number): value is NesPaletteIndex =>
  value === 0 || value === 1 || value === 2 || value === 3;

/**
 * 未配置セルを専用 sentinel で埋めたネームテーブルを生成します。
 * BG タイル 0..255 をすべて編集可能に保ちつつ、未配置セルが実タイルを参照しないようにします。
 */
export const createEmptyNameTable = (): NesNameTable => ({
  widthTiles: 32,
  heightTiles: 30,
  tileIndices: Array.from(
    { length: NES_NAME_TABLE_TILE_COUNT },
    () => NES_EMPTY_BACKGROUND_TILE_INDEX,
  ),
});

/**
 * 0 埋めされた空の属性テーブルを生成します。
 * すべての背景領域を既定パレットに揃えた状態から編集を始められるようにします。
 */
export const createEmptyAttributeTable = (): NesAttributeTable => ({
  widthBytes: 8,
  heightBytes: 8,
  bytes: Array.from({ length: NES_ATTRIBUTE_TABLE_BYTE_COUNT }, () => 0),
});

const createDefaultOam = (): OamSpriteEntry[] =>
  Array.from({ length: NES_OAM_ENTRY_COUNT }, () => ({
    y: 0,
    tileIndex: 0,
    attributeByte: 0,
    x: 0,
  }));

/**
 * 新規プロジェクト用の NES 状態を既定値で構築します。
 * CHR、背景、OAM、PPU 設定を一貫した初期状態でまとめて用意するための関数です。
 */
export const createDefaultNesProjectState = (): NesProjectState => ({
  chrBytes: Array.from({ length: 4096 }, () => 0),
  nameTable: createEmptyNameTable(),
  attributeTable: createEmptyAttributeTable(),
  universalBackgroundColor: 0,
  backgroundPalettes: [
    [0, 1, 21, 34],
    [0, 1, 21, 34],
    [0, 1, 21, 34],
    [0, 1, 21, 34],
  ],
  spritePalettes: [
    [0, 1, 21, 34],
    [0, 1, 21, 34],
    [0, 1, 21, 34],
    [0, 1, 21, 34],
  ],
  oam: createDefaultOam(),
  ppuControl: {
    spriteSize: 8,
    backgroundPatternTable: 0,
    spritePatternTable: 0,
  },
});

/**
 * ネームテーブル上のタイル座標を一次元 index へ変換します。
 * 座標の妥当性確認をここに閉じ込め、後続処理が安全に配列参照できるようにします。
 */
export const getNameTableLinearIndex = (
  tileX: number,
  tileY: number,
): E.Either<string, number> => {
  const isValidX = Number.isInteger(tileX) && tileX >= 0 && tileX < 32;
  const isValidY = Number.isInteger(tileY) && tileY >= 0 && tileY < 30;

  if (isValidX === false || isValidY === false) {
    return E.left(`tile coordinate out of range: (${tileX}, ${tileY})`);
  }

  return E.right(tileY * NES_NAME_TABLE_WIDTH_TILES + tileX);
};

/**
 * タイル座標から対応する属性テーブルのバイト位置を求めます。
 * 4x4 タイル単位の属性領域を名前付きで解決し、背景パレット参照の入口を統一します。
 */
export const getAttributeByteIndex = (
  tileX: number,
  tileY: number,
): E.Either<string, number> => {
  const nameTableIndex = getNameTableLinearIndex(tileX, tileY);
  if (E.isLeft(nameTableIndex)) {
    return nameTableIndex;
  }

  const attributeX = Math.floor(tileX / 4);
  const attributeY = Math.floor(tileY / 4);

  return E.right(attributeY * NES_ATTRIBUTE_TABLE_WIDTH_BYTES + attributeX);
};

/**
 * 指定タイル座標に適用される背景パレット番号を解決します。
 * 属性テーブルの象限ビットを読み取り、背景描画が NES 仕様どおりに色を選べるようにします。
 */
export const resolveBackgroundPaletteIndex = (
  attributeTable: NesAttributeTable,
  tileX: number,
  tileY: number,
): E.Either<string, NesPaletteIndex> => {
  const attributeIndexEither = getAttributeByteIndex(tileX, tileY);
  if (E.isLeft(attributeIndexEither)) {
    return attributeIndexEither;
  }

  const attributeByteOption = O.fromNullable(
    attributeTable.bytes[attributeIndexEither.right],
  );
  if (O.isNone(attributeByteOption)) {
    return E.left("attribute byte is missing");
  }
  const attributeByte = attributeByteOption.value;

  const isRightHalf = tileX % 4 >= 2;
  const isBottomHalf = tileY % 4 >= 2;
  const horizontalShift = isRightHalf ? 2 : 0;
  const verticalShift = isBottomHalf ? 4 : 0;
  const shift = horizontalShift + verticalShift;
  const paletteIndexValue = (attributeByte >> shift) & 0b11;

  if (isPaletteIndex(paletteIndexValue) === false) {
    return E.left(`invalid palette index: ${paletteIndexValue}`);
  }

  return E.right(paletteIndexValue);
};
