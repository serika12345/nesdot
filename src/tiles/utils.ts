// src/tiles/utils.ts
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import {
  Backing,
  ColorIndexOfPalette,
  PaletteIndex,
  SpriteTile,
  SpriteTileND,
} from "../store/projectState";
import { getArrayItem, getMatrixItem } from "../utils/arrayAccess";

/** 8の倍数であることを検査 */
export function assertTileSize(w: number, h: number): E.Either<string, true> {
  if (w <= 0 || h <= 0 || w % 8 !== 0 || h % 8 !== 0) {
    return E.left(
      `Tile size must be positive and multiples of 8: got ${w}x${h}`,
    );
  }
  return E.right(true);
}

/** タイル生成（既定は透明0で初期化） */
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

export type ResizeAnchor =
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

  const next: ColorIndexOfPalette[][] = Array.from({ length: nextH }, () =>
    Array.from({ length: nextW }, () => b.fill),
  );
  // 旧バッファを（shiftX, shiftY）だけ平行移動して貼り付け
  Array.from({ length: b.height }, (_, y) => y).forEach((y) => {
    Array.from({ length: b.width }, (_, x) => x).forEach((x) => {
      const nextRowOption = getArrayItem(next, y + shiftY);
      const sourcePixelOption = getMatrixItem(b.pixels, y, x);
      if (O.isNone(nextRowOption) || O.isNone(sourcePixelOption)) {
        return;
      }

      nextRowOption.value[x + shiftX] = sourcePixelOption.value;
    });
  });

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
 * 非破壊リサイズ：ビューの変更のみ行い、画素は裏キャンバスで保持
 * - 新規に作ったキャンバスへ、アンカー基準で既存ピクセルをコピー
 * - はみ出した部分は裏キャンバスへ書き戻し（破棄しない）
 * - 拡張部分は裏キャンバスから復元、未定義は fill で埋める
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
  Array.from({ length: src.height }, (_, y) => y).forEach((y) => {
    Array.from({ length: src.width }, (_, x) => x).forEach((x) => {
      const bx = adjustedCurViewLeft + x;
      const by = adjustedCurViewTop + y;
      if (by >= 0 && by < backing.height && bx >= 0 && bx < backing.width) {
        const backingRowOption = getArrayItem(backing.pixels, by);
        const sourcePixelOption = getMatrixItem(src.pixels, y, x);
        if (O.isNone(backingRowOption) || O.isNone(sourcePixelOption)) {
          return;
        }

        backingRowOption.value[bx] = sourcePixelOption.value;
      }
    });
  });

  // 2) 新しい可視タイルを作成（表示用バッファ）
  const dst: SpriteTileND = makeTile(nextH, src.paletteIndex, fill);

  // 3) 裏キャンバスから新ビュー領域を読み出して dst へコピー（未定義は fill）
  Array.from({ length: nextH }, (_, y) => y).forEach((y) => {
    const by = adjustedNextViewTop + y;
    const dstRowOption = getArrayItem(dst.pixels, y);
    if (by < 0 || by >= backing.height) {
      // 全面 fill（makeTile 済みなので何もしない）
      return;
    }
    if (O.isNone(dstRowOption)) {
      return;
    }
    Array.from({ length: nextW }, (_, x) => x).forEach((x) => {
      const bx = adjustedNextViewLeft + x;
      if (bx < 0 || bx >= backing.width) return;
      const sourcePixelOption = getMatrixItem(backing.pixels, by, bx);
      if (O.isNone(sourcePixelOption)) {
        return;
      }

      dstRowOption.value[x] = sourcePixelOption.value;
    });
  });

  // 4) 新タイルへ裏キャンバス参照を引き継ぎ、ビューの原点を更新
  dst.__backing = {
    ...backing,
    offsetX: adjustedNextViewLeft,
    offsetY: adjustedNextViewTop,
  };

  return dst;
}
