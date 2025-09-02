import { create } from "zustand";

export type Pixel2bpp = 0 | 1 | 2 | 3;

// NESパレットのインデックス（0..63）
export type NesColorIndex = number;

// 4色パレット（palette[0]は透過スロット扱い）
export type Palette4 = [NesColorIndex, NesColorIndex, NesColorIndex, NesColorIndex];

type SpriteSize = "8x8" | "8x16";

export interface SpriteTile {
    width: 8;
    height: 8 | 16;
    // ピクセル値は0..3（=パレット内インデックス）
    pixels: Pixel2bpp[][];
}

interface ProjectState {
    spriteSize: SpriteSize;
    palette: Palette4;
    tile: SpriteTile; // 単一タイル編集ベース
}

function makeEmptyTile(height: 8 | 16): SpriteTile {
    const pixels: Pixel2bpp[][] = Array.from({ length: height }, () => Array.from({ length: 8 }, () => 0 as Pixel2bpp));
    return { width: 8, height, pixels };
}

const DEFAULT_STATE: ProjectState = {
    spriteSize: "8x8",
    palette: [0, 1, 21, 34], // 初期パレット（0=透明扱い）
    tile: makeEmptyTile(8),
};

export const useProjectState = create<ProjectState>((set) => ({
    ...DEFAULT_STATE,
}));
