// src/tiles/utils.ts
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { getMatrixItem } from "../../shared/arrayAccess";
import {
  Backing,
  ColorIndexOfPalette,
  PaletteIndex,
  SpriteTile,
  SpriteTileND,
} from "../project/project";

/**
 * 与えられたタイルサイズが 8 の倍数条件を満たすか検査します。
 * タイル操作が前提とする NES 単位を入口で守り、後続処理を安全にするための関数です。
 */
export function assertTileSize(w: number, h: number): E.Either<string, true> {
  if (w <= 0 || h <= 0 || w % 8 !== 0 || h % 8 !== 0) {
    return E.left(
      `Tile size must be positive and multiples of 8: got ${w}x${h}`,
    );
  }
  return E.right(true);
}

/**
 * 指定サイズとパレットでスプライトタイルを生成します。
 * 透明色で初期化した編集用タイルを、幅 8 固定のドメイン制約付きで作ることを意図しています。
 */
// ピクセル値は0..3（=パレット内インデックス）
// widthを廃止し、height とその他のみを受け付ける
export function makeTile(
  height: 8 | 16,
  paletteIndex: PaletteIndex,
  fill: ColorIndexOfPalette = 0,
): SpriteTile {
  const width: 8 = 8; // SpriteTileのwidth: 8 に合わせてリテラル固定
  const pixels: ColorIndexOfPalette[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => fill),
  );
  return { width, height, pixels, paletteIndex };
}

type ResizeAnchor =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

function computeHorizontalPlacement(
  anchor: ResizeAnchor,
  prev: number,
  next: number,
): number {
  switch (anchor) {
    case "top-left":
    case "left":
    case "bottom-left":
      return 0;
    case "top":
    case "center":
    case "bottom":
      return Math.floor((next - prev) / 2);
    case "top-right":
    case "right":
    case "bottom-right":
      return next - prev;
  }
}

function computeVerticalPlacement(
  anchor: ResizeAnchor,
  prev: number,
  next: number,
): number {
  switch (anchor) {
    case "top-left":
    case "top":
    case "top-right":
      return 0;
    case "left":
    case "center":
    case "right":
      return Math.floor((next - prev) / 2);
    case "bottom-left":
    case "bottom":
    case "bottom-right":
      return next - prev;
  }
}

/**
 * 裏キャンバスを初期化（なければ作る）
 */
function ensureBacking(tile: SpriteTileND, fill: ColorIndexOfPalette): Backing {
  if (tile.__backing) {
    return cloneBacking(tile.__backing);
  }
  return {
    width: tile.width,
    height: tile.height,
    pixels: clonePixels(tile.pixels),
    offsetX: 0,
    offsetY: 0,
    fill,
  };
}

/**
 * バッファ拡張：ビューがはみ出す場合、裏キャンバスを必要サイズに拡張
 * 既存内容は保ち、足りない部分は fill で埋める
 */
function growBackingIfNeeded(
  b: Backing,
  viewLeft: number,
  viewTop: number,
  viewRight: number,
  viewBottom: number,
): { backing: Backing; shiftX: number; shiftY: number } {
  const newLeft = Math.min(0, viewLeft);
  const newTop = Math.min(0, viewTop);
  const newRight = Math.max(b.width, viewRight);
  const newBottom = Math.max(b.height, viewBottom);

  // 左・上に負方向へはみ出す場合はオフセット移動が必要
  const shiftX = newLeft < 0 ? -newLeft : 0;
  const shiftY = newTop < 0 ? -newTop : 0;
  const needGrow =
    shiftX !== 0 || shiftY !== 0 || newRight > b.width || newBottom > b.height;

  if (needGrow === false) {
    return { backing: b, shiftX: 0, shiftY: 0 };
  }

  const nextW = Math.max(newRight + shiftX, b.width + shiftX);
  const nextH = Math.max(newBottom + shiftY, b.height + shiftY);

  const next: ColorIndexOfPalette[][] = Array.from({ length: nextH }, (_, y) =>
    Array.from({ length: nextW }, (_, x) => {
      const sourcePixelOption = getMatrixItem(b.pixels, y - shiftY, x - shiftX);
      return O.getOrElse(() => b.fill)(sourcePixelOption);
    }),
  );

  return {
    backing: {
      ...b,
      pixels: next,
      width: nextW,
      height: nextH,
      offsetX: b.offsetX + shiftX,
      offsetY: b.offsetY + shiftY,
    },
    shiftX,
    shiftY,
  };
}

/**
 * 2D配列のディープコピー
 */
function clonePixels(src: ColorIndexOfPalette[][]): ColorIndexOfPalette[][] {
  return src.map((row) => row.slice());
}

function cloneBacking(src: Backing): Backing {
  return {
    ...src,
    pixels: clonePixels(src.pixels),
  };
}

/**
 * 画素を保持したままタイルの表示領域だけを非破壊でリサイズします。
 * はみ出した内容を裏キャンバスへ逃がしつつ、アンカー基準で新しい見た目を再構成するのが目的です。
 */
export function resizeTileND(
  src: SpriteTileND,
  nextW: number,
  nextH: 8 | 16,
  opts?: { anchor?: ResizeAnchor; fill?: ColorIndexOfPalette },
): SpriteTileND {
  if (E.isLeft(assertTileSize(nextW, nextH))) {
    return src;
  }
  const anchor = opts?.anchor ?? "top-left";
  const fill: ColorIndexOfPalette = opts?.fill ?? 0;

  // 裏キャンバスの用意
  const initialBacking = ensureBacking(src, fill);

  // 現ビューの左上が裏キャンバス上でどこか（= backing.offset を基準に決まる）
  const curViewLeft = initialBacking.offsetX;
  const curViewTop = initialBacking.offsetY;

  // アンカーに応じて、新ビュー内で旧ビューをどこに置くかを決める。
  // 新ビュー原点はそのぶん逆方向へ動かす必要がある。
  const dx = computeHorizontalPlacement(anchor, src.width, nextW);
  const dy = computeVerticalPlacement(anchor, src.height, nextH);

  // 新ビューの左上（裏キャンバス座標）
  const desiredNextViewLeft = curViewLeft - dx;
  const desiredNextViewTop = curViewTop - dy;
  const desiredNextViewRight = desiredNextViewLeft + nextW;
  const desiredNextViewBottom = desiredNextViewTop + nextH;

  // 新ビューが裏キャンバスからはみ出すなら拡張
  const { backing, shiftX, shiftY } = growBackingIfNeeded(
    initialBacking,
    desiredNextViewLeft,
    desiredNextViewTop,
    desiredNextViewRight,
    desiredNextViewBottom,
  );

  const adjustedCurViewLeft = curViewLeft + shiftX;
  const adjustedCurViewTop = curViewTop + shiftY;
  const adjustedNextViewLeft = desiredNextViewLeft + shiftX;
  const adjustedNextViewTop = desiredNextViewTop + shiftY;

  // 1) 旧ビューの可視領域の内容を裏キャンバスへ「確定書き戻し」
  //    （src.pixels が正なので、これでビュー外へ出る画素も保持される）
  const committedBackingPixels: ColorIndexOfPalette[][] = Array.from(
    { length: backing.height },
    (_, by) =>
      Array.from({ length: backing.width }, (_, bx) => {
        const sourceY = by - adjustedCurViewTop;
        const sourceX = bx - adjustedCurViewLeft;
        const isInSourceView =
          sourceY >= 0 &&
          sourceY < src.height &&
          sourceX >= 0 &&
          sourceX < src.width;

        if (isInSourceView === true) {
          return O.getOrElse<ColorIndexOfPalette>(() => fill)(
            getMatrixItem(src.pixels, sourceY, sourceX),
          );
        }

        return O.getOrElse<ColorIndexOfPalette>(() => fill)(
          getMatrixItem(backing.pixels, by, bx),
        );
      }),
  );

  // 2) 新しい可視タイルを作成（表示用バッファ）
  const dstBase = makeTile(nextH, src.paletteIndex, fill);

  // 3) 裏キャンバスから新ビュー領域を読み出して dst へコピー（未定義は fill）
  const dstPixels: ColorIndexOfPalette[][] = Array.from(
    { length: nextH },
    (_, y) =>
      Array.from({ length: nextW }, (_, x) => {
        const by = adjustedNextViewTop + y;
        const bx = adjustedNextViewLeft + x;
        const isInBacking =
          by >= 0 && by < backing.height && bx >= 0 && bx < backing.width;
        if (isInBacking === false) {
          const basePixelOption = getMatrixItem(dstBase.pixels, y, x);
          return O.getOrElse<ColorIndexOfPalette>(() => fill)(basePixelOption);
        }

        const sourcePixelOption = getMatrixItem(committedBackingPixels, by, bx);
        return O.getOrElse<ColorIndexOfPalette>(() => fill)(sourcePixelOption);
      }),
  );

  // 4) 新タイルへ裏キャンバス参照を引き継ぎ、ビューの原点を更新
  const dst: SpriteTileND = {
    ...dstBase,
    pixels: dstPixels,
    __backing: {
      ...backing,
      pixels: committedBackingPixels,
      offsetX: adjustedNextViewLeft,
      offsetY: adjustedNextViewTop,
    },
  };

  return dst;
}
