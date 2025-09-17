import { useCallback, useRef } from "react";
import { NES_PALETTE_HEX } from "../../nes/palette";
import { ColorIndexOfPalette, SpriteTile } from "../../store/projectState";

/**
 * 8x8タイルのゴースト（透明PNG）を生成し、ポインタに追従させて表示するためのフック
 * - ゴースト要素の作成/移動/破棄
 * - クリックされた位置のセルインデックスを見て 8*8 タイルを特定し、そのタイルをゴースト表示
 */
export interface UseGhostParams {
    scale: number; // ピクセル拡大倍率
    width: number; // スプライト全体の幅（px）
    height: number; // スプライト全体の高さ（px）
    tile: SpriteTile; // ピクセル配列
    palettes: number[][]; // パレット配列（useProjectStateの型に合わせる）
    currentSelectPalette: ColorIndexOfPalette;
}

export const useGhost = ({ scale, width, height, tile, palettes, currentSelectPalette }: UseGhostParams) => {
    // 追加：ドラッグ中の8x8タイルのゴースト管理
    const ghostImgRef = useRef<HTMLImageElement | null>(null);
    const dragInfoRef = useRef<{
        startTileX: number; // 8の倍数の列
        startTileY: number; // 8の倍数の行
        // ポインタからタイル左上（キャンバス内表示位置＝スケール後）までのオフセット（CSS px）
        offsetX: number;
        offsetY: number;
    } | null>(null);

    // 追加：8x8タイルをオフスクリーンに描画して dataURL を返す（透明背景）
    const makeTileGhostDataURL = useCallback(
        (tileX: number, tileY: number) => {
            const pad = 2; // 少し余白（視認性）
            const ghostCvs = document.createElement("canvas");
            ghostCvs.width = 8 * scale + pad * 2;
            ghostCvs.height = 8 * scale + pad * 2;
            const gctx = ghostCvs.getContext("2d")!;
            gctx.imageSmoothingEnabled = false;

            // 透明背景に対象8x8を拡大描画
            for (let yy = 0; yy < 8; yy++) {
                for (let xx = 0; xx < 8; xx++) {
                    const gx = tileX + xx;
                    const gy = tileY + yy;
                    if (gx < 0 || gy < 0 || gx >= width || gy >= height) continue;
                    const colorIdx = tile.pixels[gy][gx];
                    if (colorIdx !== 0) {
                        const hex = NES_PALETTE_HEX[palettes[currentSelectPalette][colorIdx]];
                        gctx.fillStyle = hex;
                        gctx.fillRect(pad + xx * scale, pad + yy * scale, scale, scale);
                    }
                }
            }

            // 薄い影（見やすさ）
            gctx.save();
            gctx.globalCompositeOperation = "destination-over";
            gctx.filter = "drop-shadow(0 4px 10px rgba(0,0,0,.25))";
            gctx.fillStyle = "rgba(0,0,0,0)";
            gctx.fillRect(0, 0, ghostCvs.width, ghostCvs.height);
            gctx.restore();

            return { url: ghostCvs.toDataURL("image/png"), w: ghostCvs.width, h: ghostCvs.height, pad };
        },
        [scale, width, height, tile.pixels, palettes, currentSelectPalette]
    );

    // 追加：ゴースト要素の作成
    const createGhost = useCallback((imgURL: string) => {
        const img = document.createElement("img");
        img.src = imgURL;
        img.style.position = "fixed";
        img.style.pointerEvents = "none";
        img.style.opacity = "0.9";
        img.style.transform = "translate(-50%, -50%)"; // ポインタ中央合わせ
        img.style.zIndex = "9999";
        document.body.appendChild(img);
        ghostImgRef.current = img;
    }, []);

    // 追加：ゴーストの位置更新（クライアント座標で）
    const moveGhost = useCallback((clientX: number, clientY: number) => {
        const img = ghostImgRef.current;
        if (!img) return;
        img.style.left = `${clientX}px`;
        img.style.top = `${clientY}px`;
    }, []);

    // 追加：後始末
    const cleanupGhost = useCallback(() => {
        const img = ghostImgRef.current;
        if (img?.parentNode) img.parentNode.removeChild(img);
        ghostImgRef.current = null;
        dragInfoRef.current = null;
    }, []);

    /**
     * 並べ替えモード開始時に8x8タイルのゴースト生成
     * - e: PointerEvent（クライアント座標取得のため）
     * - canvasRect: キャンバスの getBoundingClientRect()
     * - cellX, cellY: クリックセル座標（拡大前のピクセル単位）
     */
    const beginGhostAtCell = useCallback(
        (e: React.PointerEvent, canvasRect: DOMRect, cellX: number, cellY: number) => {
            const startTileX = Math.floor(cellX / 8) * 8;
            const startTileY = Math.floor(cellY / 8) * 8;

            // ゴースト画像を作成
            const { url } = makeTileGhostDataURL(startTileX, startTileY);
            createGhost(url);

            // ポインタからタイル左上（表示上の位置）までのオフセット（CSS px）
            const tileLeft = canvasRect.left + startTileX * scale;
            const tileTop = canvasRect.top + startTileY * scale;
            dragInfoRef.current = {
                startTileX,
                startTileY,
                offsetX: e.clientX - tileLeft,
                offsetY: e.clientY - tileTop,
            };

            // 初期位置
            moveGhost(e.clientX, e.clientY);
        },
        [makeTileGhostDataURL, createGhost, moveGhost, scale]
    );

    return {
        // 状態（必要に応じて参照）
        ghostImgRef,
        dragInfoRef,

        // 操作API
        beginGhostAtCell,
        moveGhost,
        cleanupGhost,
    };
};
