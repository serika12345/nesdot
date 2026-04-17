import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  type CharacterDecompositionCanvas,
  type CharacterDecompositionPixel,
} from "../../../../../domain/characters/characterDecomposition";
import { nesIndexToCssHex } from "../../../../../domain/nes/palette";

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

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const toRgbColor = (nesColorIndex: number): RgbColor => {
  const hex = nesIndexToCssHex(nesColorIndex);

  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
};

/**
 * 分解キャンバスを未拡大の RGBA バッファへ変換します。
 * 表示倍率での色複製は行わず、描画側で nearest-neighbor 拡大する前提のデータを返します。
 */
export const createDecompositionCanvasRgba = (
  canvas: CharacterDecompositionCanvas,
  spritePalettes: ReadonlyArray<ReadonlyArray<number>>,
): Uint8ClampedArray => {
  const paletteColors = spritePalettes.map((palette) =>
    palette.map((nesColorIndex) => toRgbColor(nesColorIndex)),
  );

  return Uint8ClampedArray.from(
    canvas.pixels.flatMap((row) =>
      row.flatMap((pixel) => {
        if (pixel.kind === "transparent") {
          return [0, 0, 0, 0];
        }

        return pipe(
          O.fromNullable(paletteColors[pixel.paletteIndex]?.[pixel.colorIndex]),
          O.match(
            () => [0, 0, 0, 0],
            (rgbColor) => [rgbColor.r, rgbColor.g, rgbColor.b, 255],
          ),
        );
      }),
    ),
  );
};
