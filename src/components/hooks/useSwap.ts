import { useCallback } from "react";
import { ColorIndexOfPalette } from "../../store/projectState";

// 追加：8x8ブロックを入れ替える（破壊しない）
function swap8x8Blocks(
    srcPixels: ColorIndexOfPalette[][],
    ax: number,
    ay: number, // Aブロック左上（ピクセル単位）
    bx: number,
    by: number // Bブロック左上（ピクセル単位）
) {
    const next = srcPixels.map((r) => r.slice()) as ColorIndexOfPalette[][];
    for (let dy = 0; dy < 8; dy++) {
        for (let dx = 0; dx < 8; dx++) {
            const ayy = ay + dy,
                axx = ax + dx;
            const byy = by + dy,
                bxx = bx + dx;
            // 範囲安全化（念のため）
            if (ayy < 0 || ayy >= next.length) continue;
            if (byy < 0 || byy >= next.length) continue;
            if (axx < 0 || axx >= next[0].length) continue;
            if (bxx < 0 || bxx >= next[0].length) continue;
            const tmp = next[ayy][axx];
            next[ayy][axx] = next[byy][bxx];
            next[byy][bxx] = tmp as ColorIndexOfPalette;
        }
    }
    return next;
}

export const useSwap = () => {
    // 8x8ブロックを入れ替える関数を返す
    const swap = useCallback(
        (
            srcPixels: ColorIndexOfPalette[][],
            ax: number,
            ay: number, // Aブロック左上（ピクセル単位）
            bx: number,
            by: number // Bブロック左上（ピクセル単位）
        ) => {
            return swap8x8Blocks(srcPixels, ax, ay, bx, by);
        },
        []
    );
    return { swap };
};
