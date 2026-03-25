import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import type { Palettes, Screen, SpriteTile } from "../store/projectState";
import { NES_PALETTE_HEX } from "./palette";

export function renderSpriteTileToHexArray(
  tile: SpriteTile,
  palettes: Palettes,
): string[][] {
  const palette = palettes[tile.paletteIndex];

  return tile.pixels.map((row) =>
    row.map((colorIndexOfPalette) =>
      colorIndexOfPalette === 0
        ? NES_PALETTE_HEX[0]
        : NES_PALETTE_HEX[palette[colorIndexOfPalette]],
    ),
  );
}

export function renderScreenToHexArray(
  screen: Screen,
  palettes: Palettes,
): string[][] {
  const backgroundLayer = Array.from({ length: screen.height }, () =>
    Array.from({ length: screen.width }, () => NES_PALETTE_HEX[0]),
  );
  const spriteLayer = Array.from({ length: screen.height }, () =>
    Array.from({ length: screen.width }, () => O.none as O.Option<string>),
  );

  screen.backgroundTiles.forEach((row, tileY) => {
    row.forEach((tile, tileX) => {
      const palette = palettes[tile.paletteIndex];
      const baseY = tileY * 8;
      const baseX = tileX * 8;

      Array.from({ length: 8 }, (_, pixelY) => pixelY).forEach((pixelY) => {
        Array.from({ length: 8 }, (_, pixelX) => pixelX).forEach((pixelX) => {
          const colorIndex = tile.pixels[pixelY][pixelX];
          const hex = NES_PALETTE_HEX[palette[colorIndex]];
          const y = baseY + pixelY;
          const x = baseX + pixelX;

          if (y >= 0 && y < screen.height && x >= 0 && x < screen.width) {
            backgroundLayer[y][x] = hex;
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
        const row = sprite.pixels[pixelY];
        if (!row) return;

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

            spriteLayer[y][x] = O.some(
              NES_PALETTE_HEX[palette[colorIndexOption.value]],
            );
          },
        );
      },
    );
  });

  return Array.from({ length: screen.height }, (_, y) =>
    Array.from({ length: screen.width }, (_, x) =>
      pipe(
        spriteLayer[y][x],
        O.getOrElse(() => backgroundLayer[y][x]),
      ),
    ),
  );
}
