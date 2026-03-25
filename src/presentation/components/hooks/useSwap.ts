import { useCallback } from "react";
import { ColorIndexOfPalette } from "../../../domain/project/project";
import { swap8x8Blocks } from "../../../domain/tiles/swap";

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
