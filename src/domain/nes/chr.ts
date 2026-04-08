import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { getMatrixItem } from "../../shared/arrayAccess";
import { ColorIndexOfPalette, SpriteTile } from "../project/project";
import { type BackgroundTile } from "../project/projectV2";

const toColorIndexOfPalette = (value: number): ColorIndexOfPalette => {
  if (value === 0) {
    return 0;
  }

  if (value === 1) {
    return 1;
  }

  if (value === 2) {
    return 2;
  }

  return 3;
};

const packPixelsToChr = (
  pixels: ReadonlyArray<ReadonlyArray<ColorIndexOfPalette>>,
): Uint8Array => {
  const packedRows = Array.from({ length: 8 }, (_, y) => y).map((y) => {
    const bits = Array.from({ length: 8 }, (_, x) => {
      const pix: ColorIndexOfPalette = O.getOrElse(
        (): ColorIndexOfPalette => 0,
      )(getMatrixItem(pixels, y, x));
      return {
        b0: pix & 1,
        b1: (pix >> 1) & 1,
        shift: 7 - x,
      };
    });

    const packed = bits.reduce(
      (acc, bit) => ({
        p0: acc.p0 | (bit.b0 << bit.shift),
        p1: acc.p1 | (bit.b1 << bit.shift),
      }),
      { p0: 0, p1: 0 },
    );
    return packed;
  });

  return new Uint8Array(
    packedRows
      .flatMap((packed) => [packed.p0])
      .concat(packedRows.flatMap((packed) => [packed.p1])),
  );
};

/**
 * 8x8 スプライトを NES の 16 バイト CHR 形式へ変換します。
 * 編集中タイルを実機互換の bitplane 配列へ落とし込み、書き出し処理から再利用できる形にする意図があります。
 */
export function tile8x8ToChr(tile: SpriteTile): E.Either<string, Uint8Array> {
  if (tile.width !== 8 || tile.height !== 8) {
    return E.left("tile8x8ToChr: 8x8のみ対応");
  }
  return E.right(packPixelsToChr(tile.pixels));
}

/**
 * 上下 2 枚の 8x8 タイルを 8x16 用の CHR バイト列へ連結します。
 * 8x16 スプライト書き出しを簡潔に扱えるよう、上下分割済みタイルを一つの出力へまとめます。
 */
export function tile8x16ToChr(
  top: SpriteTile,
  bottom: SpriteTile,
): E.Either<string, Uint8Array> {
  if (
    top.width !== 8 ||
    top.height !== 8 ||
    bottom.width !== 8 ||
    bottom.height !== 8
  ) {
    return E.left("tile8x16ToChr: 上下とも8x8タイルを渡してください");
  }
  const topChr = tile8x8ToChr(top);
  if (E.isLeft(topChr)) {
    return topChr;
  }
  const bottomChr = tile8x8ToChr(bottom);
  if (E.isLeft(bottomChr)) {
    return bottomChr;
  }
  const out = new Uint8Array([...topChr.right, ...bottomChr.right]);
  return E.right(out);
}

/**
 * 8x8 背景タイルを NES の 16 バイト CHR 形式へ変換します。
 * 背景編集で扱うピクセル配列を、描画や保存で使う bitplane へ落とし込むための関数です。
 */
export const encodeBackgroundTile = (tile: BackgroundTile): Uint8Array =>
  packPixelsToChr(tile.pixels);

/**
 * 複数の 8x8 背景タイルを連結済み CHR バイト列へ変換します。
 * 正規化された BG タイル集合から、そのまま renderer/export へ渡せる CHR 配列を構築します。
 */
export const encodeBackgroundTilesToChrBytes = (
  tiles: ReadonlyArray<BackgroundTile>,
): Uint8Array =>
  new Uint8Array(
    tiles.flatMap((tile) => Array.from(encodeBackgroundTile(tile))),
  );

/**
 * 16 バイトの CHR データを 8x8 背景タイルへ戻します。
 * 旧形式インポートや projection 検証で、bitplane を UI 用ピクセルへ復元する用途を担います。
 */
export const decodeBackgroundTile = (
  chrBytes: ReadonlyArray<number>,
): E.Either<string, BackgroundTile> => {
  if (chrBytes.length !== 16) {
    return E.left("decodeBackgroundTile: 16バイトのCHRデータが必要です");
  }

  const pixels = Array.from({ length: 8 }, (_, y) => {
    const plane0 = chrBytes[y] ?? 0;
    const plane1 = chrBytes[y + 8] ?? 0;

    return Array.from({ length: 8 }, (_, x) => {
      const shift = 7 - x;
      const bit0 = (plane0 >> shift) & 1;
      const bit1 = (plane1 >> shift) & 1;

      return toColorIndexOfPalette((bit1 << 1) | bit0);
    });
  });

  return E.right({
    width: 8,
    height: 8,
    pixels,
  });
};
