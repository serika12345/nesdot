// src/tiles/utils.ts
import { Backing, ColorIndexOfPalette, PaletteIndex, SpriteTile, SpriteTileND } from "../store/projectState";

/** 8の倍数であることを検査 */
export function assertTileSize(w: number, h: number): void {
    if (w <= 0 || h <= 0 || w % 8 !== 0 || h % 8 !== 0) {
        throw new Error(`Tile size must be positive and multiples of 8: got ${w}x${h}`);
    }
}

/** タイル生成（既定は透明0で初期化） */
// ピクセル値は0..3（=パレット内インデックス）
export function makeTile(width: number, height: number, fill: ColorIndexOfPalette = 0, paletteIndex: PaletteIndex): SpriteTile {
    assertTileSize(width, height);
    const pixels: ColorIndexOfPalette[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
    return { width, height, pixels, paletteIndex };
}

/** ディープコピー（不変更新用） */
export function cloneTile(src: SpriteTile): SpriteTile {
    return {
        width: src.width,
        height: src.height,
        pixels: src.pixels.map((row) => row.slice()) as ColorIndexOfPalette[][],
        paletteIndex: src.paletteIndex,
    };
}

export type ResizeAnchor =
    | "top-left"
    | "top"
    | "top-right"
    | "left"
    | "center"
    | "right"
    | "bottom-left"
    | "bottom"
    | "bottom-right";

/**
 * タイルのリサイズ（拡張/トリミング両対応）
 * - 新規に作ったキャンバスへ、アンカー基準で既存ピクセルをコピー
 * - はみ出した部分はトリミング、拡張部分は fill で埋める
 */
export function resizeTile(
    src: SpriteTile,
    nextW: number,
    nextH: number,
    opts?: { anchor?: ResizeAnchor; fill?: ColorIndexOfPalette }
): SpriteTile {
    assertTileSize(nextW, nextH);
    const anchor = opts?.anchor ?? "top-left";
    const fill: ColorIndexOfPalette = opts?.fill ?? 0;

    const dst = makeTile(nextW, nextH, fill, src.paletteIndex);

    // アンカーに応じて貼り付けオフセットを計算
    const dx = computeOffset(anchor, src.width, nextW);
    const dy = computeOffset(anchor, src.height, nextH);

    for (let y = 0; y < src.height; y++) {
        const ty = y + dy;
        if (ty < 0 || ty >= nextH) continue;
        const srcRow = src.pixels[y];
        const dstRow = dst.pixels[ty];
        for (let x = 0; x < src.width; x++) {
            const tx = x + dx;
            if (tx < 0 || tx >= nextW) continue;
            dstRow[tx] = srcRow[x];
        }
    }
    return dst;
}

function computeOffset(anchor: ResizeAnchor, prev: number, next: number): number {
    switch (anchor) {
        case "top-left":
            return 0;
        case "top":
            return Math.floor((next - prev) / 2);
        case "top-right":
            return next - prev;
        case "left":
            return Math.floor((next - prev) / 2);
        case "center":
            return Math.floor((next - prev) / 2);
        case "right":
            return next - prev;
        case "bottom-left":
            return 0;
        case "bottom":
            return Math.floor((next - prev) / 2);
        case "bottom-right":
            return next - prev;
    }
}

/**
 * 裏キャンバスを初期化（なければ作る）
 */
function ensureBacking(tile: SpriteTileND, fill: ColorIndexOfPalette): Backing {
    if (tile.__backing) return tile.__backing;
    const b: Backing = {
        width: tile.width,
        height: tile.height,
        pixels: clonePixels(tile.pixels),
        offsetX: 0,
        offsetY: 0,
        fill,
    };
    tile.__backing = b;
    return b;
}

/**
 * バッファ拡張：ビューがはみ出す場合、裏キャンバスを必要サイズに拡張
 * 既存内容は保ち、足りない部分は fill で埋める
 */
function growBackingIfNeeded(b: Backing, viewLeft: number, viewTop: number, viewRight: number, viewBottom: number) {
    let needGrow = false;
    let newLeft = Math.min(0, viewLeft);
    let newTop = Math.min(0, viewTop);
    let newRight = Math.max(b.width, viewRight);
    let newBottom = Math.max(b.height, viewBottom);

    // 左・上に負方向へはみ出す場合はオフセット移動が必要
    const shiftX = newLeft < 0 ? -newLeft : 0;
    const shiftY = newTop < 0 ? -newTop : 0;
    if (shiftX || shiftY || newRight > b.width || newBottom > b.height) needGrow = true;

    if (!needGrow) return;

    const nextW = Math.max(newRight + shiftX, b.width + shiftX);
    const nextH = Math.max(newBottom + shiftY, b.height + shiftY);

    const next: ColorIndexOfPalette[][] = new Array(nextH);
    for (let y = 0; y < nextH; y++) {
        const row: ColorIndexOfPalette[] = new Array(nextW);
        for (let x = 0; x < nextW; x++) row[x] = b.fill;
        next[y] = row;
    }
    // 旧バッファを（shiftX, shiftY）だけ平行移動して貼り付け
    for (let y = 0; y < b.height; y++) {
        for (let x = 0; x < b.width; x++) {
            next[y + shiftY][x + shiftX] = b.pixels[y][x];
        }
    }
    b.pixels = next;
    b.width = nextW;
    b.height = nextH;
    b.offsetX += shiftX;
    b.offsetY += shiftY;
}

/**
 * 2D配列のディープコピー
 */
function clonePixels(src: ColorIndexOfPalette[][]): ColorIndexOfPalette[][] {
    return src.map((row) => row.slice());
}

/**
 * 非破壊リサイズ：ビューの変更のみ行い、画素は裏キャンバスで保持
 * - 新規に作ったキャンバスへ、アンカー基準で既存ピクセルをコピー
 * - はみ出した部分は裏キャンバスへ書き戻し（破棄しない）
 * - 拡張部分は裏キャンバスから復元、未定義は fill で埋める
 */
export function resizeTileND(
    src: SpriteTileND,
    nextW: number,
    nextH: number,
    opts?: { anchor?: ResizeAnchor; fill?: ColorIndexOfPalette }
): SpriteTileND {
    assertTileSize(nextW, nextH);
    const anchor = opts?.anchor ?? "top-left";
    const fill: ColorIndexOfPalette = opts?.fill ?? 0;

    // 裏キャンバスの用意
    const backing = ensureBacking(src, fill);

    // 現ビューの左上が裏キャンバス上でどこか（= backing.offset を基準に決まる）
    const curViewLeft = backing.offsetX;
    const curViewTop = backing.offsetY;
    const curViewRight = curViewLeft + src.width;
    const curViewBottom = curViewTop + src.height;

    // 「アンカーに応じた貼り付けオフセット」をビュー座標に変換
    // dx, dy は「旧ビューの中で」貼り付け先を決めるための移動量
    const dx = computeOffset(anchor, src.width, nextW);
    const dy = computeOffset(anchor, src.height, nextH);

    // 新ビューの左上（裏キャンバス座標）
    const nextViewLeft = curViewLeft + dx;
    const nextViewTop = curViewTop + dy;
    const nextViewRight = nextViewLeft + nextW;
    const nextViewBottom = nextViewTop + nextH;

    // 新ビューが裏キャンバスからはみ出すなら拡張
    growBackingIfNeeded(backing, nextViewLeft, nextViewTop, nextViewRight, nextViewBottom);

    // 1) 旧ビューの可視領域の内容を裏キャンバスへ「確定書き戻し」
    //    （src.pixels が正なので、これでビュー外へ出る画素も保持される）
    for (let y = 0; y < src.height; y++) {
        for (let x = 0; x < src.width; x++) {
            const bx = curViewLeft + x;
            const by = curViewTop + y;
            if (by >= 0 && by < backing.height && bx >= 0 && bx < backing.width) {
                backing.pixels[by][bx] = src.pixels[y][x];
            }
        }
    }

    // 2) 新しい可視タイルを作成（表示用バッファ）
    const dst = makeTile(nextW, nextH, fill, src.paletteIndex) as SpriteTileND;

    // 3) 裏キャンバスから新ビュー領域を読み出して dst へコピー（未定義は fill）
    for (let y = 0; y < nextH; y++) {
        const by = nextViewTop + y;
        const dstRow = dst.pixels[y];
        if (by < 0 || by >= backing.height) {
            // 全面 fill（makeTile 済みなので何もしない）
            continue;
        }
        for (let x = 0; x < nextW; x++) {
            const bx = nextViewLeft + x;
            if (bx < 0 || bx >= backing.width) continue;
            dstRow[x] = backing.pixels[by][bx];
        }
    }

    // 4) 新タイルへ裏キャンバス参照を引き継ぎ、ビューの原点を更新
    dst.__backing = backing;
    backing.offsetX = nextViewLeft;
    backing.offsetY = nextViewTop;

    return dst;
}
