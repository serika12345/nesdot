import React from "react";
import { NES_PALETTE_HEX } from "../nes/palette";
import { Palette4, Pixel2bpp, SpriteTile } from "../nes/types";

interface Props {
    tile: SpriteTile;
    palette: Palette4;
    scale?: number; // ピクセル拡大倍率
    showGrid?: boolean;
    tool: "pen" | "eraser";
    activeColorIndex: Pixel2bpp; // 0..3（0は透明スロット）
    onChange: (next: SpriteTile) => void;
}

export const PixelCanvas: React.FC<Props> = ({
    tile,
    palette,
    scale = 24,
    showGrid = true,
    tool,
    activeColorIndex,
    onChange,
}) => {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const width = tile.width;
    const height = tile.height;

    const drawAll = React.useCallback(() => {
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
                    const hex = NES_PALETTE_HEX[palette[v]];
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
    }, [tile, palette, scale, showGrid, width, height]);

    React.useEffect(() => {
        drawAll();
    }, [drawAll]);

    const paintingRef = React.useRef(false);

    const applyAt = (px: number, py: number) => {
        if (px < 0 || py < 0 || px >= width || py >= height) return;
        const next: SpriteTile = {
            ...tile,
            pixels: tile.pixels.map((row) => row.slice()) as Pixel2bpp[][],
        };
        next.pixels[py][px] = tool === "pen" ? activeColorIndex : 0;
        onChange(next);
    };

    const handlePointer = (e: React.PointerEvent) => {
        const cvs = canvasRef.current!;
        const rect = cvs.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / scale);
        const y = Math.floor((e.clientY - rect.top) / scale);
        if (paintingRef.current) applyAt(x, y);
    };

    return (
        <canvas
            ref={canvasRef}
            style={{ border: "1px solid #aaa", touchAction: "none" }}
            onPointerDown={(e) => {
                paintingRef.current = true;
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                handlePointer(e);
            }}
            onPointerMove={handlePointer}
            onPointerUp={(e) => {
                paintingRef.current = false;
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            }}
            onContextMenu={(e) => e.preventDefault()}
        />
    );
};
