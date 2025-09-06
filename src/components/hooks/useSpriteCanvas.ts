import React, { useCallback, useEffect, useRef } from "react";
import { NES_PALETTE_HEX } from "../../nes/palette";
import { ColorIndexOfPalette, SpriteTile, useProjectState } from "../../store/projectState";

export type Tool = "pen" | "eraser";
export interface UseCanvasParams {
    target: number; // 表示対象スプライトインデックス
    scale?: number; // ピクセル拡大倍率
    showGrid?: boolean;
    tool: Tool;
    currentSelectPalette: ColorIndexOfPalette;
    activeColorIndex: ColorIndexOfPalette; // 0..3（0は透明スロット）
    onChange: (next: SpriteTile, target: number) => void; // 更新を状態に伝える
}

export const useSpriteCanvas = ({
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
                const v = tile.pixels[y][x];
                if (v !== 0) {
                    // TODO: 混ぜられるのをどうするか？ スプライトを個別に作って合成できれば解決
                    const hex = NES_PALETTE_HEX[palettes[currentSelectPalette][v]];
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
            const x = Math.floor((e.clientX - rect.left) / scale);
            const y = Math.floor((e.clientY - rect.top) / scale);
            if (paintingRef.current) applyAt(x, y);
        },
        [scale, applyAt]
    );

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            paintingRef.current = true;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            handlePointer(e);
        },
        [handlePointer]
    );

    const onPointerMove = handlePointer;

    const onPointerUp = useCallback((e: React.PointerEvent) => {
        paintingRef.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

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
