import * as O from "fp-ts/Option";
import React, { useCallback, useEffect, useRef } from "react";
import { useProjectState } from "../../../application/state/projectStore";
import { renderScreenToHexArray } from "../../../domain/nes/rendering";

interface UseCanvasParams {
  scale?: number; // ピクセル拡大倍率
  showGrid?: boolean;
}

/**
 * スクリーンプレビュー用 canvas の描画とポインタ処理をまとめるフックです。
 * 現在の画面状態をピクセル表示へ変換し、コンポーネント側は canvas props を受け取るだけで済むようにします。
 */
export const useScreenCanvas = ({
  scale = 24,
  showGrid = true,
}: UseCanvasParams) => {
  const canvasRef = useRef<O.Option<HTMLCanvasElement>>(O.none);

  const drawAll = useCallback(() => {
    if (O.isNone(canvasRef.current)) return;
    const cvs = canvasRef.current.value;
    const ctxOption = O.fromNullable(cvs.getContext("2d"));
    if (O.isNone(ctxOption)) return;
    const ctx = ctxOption.value;
    const state = useProjectState.getState();
    const screen = state.screen;
    const nes = state.nes;
    const width = screen.width;
    const height = screen.height;

    cvs.width = width * scale;
    cvs.height = height * scale;
    ctx.imageSmoothingEnabled = false;

    const hexGrid = renderScreenToHexArray(screen, nes);

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
        ctx.fillStyle = hexOption.value;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      });
    });

    // グリッド
    if (showGrid === true) {
      if (scale >= 4) {
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
      }

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
  }, [scale, showGrid]);

  useEffect(() => {
    drawAll();

    const unsubscribe = useProjectState.subscribe(() => {
      drawAll();
    });

    return unsubscribe;
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
