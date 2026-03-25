import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  getNameTableLinearIndex,
  NesProjectState,
  NesSpritePalettes,
  resolveBackgroundPaletteIndex,
} from "../nes/nesProject";
import type { Screen, SpritePriority, SpriteTile } from "../project/project";
import { NES_PALETTE_HEX } from "./palette";

const FALLBACK_HEX = "#000000";

const getHexAt = (index: number): string =>
  pipe(
    O.fromNullable(NES_PALETTE_HEX[index]),
    O.getOrElse(() => FALLBACK_HEX),
  );

const getPaletteHex = (palette: number[], colorIndex: number): string =>
  pipe(
    O.fromNullable(palette[colorIndex]),
    O.map((nesColorIndex) => getHexAt(nesColorIndex)),
    O.getOrElse(() => getHexAt(0)),
  );

const replaceAt = <T>(items: ReadonlyArray<T>, index: number, value: T): T[] =>
  items.map((item, itemIndex) => (itemIndex === index ? value : item));

const replaceGridAt = <T>(
  grid: ReadonlyArray<ReadonlyArray<T>>,
  y: number,
  x: number,
  value: T,
): T[][] => {
  const rowOption = O.fromNullable(grid[y]);
  if (O.isNone(rowOption)) {
    return grid.map((row) => row.slice());
  }

  const nextRow = replaceAt(rowOption.value, x, value);
  return replaceAt(grid, y, nextRow).map((row) => row.slice());
};

export function renderSpriteTileToHexArray(
  tile: SpriteTile,
  palettes: NesSpritePalettes,
): string[][] {
  const palette = palettes[tile.paletteIndex];

  return tile.pixels.map((row) =>
    row.map((colorIndexOfPalette) =>
      colorIndexOfPalette === 0
        ? getHexAt(0)
        : getPaletteHex(palette, colorIndexOfPalette),
    ),
  );
}

export function renderScreenToHexArray(
  screen: Screen,
  nesState: NesProjectState,
): string[][] {
  const backgroundLayer = renderBackgroundLayerFromNesTables(screen, nesState);
  const initialSpriteLayer = Array.from({ length: screen.height }, () =>
    Array.from(
      { length: screen.width },
      (): O.Option<{ hex: string; priority: SpritePriority }> => O.none,
    ),
  );

  const spriteLayer = screen.sprites.reduce((layerAfterSprite, sprite) => {
    const palette = nesState.spritePalettes[sprite.paletteIndex];
    const spritePriority: SpritePriority =
      sprite.priority === "behindBg" ? "behindBg" : "front";
    const isFlipH = sprite.flipH === true;
    const isFlipV = sprite.flipV === true;

    return Array.from({ length: sprite.height }, (_, pixelY) => pixelY).reduce(
      (layerAfterY, pixelY) => {
        const sourcePixelY = isFlipV ? sprite.height - 1 - pixelY : pixelY;
        const rowOption = O.fromNullable(sprite.pixels[sourcePixelY]);
        if (O.isNone(rowOption)) {
          return layerAfterY;
        }
        const row = rowOption.value;

        return Array.from(
          { length: sprite.width },
          (_, pixelX) => pixelX,
        ).reduce((layerAfterX, pixelX) => {
          const sourcePixelX = isFlipH ? sprite.width - 1 - pixelX : pixelX;
          const colorIndex = row[sourcePixelX];
          const colorIndexOption = O.fromNullable(colorIndex);
          if (O.isNone(colorIndexOption) || colorIndexOption.value === 0) {
            return layerAfterX;
          }

          const x = (sprite.x | 0) + pixelX;
          const y = (sprite.y | 0) + pixelY;

          if (y < 0 || y >= screen.height || x < 0 || x >= screen.width) {
            return layerAfterX;
          }

          const spriteRowOption = O.fromNullable(layerAfterX[y]);
          if (O.isNone(spriteRowOption)) {
            return layerAfterX;
          }
          const targetPixel = pipe(
            O.fromNullable(spriteRowOption.value[x]),
            O.flatten,
          );
          if (O.isSome(targetPixel)) {
            return layerAfterX;
          }

          return replaceGridAt(
            layerAfterX,
            y,
            x,
            O.some({
              hex: getPaletteHex(palette, colorIndexOption.value),
              priority: spritePriority,
            }),
          );
        }, layerAfterY);
      },
      layerAfterSprite,
    );
  }, initialSpriteLayer);

  return Array.from({ length: screen.height }, (_, y) =>
    Array.from({ length: screen.width }, (_, x) => {
      const backgroundPixel = pipe(
        O.fromNullable(backgroundLayer[y]),
        O.chain((row) => O.fromNullable(row[x])),
        O.getOrElse(() => ({ hex: getHexAt(0), opaque: false })),
      );
      const spritePixelOption = pipe(
        O.fromNullable(spriteLayer[y]),
        O.chain((row) => O.fromNullable(row[x])),
        O.flatten,
      );

      if (O.isNone(spritePixelOption)) {
        return backgroundPixel.hex;
      }

      const spritePixel = spritePixelOption.value;
      const shouldShowBackground =
        spritePixel.priority === "behindBg" && backgroundPixel.opaque === true;

      return shouldShowBackground ? backgroundPixel.hex : spritePixel.hex;
    }),
  );
}

const getBackgroundColorIndexFromChr = (
  chrBytes: number[],
  tileIndex: number,
  pixelX: number,
  pixelY: number,
): number => {
  const tileStart = tileIndex * 16;
  const plane0Option = O.fromNullable(chrBytes[tileStart + pixelY]);
  const plane1Option = O.fromNullable(chrBytes[tileStart + 8 + pixelY]);

  if (O.isNone(plane0Option) || O.isNone(plane1Option)) {
    return 0;
  }
  const plane0 = plane0Option.value;
  const plane1 = plane1Option.value;

  const shift = 7 - pixelX;
  const bit0 = (plane0 >> shift) & 1;
  const bit1 = (plane1 >> shift) & 1;
  return (bit1 << 1) | bit0;
};

const renderBackgroundLayerFromNesTables = (
  screen: Screen,
  nesState: NesProjectState,
): Array<Array<{ hex: string; opaque: boolean }>> => {
  const initialBackgroundLayer = Array.from({ length: screen.height }, () =>
    Array.from({ length: screen.width }, () => ({
      hex: getHexAt(0),
      opaque: false,
    })),
  );

  return Array.from({ length: 30 }, (_, tileY) => tileY).reduce(
    (layerAfterTileY, tileY) =>
      Array.from({ length: 32 }, (_, tileX) => tileX).reduce(
        (layerAfterTileX, tileX) => {
          const nameTableIndex = getNameTableLinearIndex(tileX, tileY);
          if (E.isLeft(nameTableIndex)) {
            return layerAfterTileX;
          }

          const tileIndex =
            nesState.nameTable.tileIndices[nameTableIndex.right] ?? 0;
          const paletteIndexEither = resolveBackgroundPaletteIndex(
            nesState.attributeTable,
            tileX,
            tileY,
          );
          const paletteIndex = E.isRight(paletteIndexEither)
            ? paletteIndexEither.right
            : 0;
          const palette = nesState.backgroundPalettes[paletteIndex];
          const baseY = tileY * 8;
          const baseX = tileX * 8;

          return Array.from({ length: 8 }, (_, pixelY) => pixelY).reduce(
            (layerAfterPixelY, pixelY) =>
              Array.from({ length: 8 }, (_, pixelX) => pixelX).reduce(
                (layerAfterPixelX, pixelX) => {
                  const colorIndex = getBackgroundColorIndexFromChr(
                    nesState.chrBytes,
                    tileIndex,
                    pixelX,
                    pixelY,
                  );
                  const paletteColorOption = O.fromNullable(
                    palette[colorIndex],
                  );
                  const nesColorIndex =
                    colorIndex === 0
                      ? nesState.universalBackgroundColor
                      : pipe(
                          paletteColorOption,
                          O.getOrElse(() => nesState.universalBackgroundColor),
                        );
                  const y = baseY + pixelY;
                  const x = baseX + pixelX;
                  const isInBounds =
                    y >= 0 && y < screen.height && x >= 0 && x < screen.width;

                  if (isInBounds === false) {
                    return layerAfterPixelX;
                  }

                  return replaceGridAt(layerAfterPixelX, y, x, {
                    hex: getHexAt(nesColorIndex),
                    opaque: colorIndex !== 0,
                  });
                },
                layerAfterPixelY,
              ),
            layerAfterTileX,
          );
        },
        layerAfterTileY,
      ),
    initialBackgroundLayer,
  );
};
