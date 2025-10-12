import React, { useCallback, useEffect, useRef } from "react";
import { NES_PALETTE_HEX } from "../../nes/palette";
import { useProjectState } from "../../store/projectState";

export type Tool = "pen" | "eraser";
export interface UseCanvasParams {
    scale?: number; // ピクセル拡大倍率
    showGrid?: boolean;
}

export const useScreenCanvas = ({ scale = 24, showGrid = true }: UseCanvasParams) => {
    const screen = useProjectState((s) => s.screen);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const width = screen.width;
    const height = screen.height;

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

        // TODO: スプライト描画
        screen.sprites.forEach((sprite) => {
            const spriteTile = useProjectState.getState().sprites[sprite.spriteIndex];
            if (!spriteTile) return;
            for (let py = 0; py < spriteTile.height; py++) {
                for (let px = 0; px < spriteTile.width; px++) {
                    const colorIndex = sprite.pixels[py][px];
                    if (colorIndex === 0) continue; // 0は透明
                    const nesColorIndex = useProjectState.getState().palettes[sprite.paletteIndex][colorIndex];
                    const hex = useProjectState.getState().palettes ? NES_PALETTE_HEX[nesColorIndex] : "#f0f";
                    ctx.fillStyle = hex;
                    ctx.fillRect((sprite.x + px) * scale, (sprite.y + py) * scale, scale, scale);
                }
            }
        });

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
    }, [scale, showGrid, screen]);

    useEffect(() => {
        drawAll();
    }, [drawAll]);

    const paintingRef = useRef(false);

    const applyAt = useCallback((px: number, py: number) => {}, [width, height]);

    const handlePointer = useCallback(
        (e: React.PointerEvent) => {
            const cvs = canvasRef.current!;
            const rect = cvs.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / scale); // 列
            const y = Math.floor((e.clientY - rect.top) / scale); // 行
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
