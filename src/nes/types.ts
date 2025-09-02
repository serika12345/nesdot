export type Pixel2bpp = 0 | 1 | 2 | 3;

// NESパレットのインデックス（0..63）
export type NesColorIndex = number;

// 4色パレット（palette[0]は透過スロット扱い）
export type Palette4 = [NesColorIndex, NesColorIndex, NesColorIndex, NesColorIndex];

export type SpriteSize = "8x8" | "8x16";

export interface SpriteTile {
    width: 8;
    height: 8 | 16;
    // ピクセル値は0..3（=パレット内インデックス）
    pixels: Pixel2bpp[][];
}

export interface ProjectState {
    spriteSize: SpriteSize;
    palette: Palette4;
    tile: SpriteTile; // 単一タイル編集ベース
}
