import * as O from "fp-ts/Option";
import { useCallback, useRef } from "react";
import { nesIndexToCssHex } from "../../../domain/nes/palette";
import { NesSpritePalettes } from "../../../domain/nes/nesProject";
import { PaletteIndex, SpriteTile } from "../../../domain/project/project";
import { getArrayItem, getMatrixItem } from "../../../shared/arrayAccess";

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

/**
 * 8x8 タイルのドラッグゴーストを生成し、追従表示を管理するフックです。
 * 並べ替え中の視覚フィードバックを UI 本体から切り離し、開始・移動・後始末をまとめて扱います。
 */
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
  const ghostImgRef = useRef<O.Option<HTMLImageElement>>(O.none);
  const dragInfoRef = useRef<O.Option<DragInfo>>(O.none);

  // 追加：8x8タイルをオフスクリーンに描画して dataURL を返す（透明背景）
  const makeTileGhostDataURL = useCallback(
    (tileX: number, tileY: number) => {
      const pad = 2; // 少し余白（視認性）
      const ghostCvs = document.createElement("canvas");
      ghostCvs.width = 8 * scale + pad * 2;
      ghostCvs.height = 8 * scale + pad * 2;
      const gctxOption = O.fromNullable(ghostCvs.getContext("2d"));
      if (O.isNone(gctxOption)) {
        return O.none;
      }
      const gctx = gctxOption.value;
      gctx.imageSmoothingEnabled = false;

      // 透明背景に対象8x8を拡大描画
      Array.from({ length: 8 }, (_, yy) => yy).forEach((yy) => {
        Array.from({ length: 8 }, (_, xx) => xx).forEach((xx) => {
          const gx = tileX + xx;
          const gy = tileY + yy;
          const inBounds = gx >= 0 && gy >= 0 && gx < width && gy < height;
          if (inBounds === true) {
            const colorIdxOption = getMatrixItem(tile.pixels, gy, gx);
            if (O.isNone(colorIdxOption) || colorIdxOption.value === 0) {
              return;
            }

            const nesColorIndexOption = getArrayItem(
              palettes[currentSelectPalette],
              colorIdxOption.value,
            );
            if (O.isNone(nesColorIndexOption)) {
              return;
            }

            gctx.fillStyle = nesIndexToCssHex(nesColorIndexOption.value);
            gctx.fillRect(pad + xx * scale, pad + yy * scale, scale, scale);
          }
        });
      });

      // 薄い影（見やすさ）
      gctx.save();
      gctx.globalCompositeOperation = "destination-over";
      gctx.filter = "drop-shadow(0 4px 10px rgba(0,0,0,.25))";
      gctx.fillStyle = "rgba(0,0,0,0)";
      gctx.fillRect(0, 0, ghostCvs.width, ghostCvs.height);
      gctx.restore();

      return O.some(ghostCvs.toDataURL("image/png"));
    },
    [scale, width, height, tile.pixels, palettes, currentSelectPalette],
  );

  // 追加：ゴースト要素の作成
  const createGhost = useCallback((imgURL: string) => {
    const img = document.createElement("img");
    img.src = imgURL;
    img.style.position = "fixed";
    img.style.pointerEvents = "none";
    img.style.opacity = "0.9";
    img.style.transform = "translate(-50%, -50%)"; // ポインタ中央合わせ
    img.style.zIndex = "9999";
    document.body.appendChild(img);
    ghostImgRef.current = O.some(img);
  }, []);

  // 追加：ゴーストの位置更新（クライアント座標で）
  const moveGhost = useCallback((clientX: number, clientY: number) => {
    if (O.isNone(ghostImgRef.current)) return;
    ghostImgRef.current.value.style.left = `${clientX}px`;
    ghostImgRef.current.value.style.top = `${clientY}px`;
  }, []);

  // 追加：後始末
  const cleanupGhost = useCallback(() => {
    if (O.isSome(ghostImgRef.current)) {
      ghostImgRef.current.value.remove();
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
