import {
  type CharacterDecompositionCanvas,
  type CharacterDecompositionPixel,
} from "../../../../domain/characters/characterDecomposition";

export const TRANSPARENT_DECOMPOSITION_PIXEL: CharacterDecompositionPixel = {
  kind: "transparent",
};

/**
 * 分解編集用の空キャンバスを生成します。
 * 指定サイズぶんの透明ピクセルを敷き詰め、分解モードの初期状態を一貫して作るための関数です。
 */
export const createDecompositionCanvas = (
  width: number,
  height: number,
): CharacterDecompositionCanvas => ({
  width,
  height,
  pixels: Array.from({ length: height }, () =>
    Array.from({ length: width }, () => TRANSPARENT_DECOMPOSITION_PIXEL),
  ),
});

/**
 * 既存内容を保ちながら分解キャンバスのサイズを変更します。
 * 既知領域は再利用し、新しく増えた領域だけ透明で埋めることで編集内容を保全します。
 */
export const resizeDecompositionCanvas = (
  current: CharacterDecompositionCanvas,
  nextWidth: number,
  nextHeight: number,
): CharacterDecompositionCanvas => ({
  width: nextWidth,
  height: nextHeight,
  pixels: Array.from({ length: nextHeight }, (_, y) =>
    Array.from(
      { length: nextWidth },
      (_, x) => current.pixels[y]?.[x] ?? TRANSPARENT_DECOMPOSITION_PIXEL,
    ),
  ),
});

const isSameDecompositionPixel = (
  left: CharacterDecompositionPixel,
  right: CharacterDecompositionPixel,
): boolean => {
  if (left.kind !== right.kind) {
    return false;
  }

  if (left.kind === "transparent") {
    return true;
  }

  if (right.kind === "transparent") {
    return false;
  }

  return (
    left.paletteIndex === right.paletteIndex &&
    left.colorIndex === right.colorIndex
  );
};

/**
 * 分解キャンバス上の 1 ピクセルだけを更新します。
 * 同じ値への更新は避けつつ、不変更新で描画状態を差し替えるための関数です。
 */
export const paintDecompositionPixel = (
  canvas: CharacterDecompositionCanvas,
  x: number,
  y: number,
  pixel: CharacterDecompositionPixel,
): CharacterDecompositionCanvas => {
  const currentPixel = canvas.pixels[y]?.[x] ?? TRANSPARENT_DECOMPOSITION_PIXEL;
  if (isSameDecompositionPixel(currentPixel, pixel)) {
    return canvas;
  }

  return {
    ...canvas,
    pixels: canvas.pixels.map((row, rowIndex) =>
      rowIndex === y
        ? row.map((currentRowPixel, columnIndex) =>
            columnIndex === x ? pixel : currentRowPixel,
          )
        : row,
    ),
  };
};
