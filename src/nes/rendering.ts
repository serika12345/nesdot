import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  getNameTableLinearIndex,
  NesProjectState,
  resolveBackgroundPaletteIndex,
} from "../store/nesProjectState";
import type { Palettes, Screen, SpriteTile } from "../store/projectState";
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

export function renderSpriteTileToHexArray(
  tile: SpriteTile,
  palettes: Palettes,
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
  palettes: Palettes,
  nesState?: NesProjectState,
): string[][] {
  const backgroundLayer =
    nesState === undefined
      ? Array.from({ length: screen.height }, () =>
          Array.from({ length: screen.width }, () => getHexAt(0)),
        )
      : renderBackgroundLayerFromNesTables(screen, palettes, nesState);
  const spriteLayer = Array.from({ length: screen.height }, () =>
    Array.from({ length: screen.width }, (): O.Option<string> => O.none),
  );

  const spritesSorted = screen.sprites.reduce<typeof screen.sprites>(
    (sorted, sprite) => {
      const insertAt = sorted.findIndex(
        (candidate) => candidate.spriteIndex > sprite.spriteIndex,
      );

      return insertAt === -1
        ? [...sorted, sprite]
        : [...sorted.slice(0, insertAt), sprite, ...sorted.slice(insertAt)];
    },
    [],
  );

  spritesSorted.forEach((sprite) => {
    const palette = palettes[sprite.paletteIndex];

    Array.from({ length: sprite.height }, (_, pixelY) => pixelY).forEach(
      (pixelY) => {
        const rowOption = O.fromNullable(sprite.pixels[pixelY]);
        if (O.isNone(rowOption)) return;
        const row = rowOption.value;

        Array.from({ length: sprite.width }, (_, pixelX) => pixelX).forEach(
          (pixelX) => {
            const colorIndex = row[pixelX];
            const colorIndexOption = O.fromNullable(colorIndex);
            if (O.isNone(colorIndexOption) || colorIndexOption.value === 0) {
              return;
            }

            const x = (sprite.x | 0) + pixelX;
            const y = (sprite.y | 0) + pixelY;

            if (y < 0 || y >= screen.height || x < 0 || x >= screen.width) {
              return;
            }

            const spriteRowOption = O.fromNullable(spriteLayer[y]);
            if (O.isNone(spriteRowOption)) {
              return;
            }
            spriteRowOption.value[x] = O.some(
              getPaletteHex(palette, colorIndexOption.value),
            );
          },
        );
      },
    );
  });

  return Array.from({ length: screen.height }, (_, y) =>
    Array.from({ length: screen.width }, (_, x) =>
      pipe(
        O.fromNullable(spriteLayer[y]),
        O.chain((row) => pipe(O.fromNullable(row[x]), O.flatten)),
        O.getOrElse(() =>
          pipe(
            O.fromNullable(backgroundLayer[y]),
            O.chain((row) => O.fromNullable(row[x])),
            O.getOrElse(() => getHexAt(0)),
          ),
        ),
      ),
    ),
  );
}

const getBackgroundColorIndexFromChr = (
  chrBytes: number[],
  tileIndex: number,
  pixelX: number,
  pixelY: number,
): number => {
  const tileStart = tileIndex * 16;
  const plane0 = chrBytes[tileStart + pixelY];
  const plane1 = chrBytes[tileStart + 8 + pixelY];

  if (plane0 === undefined || plane1 === undefined) {
    return 0;
  }

  const shift = 7 - pixelX;
  const bit0 = (plane0 >> shift) & 1;
  const bit1 = (plane1 >> shift) & 1;
  return (bit1 << 1) | bit0;
};

const renderBackgroundLayerFromNesTables = (
  screen: Screen,
  palettes: Palettes,
  nesState: NesProjectState,
): string[][] => {
  const backgroundLayer = Array.from({ length: screen.height }, () =>
    Array.from({ length: screen.width }, () => getHexAt(0)),
  );

  Array.from({ length: 30 }, (_, tileY) => tileY).forEach((tileY) => {
    Array.from({ length: 32 }, (_, tileX) => tileX).forEach((tileX) => {
      const nameTableIndex = getNameTableLinearIndex(tileX, tileY);
      if (E.isLeft(nameTableIndex)) {
        return;
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
      const palette = palettes[paletteIndex];
      const baseY = tileY * 8;
      const baseX = tileX * 8;

      Array.from({ length: 8 }, (_, pixelY) => pixelY).forEach((pixelY) => {
        Array.from({ length: 8 }, (_, pixelX) => pixelX).forEach((pixelX) => {
          const colorIndex = getBackgroundColorIndexFromChr(
            nesState.chrBytes,
            tileIndex,
            pixelX,
            pixelY,
          );
          const paletteColorOption = O.fromNullable(palette[colorIndex]);
          const nesColorIndex =
            colorIndex === 0
              ? nesState.universalBackgroundColor
              : pipe(
                  paletteColorOption,
                  O.getOrElse(() => nesState.universalBackgroundColor),
                );
          const y = baseY + pixelY;
          const x = baseX + pixelX;

          if (y >= 0 && y < screen.height && x >= 0 && x < screen.width) {
            const targetRowOption = O.fromNullable(backgroundLayer[y]);
            if (O.isNone(targetRowOption)) {
              return;
            }
            targetRowOption.value[x] = getHexAt(nesColorIndex);
          }
        });
      });
    });
  });

  return backgroundLayer;
};
