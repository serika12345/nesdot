import React, { useCallback, useEffect, useRef } from "react";
import { NES_PALETTE_HEX } from "../../nes/palette";
import { ColorIndexOfPalette, SpriteTile, useProjectState } from "../../store/projectState";
import { useGhost } from "./useGhost";

export type Tool = "pen" | "eraser";
export interface UseCanvasParams {
    isChangeOrderMode?: boolean; // 並べ替えモード
    target: number; // 表示対象スプライトインデックス
    scale?: number; // ピクセル拡大倍率
    showGrid?: boolean;
    tool: Tool;
    currentSelectPalette: ColorIndexOfPalette;
    activeColorIndex: ColorIndexOfPalette; // 0..3（0は透明スロット）
    onChange: (next: SpriteTile, currentSprite: number) => void; // 更新を状態に伝える
}

export const useSpriteCanvas = ({
    isChangeOrderMode = false,
    target,
    scale = 24,
    showGrid = true,
    tool,
    currentSelectPalette,
    activeColorIndex,
    onChange,
}: UseCanvasParams) => {
    const palettes = useProjectState((s) => s.palettes);
    const tile = useProjectState((s) => s.sprites[target]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const width = tile.width;
    const height = tile.height;

    // --- ここからゴースト関連は useGhost に委譲 ---
    const { dragInfoRef, beginGhostAtCell, moveGhost, cleanupGhost } = useGhost({
        scale,
        width,
        height,
        tile,
        palettes,
        currentSelectPalette,
    });
    // --- ここまで ---

    const drawAll = useCallback(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext("2d");
        if (!ctx) return;

        cvs.width = width * scale;
        cvs.height = height * scale;
        ctx.imageSmoothingEnabled = false;

        // 背景（チェッカ）
        ctx.fillStyle = "#ddd";
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.fillStyle = "#eee";
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if ((x + y) % 2 === 0) {
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }

        // ピクセル描画
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const HexToColorIndex = tile.pixels[y][x];
                if (HexToColorIndex !== 0) {
                    // スプライト編集時はパレット切り替えに追従させる
                    const hex = NES_PALETTE_HEX[palettes[currentSelectPalette][HexToColorIndex]];
                    ctx.fillStyle = hex;
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }

        // グリッド
        if (showGrid) {
            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.lineWidth = 1;
            for (let gx = 0; gx <= width; gx++) {
                ctx.beginPath();
                ctx.moveTo(gx * scale + 0.5, 0);
                ctx.lineTo(gx * scale + 0.5, height * scale);
                ctx.stroke();
            }
            for (let gy = 0; gy <= height; gy++) {
                ctx.beginPath();
                ctx.moveTo(0, gy * scale + 0.5);
                ctx.lineTo(width * scale, gy * scale + 0.5);
                ctx.stroke();
            }
            // 8x8境界強調
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            for (let gx = 0; gx <= width; gx += 8) {
                ctx.beginPath();
                ctx.moveTo(gx * scale + 0.5, 0);
                ctx.lineTo(gx * scale + 0.5, height * scale);
                ctx.stroke();
            }
            for (let gy = 0; gy <= height; gy += 8) {
                ctx.beginPath();
                ctx.moveTo(0, gy * scale + 0.5);
                ctx.lineTo(width * scale, gy * scale + 0.5);
                ctx.stroke();
            }
        }
    }, [tile, palettes, scale, showGrid, width, height, currentSelectPalette]);

    useEffect(() => {
        drawAll();
    }, [drawAll]);

    const paintingRef = useRef(false);

    const applyAt = useCallback(
        (px: number, py: number) => {
            if (px < 0 || py < 0 || px >= width || py >= height) return;
            const next: SpriteTile = {
                ...tile,
                pixels: tile.pixels.map((row) => row.slice()) as ColorIndexOfPalette[][],
            };
            next.pixels[py][px] = tool === "pen" ? activeColorIndex : 0;
            onChange(next, target);
        },
        [tile, tool, activeColorIndex, onChange, width, height]
    );

    const handlePointer = useCallback(
        (e: React.PointerEvent) => {
            const cvs = canvasRef.current!;
            const rect = cvs.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / scale); // 列
            const y = Math.floor((e.clientY - rect.top) / scale); // 行

            if (paintingRef.current && !isChangeOrderMode) {
                applyAt(x, y);
                return;
            }

            if (paintingRef.current && isChangeOrderMode) {
                // 並べ替えモード時はドラッグでスプライト入れ替え
                const overIndex = Math.floor(x / 8) + Math.floor(y / 8) * (width / 8);
                if (overIndex !== target && overIndex >= 0 && overIndex < 64) {
                    // ゴースト追従（クリック開始時に作成済みの画像を移動）
                    moveGhost(e.clientX, e.clientY);

                    // 必要に応じてハイライトしたい場合は drawAll() 後に overIndex を枠描画
                    // （ここでは描画負荷を考慮して省略）
                }
                return;
            }
        },
        [scale, applyAt, isChangeOrderMode, target, width, moveGhost]
    );

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            paintingRef.current = true;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            handlePointer(e);

            // 追加：並べ替えモード開始時に8x8タイルのゴースト生成
            if (isChangeOrderMode) {
                const cvs = canvasRef.current!;
                const rect = cvs.getBoundingClientRect();
                const cellX = Math.floor((e.clientX - rect.left) / scale);
                const cellY = Math.floor((e.clientY - rect.top) / scale);
                beginGhostAtCell(e, rect, cellX, cellY); // ← フックAPI呼び出し
            }
        },
        [handlePointer, isChangeOrderMode, scale, beginGhostAtCell]
    );

    const onPointerMove = handlePointer;

    // ファイル内のどこか（onPointerUp の上など）にヘルパーを追加
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

    // 既存：onPointerUp を差し替え
    const onPointerUp = useCallback(
        (e: React.PointerEvent) => {
            paintingRef.current = false;
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);

            // 追加：並べ替えモード中は、ドロップ位置のタイルと開始位置のタイルを入れ替える
            if (isChangeOrderMode && dragInfoRef.current) {
                const cvs = canvasRef.current!;
                const rect = cvs.getBoundingClientRect();
                const dropCellX = Math.floor((e.clientX - rect.left) / scale);
                const dropCellY = Math.floor((e.clientY - rect.top) / scale);

                // ドロップ先の8x8ブロック左上（ピクセル単位）
                const dropTileX = Math.floor(dropCellX / 8) * 8;
                const dropTileY = Math.floor(dropCellY / 8) * 8;

                const { startTileX, startTileY } = dragInfoRef.current;

                // 同一タイルなら何もしない
                if (dropTileX !== startTileX || dropTileY !== startTileY) {
                    // キャンバス範囲内チェック（安全側）
                    const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x + 7 < width && y + 7 < height;

                    if (inBounds(startTileX, startTileY) && inBounds(dropTileX, dropTileY)) {
                        const nextPixels = swap8x8Blocks(tile.pixels, startTileX, startTileY, dropTileX, dropTileY);

                        // 状態更新（他フィールドはそのまま）
                        const next: SpriteTile = {
                            ...tile,
                            pixels: nextPixels,
                        };
                        onChange(next, target);
                    }
                }
            }

            // 追加：ゴーストの後始末
            cleanupGhost();
        },
        [isChangeOrderMode, cleanupGhost, tile, onChange, target, width, height, scale]
    );

    const onContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

    // Canvas にそのまま渡せる props を返す
    const canvasProps = {
        ref: canvasRef,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onContextMenu,
    } as const;

    return { canvasRef, drawAll, canvasProps };
};
