import * as O from "fp-ts/Option";
import React, { useCallback, useEffect, useRef } from "react";
import { NES_PALETTE_HEX } from "../../nes/palette";
import { useProjectState } from "../../store/projectState";

export type Tool = "pen" | "eraser";
export interface UseCanvasParams {
  scale?: number; // ピクセル拡大倍率
  showGrid?: boolean;
}

export const useScreenCanvas = ({
  scale = 24,
  showGrid = true,
}: UseCanvasParams) => {
  const screen = useProjectState((s) => s.screen);
  const canvasRef = useRef<O.Option<HTMLCanvasElement>>(O.none);

  const width = screen.width;
  const height = screen.height;

  const drawAll = useCallback(() => {
    if (O.isNone(canvasRef.current)) return;
    const cvs = canvasRef.current.value;
    const ctxOption = O.fromNullable(cvs.getContext("2d"));
    if (O.isNone(ctxOption)) return;
    const ctx = ctxOption.value;

    cvs.width = width * scale;
    cvs.height = height * scale;
    ctx.imageSmoothingEnabled = false;

    // 背景（チェッカ）
    ctx.fillStyle = "#ddd";
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = "#eee";
    Array.from({ length: height }, (_, y) => y).forEach((y) => {
      Array.from({ length: width }, (_, x) => x).forEach((x) => {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      });
    });

    // TODO: スプライト描画
    screen.sprites.forEach((sprite) => {
      const spriteTileOption = O.fromNullable(
        useProjectState.getState().sprites[sprite.spriteIndex],
      );
      if (O.isNone(spriteTileOption)) return;
      const spriteTile = spriteTileOption.value;
      Array.from({ length: spriteTile.height }, (_, py) => py).forEach((py) => {
        Array.from({ length: spriteTile.width }, (_, px) => px).forEach(
          (px) => {
            const colorIndex = sprite.pixels[py][px];
            if (colorIndex !== 0) {
              const nesColorIndex =
                useProjectState.getState().palettes[sprite.paletteIndex][
                  colorIndex
                ];
              const hex = NES_PALETTE_HEX[nesColorIndex];
              ctx.fillStyle = hex;
              ctx.fillRect(
                (sprite.x + px) * scale,
                (sprite.y + py) * scale,
                scale,
                scale,
              );
            }
          },
        );
      });
    });

    // グリッド
    if (showGrid === true) {
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      Array.from({ length: width + 1 }, (_, gx) => gx).forEach((gx) => {
        ctx.beginPath();
        ctx.moveTo(gx * scale + 0.5, 0);
        ctx.lineTo(gx * scale + 0.5, height * scale);
        ctx.stroke();
      });
      Array.from({ length: height + 1 }, (_, gy) => gy).forEach((gy) => {
        ctx.beginPath();
        ctx.moveTo(0, gy * scale + 0.5);
        ctx.lineTo(width * scale, gy * scale + 0.5);
        ctx.stroke();
      });
      // 8x8境界強調
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      Array.from(
        { length: Math.floor(width / 8) + 1 },
        (_, i) => i * 8,
      ).forEach((gx) => {
        ctx.beginPath();
        ctx.moveTo(gx * scale + 0.5, 0);
        ctx.lineTo(gx * scale + 0.5, height * scale);
        ctx.stroke();
      });
      Array.from(
        { length: Math.floor(height / 8) + 1 },
        (_, i) => i * 8,
      ).forEach((gy) => {
        ctx.beginPath();
        ctx.moveTo(0, gy * scale + 0.5);
        ctx.lineTo(width * scale, gy * scale + 0.5);
        ctx.stroke();
      });
    }
  }, [scale, showGrid, screen, width, height]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  const paintingRef = useRef(false);

  const applyAt = useCallback((px: number, py: number) => {
    void px;
    void py;
  }, []);

  const handlePointer = useCallback(
    (e: React.PointerEvent) => {
      if (O.isNone(canvasRef.current)) return;
      const cvs = canvasRef.current.value;
      const rect = cvs.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / scale); // 列
      const y = Math.floor((e.clientY - rect.top) / scale); // 行
      if (paintingRef.current) applyAt(x, y);
    },
    [scale, applyAt],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      paintingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handlePointer(e);
    },
    [handlePointer],
  );

  const onPointerMove = handlePointer;

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    paintingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => e.preventDefault(),
    [],
  );

  // Canvas にそのまま渡せる props を返す
  const canvasProps = {
    ref: (node: HTMLCanvasElement | null) => {
      canvasRef.current = O.fromNullable(node);
    },
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onContextMenu,
  } as const;

  return { canvasRef, drawAll, canvasProps };
};
