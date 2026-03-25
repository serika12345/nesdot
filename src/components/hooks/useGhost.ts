import * as O from "fp-ts/Option";
import { useCallback, useRef } from "react";
import { nesIndexToCssHex } from "../../nes/palette";
import { NesSpritePalettes } from "../../store/nesProjectState";
import {
  PaletteIndex,
  SpriteTile,
} from "../../store/projectState";
import { getArrayItem, getMatrixItem } from "../../utils/arrayAccess";
import {
  canvasToDataUrl,
  createFloatingImage,
  createOffscreenCanvasSurface,
  fillRect,
  FloatingImage,
  moveFloatingImage,
  removeFloatingImage,
  setFillStyle,
  setFilter,
  setGlobalCompositeOperation,
  setImageSmoothingEnabled,
  withSavedContext,
} from "../../utils/canvasRuntime";

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
  palettes: NesSpritePalettes; // パレット配列（useProjectStateの型に合わせる）
  currentSelectPalette: PaletteIndex;
}

export const useGhost = ({
  scale,
  width,
  height,
  tile,
  palettes,
  currentSelectPalette,
}: UseGhostParams) => {
  type DragInfo = {
    startTileX: number;
    startTileY: number;
    offsetX: number;
    offsetY: number;
  };

  // 追加：ドラッグ中の8x8タイルのゴースト管理
  const ghostImgRef = useRef<O.Option<FloatingImage>>(O.none);
  const dragInfoRef = useRef<O.Option<DragInfo>>(O.none);

  // 追加：8x8タイルをオフスクリーンに描画して dataURL を返す（透明背景）
  const makeTileGhostDataURL = useCallback(
    (tileX: number, tileY: number) => {
      const pad = 2; // 少し余白（視認性）
      const surfaceOption = createOffscreenCanvasSurface(
        8 * scale + pad * 2,
        8 * scale + pad * 2,
      );
      if (O.isNone(surfaceOption)) {
        return O.none;
      }
      const surface = surfaceOption.value;
      setImageSmoothingEnabled(surface, false);

      // 透明背景に対象8x8を拡大描画
      Array.from({ length: 8 }, (_, yy) => yy).forEach((yy) => {
        Array.from({ length: 8 }, (_, xx) => xx).forEach((xx) => {
          const gx = tileX + xx;
          const gy = tileY + yy;
          const inBounds = gx >= 0 && gy >= 0 && gx < width && gy < height;
          if (inBounds === true) {
            const colorIdxOption = getMatrixItem(tile.pixels, gy, gx);
            if (
              O.isNone(colorIdxOption) ||
              colorIdxOption.value === 0
            ) {
              return;
            }

            const nesColorIndexOption = getArrayItem(
              palettes[currentSelectPalette],
              colorIdxOption.value,
            );
            if (O.isNone(nesColorIndexOption)) {
              return;
            }

            setFillStyle(surface, nesIndexToCssHex(nesColorIndexOption.value));
            fillRect(surface, pad + xx * scale, pad + yy * scale, scale, scale);
          }
        });
      });

      // 薄い影（見やすさ）
      withSavedContext(surface, () => {
        setGlobalCompositeOperation(surface, "destination-over");
        setFilter(surface, "drop-shadow(0 4px 10px rgba(0,0,0,.25))");
        setFillStyle(surface, "rgba(0,0,0,0)");
        fillRect(surface, 0, 0, 8 * scale + pad * 2, 8 * scale + pad * 2);
      });

      return O.some(canvasToDataUrl(surface, "image/png"));
    },
    [scale, width, height, tile.pixels, palettes, currentSelectPalette],
  );

  // 追加：ゴースト要素の作成
  const createGhost = useCallback((imgURL: string) => {
    ghostImgRef.current = O.some(createFloatingImage(imgURL));
  }, []);

  // 追加：ゴーストの位置更新（クライアント座標で）
  const moveGhost = useCallback((clientX: number, clientY: number) => {
    if (O.isNone(ghostImgRef.current)) return;
    moveFloatingImage(ghostImgRef.current.value, clientX, clientY);
  }, []);

  // 追加：後始末
  const cleanupGhost = useCallback(() => {
    if (O.isSome(ghostImgRef.current)) {
      removeFloatingImage(ghostImgRef.current.value);
    }
    ghostImgRef.current = O.none;
    dragInfoRef.current = O.none;
  }, []);

  /**
   * 並べ替えモード開始時に8x8タイルのゴースト生成
   * - e: PointerEvent（クライアント座標取得のため）
   * - canvasRect: キャンバスの getBoundingClientRect()
   * - cellX, cellY: クリックセル座標（拡大前のピクセル単位）
   */
  const beginGhostAtCell = useCallback(
    (
      e: React.PointerEvent,
      canvasRect: DOMRect,
      cellX: number,
      cellY: number,
    ) => {
      const startTileX = Math.floor(cellX / 8) * 8;
      const startTileY = Math.floor(cellY / 8) * 8;

      // ゴースト画像を作成
      const ghostDataOption = makeTileGhostDataURL(startTileX, startTileY);
      if (O.isNone(ghostDataOption)) {
        return;
      }
      createGhost(ghostDataOption.value);

      // ポインタからタイル左上（表示上の位置）までのオフセット（CSS px）
      const tileLeft = canvasRect.left + startTileX * scale;
      const tileTop = canvasRect.top + startTileY * scale;
      dragInfoRef.current = O.some({
        startTileX,
        startTileY,
        offsetX: e.clientX - tileLeft,
        offsetY: e.clientY - tileTop,
      });

      // 初期位置
      moveGhost(e.clientX, e.clientY);
    },
    [makeTileGhostDataURL, createGhost, moveGhost, scale],
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
