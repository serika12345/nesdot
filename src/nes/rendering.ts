import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
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
): string[][] {
  const backgroundLayer = Array.from({ length: screen.height }, () =>
    Array.from({ length: screen.width }, () => getHexAt(0)),
  );
  const spriteLayer = Array.from({ length: screen.height }, () =>
    Array.from({ length: screen.width }, (): O.Option<string> => O.none),
  );

  screen.backgroundTiles.forEach((row, tileY) => {
    row.forEach((tile, tileX) => {
      const palette = palettes[tile.paletteIndex];
      const baseY = tileY * 8;
      const baseX = tileX * 8;

      Array.from({ length: 8 }, (_, pixelY) => pixelY).forEach((pixelY) => {
        Array.from({ length: 8 }, (_, pixelX) => pixelX).forEach((pixelX) => {
          const rowOption = O.fromNullable(tile.pixels[pixelY]);
          if (O.isNone(rowOption)) {
            return;
          }
          const colorIndexOption = O.fromNullable(rowOption.value[pixelX]);
          if (O.isNone(colorIndexOption)) {
            return;
          }

          const hex = getPaletteHex(palette, colorIndexOption.value);
          const y = baseY + pixelY;
          const x = baseX + pixelX;

          if (y >= 0 && y < screen.height && x >= 0 && x < screen.width) {
            const targetRowOption = O.fromNullable(backgroundLayer[y]);
            if (O.isNone(targetRowOption)) {
              return;
            }
            targetRowOption.value[x] = hex;
          }
        });
      });
    });
  });

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
