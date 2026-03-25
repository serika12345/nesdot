import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";

export const getArrayItem = <T>(
  items: ReadonlyArray<T>,
  index: number,
): O.Option<T> => O.fromNullable(items[index]);

export const getMatrixItem = <T>(
  matrix: ReadonlyArray<ReadonlyArray<T>>,
  rowIndex: number,
  columnIndex: number,
): O.Option<T> =>
  pipe(
    getArrayItem(matrix, rowIndex),
    O.chain((row) => getArrayItem(row, columnIndex)),
  );
