export type CanvasSize = {
    width: 256;
    height: 240;
};

// 利用可能な56色のインデックス 0 - 55
export type NESColorIndex = number;
// 透明色のインデックス。TODO: ここを後でリテラルにすれば透明色を1つもつ制約を型レベルで強制できる。
export type TransParentColorIndex = number;
// パレットは直接い色情報を持つ
export type SpritePalette = [TransParentColorIndex, NESColorIndex, NESColorIndex, NESColorIndex];
// BG及びスプライトについて4パレットずつ
export type SpritePalettes = [SpritePalette, SpritePalette, SpritePalette, SpritePalette];
// パレット内の4色のうちどれを使うか
export type PaletteColorIndex = 0 | 1 | 2 | 3;
// 8x8ドットのタイル
export type Tile = {
    paletteIndex: 0 | 1 | 2 | 3; // どのパレットを使うか
    pixels: PaletteColorIndex[][];
};
// スプライトタイルの最大数
export type MaximumSpriteNumber = 64;
// 同一ライン上に表示できるスプライトピクセルの最大数
export type MaximumSpritePixelOnTheSameLine = 8;

// 4パレットで共通の1色として背景色を持つ。 4 + 3 * 3 = 13色利用可能
export type BGColorIndex = number;
export type BGPalette = [BGColorIndex, NESColorIndex, NESColorIndex, NESColorIndex];
export type BGPalettes = [BGPalette, BGPalette, BGPalette, BGPalette];
export type BGTile = {
    paletteIndex: 0 | 1 | 2 | 3;
    pixels: PaletteColorIndex[][];
};
// TODO: 左上から2*2タイルずつ、パレットを共有する必要があるのでランタイムで保証すること
