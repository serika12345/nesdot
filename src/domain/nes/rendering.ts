import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import type { Screen, SpritePriority, SpriteTile } from "../project/project";
import type { ProjectStateV2 } from "../project/projectV2";
import {
  getNameTableLinearIndex,
  NES_EMPTY_BACKGROUND_TILE_INDEX,
  NesProjectState,
  NesSpritePalettes,
  resolveBackgroundPaletteIndex,
} from "./nesProject";
import { NES_PALETTE_HEX } from "./palette";
import { buildNesProjection } from "./projection";

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

interface BackgroundPixel {
  hex: string;
  opaque: boolean;
}

const DEFAULT_BACKGROUND_PIXEL: BackgroundPixel = {
  hex: getHexAt(0),
  opaque: false,
};

const createTransparentBackgroundPixel = (
  universalBackgroundColor: number,
): BackgroundPixel => ({
  hex: getHexAt(universalBackgroundColor),
  opaque: false,
});

/**
 * スプライトタイルを表示用の 16 進カラー配列へ変換します。
 * パレット index とピクセル値を UI がそのまま描ける色情報へ展開するのが役割です。
 */
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

/**
 * 背景とスプライトを合成したスクリーン全体の色グリッドを生成します。
 * NES の優先度とパレット解決を反映した最終表示を、プレビューや書き出し用に組み立てます。
 */
export function renderScreenToHexArray(
  screen: Screen,
  nesState: NesProjectState,
): string[][] {
  return Array.from({ length: screen.height }, (_, y) =>
    Array.from({ length: screen.width }, (_, x) => {
      const backgroundPixel = resolveBackgroundPixelAt(nesState, x, y);
      const spritePixelOption = resolveSpritePixelAt(screen, nesState, x, y);

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

/**
 * 正規化済み v2 project state からスクリーン全体の色グリッドを生成します。
 * UI 側が NES projection を意識せずに背景とスプライトの合成結果を取得する入口です。
 */
export function renderProjectStateV2ToHexArray(
  projectState: ProjectStateV2,
): string[][] {
  return renderScreenToHexArray(
    {
      width: projectState.screen.width,
      height: projectState.screen.height,
      sprites: Array.from(projectState.screen.sprites),
    },
    buildNesProjection(projectState),
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

const resolveBackgroundPixelAt = (
  nesState: NesProjectState,
  x: number,
  y: number,
): BackgroundPixel => {
  const tileX = Math.floor(x / 8);
  const tileY = Math.floor(y / 8);
  const nameTableIndex = getNameTableLinearIndex(tileX, tileY);

  if (E.isLeft(nameTableIndex)) {
    return DEFAULT_BACKGROUND_PIXEL;
  }

  const tileIndex = nesState.nameTable.tileIndices[nameTableIndex.right] ?? 0;

  if (tileIndex === NES_EMPTY_BACKGROUND_TILE_INDEX) {
    return createTransparentBackgroundPixel(nesState.universalBackgroundColor);
  }

  const paletteIndexEither = resolveBackgroundPaletteIndex(
    nesState.attributeTable,
    tileX,
    tileY,
  );
  const paletteIndex = E.isRight(paletteIndexEither)
    ? paletteIndexEither.right
    : 0;
  const palette = nesState.backgroundPalettes[paletteIndex];
  const colorIndex = getBackgroundColorIndexFromChr(
    nesState.chrBytes,
    tileIndex,
    x % 8,
    y % 8,
  );
  const nesColorIndex =
    colorIndex === 0
      ? nesState.universalBackgroundColor
      : (palette[colorIndex] ?? nesState.universalBackgroundColor);

  return {
    hex: getHexAt(nesColorIndex),
    opaque: colorIndex !== 0,
  };
};

const resolveSpriteColorIndexAt = (
  sprite: Screen["sprites"][number],
  x: number,
  y: number,
): O.Option<number> => {
  const localX = x - (sprite.x | 0);
  const localY = y - (sprite.y | 0);
  const isInBounds =
    localX >= 0 &&
    localX < sprite.width &&
    localY >= 0 &&
    localY < sprite.height;

  if (isInBounds === false) {
    return O.none;
  }

  const sourcePixelX =
    sprite.flipH === true ? sprite.width - 1 - localX : localX;
  const sourcePixelY =
    sprite.flipV === true ? sprite.height - 1 - localY : localY;

  return pipe(
    O.fromNullable(sprite.pixels[sourcePixelY]),
    O.chain((row) => O.fromNullable(row[sourcePixelX])),
    O.filter((colorIndex) => colorIndex !== 0),
  );
};

const resolveSpritePixelAt = (
  screen: Screen,
  nesState: NesProjectState,
  x: number,
  y: number,
): O.Option<{ hex: string; priority: SpritePriority }> =>
  pipe(
    O.fromNullable(
      screen.sprites.find((sprite) =>
        pipe(resolveSpriteColorIndexAt(sprite, x, y), O.isSome),
      ),
    ),
    O.chain((sprite) =>
      pipe(
        resolveSpriteColorIndexAt(sprite, x, y),
        O.map((colorIndex) => ({
          hex: getPaletteHex(
            nesState.spritePalettes[sprite.paletteIndex],
            colorIndex,
          ),
          priority: sprite.priority === "behindBg" ? "behindBg" : "front",
        })),
      ),
    ),
  );
