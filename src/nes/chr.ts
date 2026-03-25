import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { ColorIndexOfPalette, SpriteTile } from "../store/projectState";
import { getMatrixItem } from "../utils/arrayAccess";

/**
 * 8x8 タイルを 16 バイトCHRに変換（先頭8B: bitplane0, 次の8B: bitplane1）
 * NESの2bitピクセル値(0..3)の下位ビットがplane0、上位ビットがplane1となる想定。
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
 * 8x16はCHR上では8x8が上下に2枚並ぶ（合計32バイト）。
 * NES仕様上、上下で同一パレットを使う前提で扱います。
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
