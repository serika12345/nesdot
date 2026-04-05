import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";

/**
 * 配列から index 指定で要素を安全に取り出します。
 * 範囲外アクセスを `Option` で表現し、呼び出し側が失敗を明示的に扱えるようにします。
 */
export const getArrayItem = <T>(
  items: ReadonlyArray<T>,
  index: number,
): O.Option<T> => O.fromNullable(items[index]);

/**
 * 2 次元配列から行列座標で要素を安全に取り出します。
 * 行と列の両方で境界確認をまとめ、ピクセル参照の失敗を `Option` に閉じ込める関数です。
 */
export const getMatrixItem = <T>(
  matrix: ReadonlyArray<ReadonlyArray<T>>,
  rowIndex: number,
  columnIndex: number,
): O.Option<T> =>
  pipe(
    getArrayItem(matrix, rowIndex),
    O.chain((row) => getArrayItem(row, columnIndex)),
  );
