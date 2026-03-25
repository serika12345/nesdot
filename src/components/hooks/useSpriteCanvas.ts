import * as O from "fp-ts/Option";
import React, { useCallback, useEffect, useRef } from "react";
import { NES_PALETTE_HEX } from "../../nes/palette";
import {
  ColorIndexOfPalette,
  SpriteTile,
  useProjectState,
} from "../../store/projectState";
import { useGhost } from "./useGhost";
import { useSwap } from "./useSwap";

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
  const canvasRef = useRef<O.Option<HTMLCanvasElement>>(O.none);

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
  const { swap } = useSwap();
  // --- ここまで ---

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

    // ピクセル描画
    Array.from({ length: height }, (_, y) => y).forEach((y) => {
      Array.from({ length: width }, (_, x) => x).forEach((x) => {
        const HexToColorIndex = tile.pixels[y][x];
        if (HexToColorIndex !== 0) {
          // スプライト編集時はパレット切り替えに追従させる
          const hex =
            NES_PALETTE_HEX[palettes[currentSelectPalette][HexToColorIndex]];
          ctx.fillStyle = hex;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
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
        pixels: tile.pixels.map((row) =>
          row.slice(),
        ) as ColorIndexOfPalette[][],
      };
      next.pixels[py][px] = tool === "pen" ? activeColorIndex : 0;
      onChange(next, target);
    },
    [tile, tool, activeColorIndex, onChange, width, height, target],
  );

  const handlePointer = useCallback(
    (e: React.PointerEvent) => {
      if (O.isNone(canvasRef.current)) return;
      const cvs = canvasRef.current.value;
      const rect = cvs.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / scale); // 列
      const y = Math.floor((e.clientY - rect.top) / scale); // 行

      if (paintingRef.current && !isChangeOrderMode) {
        applyAt(x, y);
        return;
      }

      if (paintingRef.current && isChangeOrderMode) {
        // 並べ替えモード中はポインタ座標に常時追従させる。
        // 条件付きにすると一部領域で更新されず、途中で引っかかったように見える。
        moveGhost(e.clientX, e.clientY);
        return;
      }
    },
    [scale, applyAt, isChangeOrderMode, moveGhost],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      paintingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handlePointer(e);

      // 追加：並べ替えモード開始時に8x8タイルのゴースト生成
      if (isChangeOrderMode === true) {
        if (O.isNone(canvasRef.current)) {
          return;
        }
        const cvs = canvasRef.current.value;
        const rect = cvs.getBoundingClientRect();
        const cellX = Math.floor((e.clientX - rect.left) / scale);
        const cellY = Math.floor((e.clientY - rect.top) / scale);
        beginGhostAtCell(e, rect, cellX, cellY); // ← フックAPI呼び出し
      }
    },
    [handlePointer, isChangeOrderMode, scale, beginGhostAtCell],
  );

  const onPointerMove = handlePointer;

  const onPointerCancel = useCallback(() => {
    paintingRef.current = false;
    cleanupGhost();
  }, [cleanupGhost]);

  const onLostPointerCapture = useCallback(() => {
    paintingRef.current = false;
    cleanupGhost();
  }, [cleanupGhost]);

  // 既存：onPointerUp を差し替え
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      paintingRef.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      // 追加：並べ替えモード中は、ドロップ位置のタイルと開始位置のタイルを入れ替える
      if (isChangeOrderMode && O.isSome(dragInfoRef.current)) {
        if (O.isNone(canvasRef.current)) {
          cleanupGhost();
          return;
        }
        const cvs = canvasRef.current.value;
        const rect = cvs.getBoundingClientRect();
        const dropCellX = Math.floor((e.clientX - rect.left) / scale);
        const dropCellY = Math.floor((e.clientY - rect.top) / scale);

        // ドロップ先の8x8ブロック左上（ピクセル単位）
        const dropTileX = Math.floor(dropCellX / 8) * 8;
        const dropTileY = Math.floor(dropCellY / 8) * 8;

        const { startTileX, startTileY } = dragInfoRef.current.value;

        // 同一タイルなら何もしない
        if (dropTileX !== startTileX || dropTileY !== startTileY) {
          // キャンバス範囲内チェック（安全側）
          const inBounds = (x: number, y: number) =>
            x >= 0 && y >= 0 && x + 7 < width && y + 7 < height;

          if (
            inBounds(startTileX, startTileY) &&
            inBounds(dropTileX, dropTileY)
          ) {
            const nextPixels = swap(
              tile.pixels,
              startTileX,
              startTileY,
              dropTileX,
              dropTileY,
            );

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
    [
      isChangeOrderMode,
      cleanupGhost,
      tile,
      onChange,
      target,
      width,
      height,
      scale,
      dragInfoRef,
      swap,
    ],
  );

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
    onPointerCancel,
    onLostPointerCapture,
    onContextMenu,
  } as const;

  return { canvasRef, drawAll, canvasProps };
};
