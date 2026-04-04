import { type SpriteTile } from "../../../../application/state/projectStore";
import { type CharacterSet } from "../../../../domain/characters/characterSet";

const isSpriteTileEmpty = (pixels: number[][]): boolean =>
  pixels.every((row) => row.every((colorIndex) => colorIndex === 0));

export const isProjectSpriteSizeLocked = (
  sprites: SpriteTile[],
  screenSpriteCount: number,
  characterSets: CharacterSet[],
): boolean =>
  screenSpriteCount > 0 ||
  sprites.some((sprite) => isSpriteTileEmpty(sprite.pixels) === false) ||
  characterSets.some((characterSet) => characterSet.sprites.length > 0);
