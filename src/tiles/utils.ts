// src/tiles/utils.ts
import { ColorIndexOfPalette, PaletteIndex, SpriteTile } from "../store/projectState";

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
