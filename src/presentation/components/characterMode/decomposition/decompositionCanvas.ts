import {
  type CharacterDecompositionCanvas,
  type CharacterDecompositionPixel,
} from "../../../../domain/characters/characterDecomposition";

export const TRANSPARENT_DECOMPOSITION_PIXEL: CharacterDecompositionPixel = {
  kind: "transparent",
};

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
