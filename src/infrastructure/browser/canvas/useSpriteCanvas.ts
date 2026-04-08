import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import React, { useCallback, useEffect, useRef } from "react";
import { nesIndexToCssHex } from "../../../domain/nes/palette";
import {
  ColorIndexOfPalette,
  PaletteIndex,
  SpriteTile,
  useProjectState,
} from "../../../application/state/projectStore";
import { makeTile } from "../../../domain/tiles/utils";
import { getArrayItem, getMatrixItem } from "../../../shared/arrayAccess";
import { getSwapPreviewTile } from "../../../presentation/components/hooks/swapPreview";
import { useGhost } from "./useGhost";
import { useSwap } from "../../../presentation/components/hooks/useSwap";

export type Tool = "pen" | "eraser";
export type SpriteCanvasDisplayModel = Readonly<{
  scale?: number;
  showGrid?: boolean;
  target: number;
}>;

export type SpriteCanvasInteractionModel = Readonly<{
  activeColorIndex: ColorIndexOfPalette; // 0..3（0は透明スロット）
  currentSelectPalette: PaletteIndex;
  isChangeOrderMode?: boolean; // 並べ替えモード
  onChange: (next: SpriteTile, currentSprite: number) => void; // 更新を状態に伝える
  tool: Tool;
}>;

export interface UseCanvasParams {
  display: SpriteCanvasDisplayModel;
  interaction: SpriteCanvasInteractionModel;
}

const FALLBACK_TILE: SpriteTile = makeTile(8, 0);

/**
 * スプライト編集用 canvas の描画、描画ツール、並べ替え操作を束ねるフックです。
 * 編集ロジックを React コンポーネント本体から分離し、canvas props と更新 API に集約する意図があります。
 */
export const useSpriteCanvas = ({ display, interaction }: UseCanvasParams) => {
  const { scale = 24, showGrid = true, target } = display;
  const {
    activeColorIndex,
    currentSelectPalette,
    isChangeOrderMode = false,
    onChange,
    tool,
  } = interaction;
  const palettes = useProjectState((s) => s.nes.spritePalettes);
  const tile = useProjectState((s) =>
    pipe(
      getArrayItem(s.sprites, target),
      O.getOrElse(() => FALLBACK_TILE),
    ),
  );
  const canvasRef = useRef<O.Option<HTMLCanvasElement>>(O.none);
  const hoverTileRef = useRef<O.Option<{ tileX: number; tileY: number }>>(
    O.none,
  );

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

  const getSelectedColorHex = useCallback(
    (colorIndex: ColorIndexOfPalette): O.Option<string> =>
      pipe(
        getArrayItem(palettes[currentSelectPalette], colorIndex),
        O.map((nesColorIndex) => nesIndexToCssHex(nesColorIndex)),
      ),
    [palettes, currentSelectPalette],
  );

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
        const colorIndexOption = getMatrixItem(tile.pixels, y, x);
        if (O.isNone(colorIndexOption) || colorIndexOption.value === 0) {
          return;
        }

        const hexOption = getSelectedColorHex(colorIndexOption.value);
        if (O.isNone(hexOption)) {
          return;
        }

        ctx.fillStyle = hexOption.value;
        ctx.fillRect(x * scale, y * scale, scale, scale);
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

    if (isChangeOrderMode === true && O.isSome(dragInfoRef.current)) {
      const drawTileFrame = (
        tileX: number,
        tileY: number,
        stroke: string,
        fill: string,
        dash: number[],
      ) => {
        ctx.save();
        ctx.setLineDash(dash);
        ctx.lineWidth = 2;
        ctx.strokeStyle = stroke;
        ctx.fillStyle = fill;
        ctx.fillRect(tileX * scale, tileY * scale, 8 * scale, 8 * scale);
        ctx.strokeRect(
          tileX * scale + 1,
          tileY * scale + 1,
          8 * scale - 2,
          8 * scale - 2,
        );
        ctx.restore();
      };

      const { startTileX, startTileY } = dragInfoRef.current.value;
      drawTileFrame(
        startTileX,
        startTileY,
        "rgba(245, 158, 11, 0.95)",
        "rgba(245, 158, 11, 0.16)",
        [4, 4],
      );

      if (O.isSome(hoverTileRef.current)) {
        const { tileX, tileY } = hoverTileRef.current.value;
        const isSameTile = tileX === startTileX && tileY === startTileY;

        if (isSameTile === false) {
          drawTileFrame(
            tileX,
            tileY,
            "rgba(14, 165, 233, 0.98)",
            "rgba(14, 165, 233, 0.18)",
            [],
          );
        }
      }
    }
  }, [
    tile,
    scale,
    showGrid,
    width,
    height,
    isChangeOrderMode,
    dragInfoRef,
    getSelectedColorHex,
  ]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  const paintingRef = useRef(false);

  const applyAt = useCallback(
    (px: number, py: number) => {
      if (px < 0 || py < 0 || px >= width || py >= height) return;
      const nextColorIndex = tool === "pen" ? activeColorIndex : 0;
      const next: SpriteTile = {
        ...tile,
        pixels: tile.pixels.map((row, rowIndex) =>
          rowIndex === py
            ? row.map((value, columnIndex) =>
                columnIndex === px ? nextColorIndex : value,
              )
            : row.slice(),
        ),
      };
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
        hoverTileRef.current = getSwapPreviewTile(x, y, width, height);
        drawAll();
        return;
      }
    },
    [scale, applyAt, isChangeOrderMode, moveGhost, width, height, drawAll],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      paintingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
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
        hoverTileRef.current = getSwapPreviewTile(cellX, cellY, width, height);
        drawAll();
      }
    },
    [
      handlePointer,
      isChangeOrderMode,
      scale,
      beginGhostAtCell,
      width,
      height,
      drawAll,
    ],
  );

  const onPointerMove = handlePointer;

  const onPointerCancel = useCallback(() => {
    paintingRef.current = false;
    cleanupGhost();
    hoverTileRef.current = O.none;
    drawAll();
  }, [cleanupGhost, drawAll]);

  const onLostPointerCapture = useCallback(() => {
    paintingRef.current = false;
    cleanupGhost();
    hoverTileRef.current = O.none;
    drawAll();
  }, [cleanupGhost, drawAll]);

  // 既存：onPointerUp を差し替え
  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      paintingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);

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
      hoverTileRef.current = O.none;
      drawAll();
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
      drawAll,
    ],
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
    onPointerCancel: () => void;
    onLostPointerCapture: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
  } = {
    ref: (node: HTMLCanvasElement | null) => {
      canvasRef.current = O.fromNullable(node);
    },
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    onContextMenu,
  };

  return { canvasRef, drawAll, canvasProps };
};
