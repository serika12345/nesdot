import * as O from "fp-ts/Option";
import React, { useCallback, useEffect, useRef } from "react";
import {
  getHexArrayForScreen,
  useProjectState,
} from "../../store/projectState";
import {
  fillRect,
  getCanvasSurface,
  resizeCanvasSurface,
  setFillStyle,
  setImageSmoothingEnabled,
  setLineWidth,
  setStrokeStyle,
  strokeLine,
} from "../../utils/canvasRuntime";

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
    const surfaceOption = getCanvasSurface(canvasRef.current.value);
    if (O.isNone(surfaceOption)) return;
    const surface = surfaceOption.value;

    resizeCanvasSurface(surface, width * scale, height * scale);
    setImageSmoothingEnabled(surface, false);

    const hexGrid = getHexArrayForScreen(screen);
    Array.from({ length: height }, (_, y) => y).forEach((y) => {
      Array.from({ length: width }, (_, x) => x).forEach((x) => {
        const rowOption = O.fromNullable(hexGrid[y]);
        if (O.isNone(rowOption)) {
          return;
        }
        const hexOption = O.fromNullable(rowOption.value[x]);
        if (O.isNone(hexOption)) {
          return;
        }
        setFillStyle(surface, hexOption.value);
        fillRect(surface, x * scale, y * scale, scale, scale);
      });
    });

    // グリッド
    if (showGrid === true) {
      setStrokeStyle(surface, "rgba(0,0,0,0.2)");
      setLineWidth(surface, 1);
      Array.from({ length: width + 1 }, (_, gx) => gx).forEach((gx) => {
        strokeLine(
          surface,
          gx * scale + 0.5,
          0,
          gx * scale + 0.5,
          height * scale,
        );
      });
      Array.from({ length: height + 1 }, (_, gy) => gy).forEach((gy) => {
        strokeLine(
          surface,
          0,
          gy * scale + 0.5,
          width * scale,
          gy * scale + 0.5,
        );
      });
      // 8x8境界強調
      setStrokeStyle(surface, "rgba(0,0,0,0.5)");
      Array.from(
        { length: Math.floor(width / 8) + 1 },
        (_, i) => i * 8,
      ).forEach((gx) => {
        strokeLine(
          surface,
          gx * scale + 0.5,
          0,
          gx * scale + 0.5,
          height * scale,
        );
      });
      Array.from(
        { length: Math.floor(height / 8) + 1 },
        (_, i) => i * 8,
      ).forEach((gy) => {
        strokeLine(
          surface,
          0,
          gy * scale + 0.5,
          width * scale,
          gy * scale + 0.5,
        );
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
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      paintingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      handlePointer(e);
    },
    [handlePointer],
  );

  const onPointerMove = handlePointer;

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      paintingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    [],
  );

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => e.preventDefault(),
    [],
  );

  // Canvas にそのまま渡せる props を返す
  const canvasProps: {
    ref: (node: HTMLCanvasElement | null) => void;
    onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onContextMenu: (e: React.MouseEvent) => void;
  } = {
    ref: (node: HTMLCanvasElement | null) => {
      canvasRef.current = O.fromNullable(node);
    },
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onContextMenu,
  };

  return { canvasRef, drawAll, canvasProps };
};
