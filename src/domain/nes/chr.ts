import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { ColorIndexOfPalette, SpriteTile } from "../project/project";
import { getMatrixItem } from "../../shared/arrayAccess";

/**
 * 8x8 スプライトを NES の 16 バイト CHR 形式へ変換します。
 * 編集中タイルを実機互換の bitplane 配列へ落とし込み、書き出し処理から再利用できる形にする意図があります。
 */
export function tile8x8ToChr(tile: SpriteTile): E.Either<string, Uint8Array> {
  if (tile.width !== 8 || tile.height !== 8) {
    return E.left("tile8x8ToChr: 8x8のみ対応");
  }
  const packedRows = Array.from({ length: 8 }, (_, y) => y).map((y) => {
    const bits = Array.from({ length: 8 }, (_, x) => {
      const pix: ColorIndexOfPalette = O.getOrElse(
        (): ColorIndexOfPalette => 0,
      )(getMatrixItem(tile.pixels, y, x));
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

  const out = new Uint8Array(
    packedRows
      .flatMap((packed) => [packed.p0])
      .concat(packedRows.flatMap((packed) => [packed.p1])),
  );
  return E.right(out);
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
