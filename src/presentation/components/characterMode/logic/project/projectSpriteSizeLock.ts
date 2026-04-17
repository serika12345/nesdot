import { type SpriteTile } from "../../../../../application/state/projectStore";
import { type CharacterSet } from "../../../../../domain/characters/characterSet";

const isSpriteTileEmpty = (pixels: number[][]): boolean =>
  pixels.every((row) => row.every((colorIndex) => colorIndex === 0));

/**
 * プロジェクトのスプライトサイズ変更をロックすべきか判定します。
 * 既存データが存在する状態でサイズ変更して壊れるのを防ぐため、利用済み資産の有無をまとめて見ます。
 */
export const isProjectSpriteSizeLocked = (
  sprites: SpriteTile[],
  screenSpriteCount: number,
  characterSets: CharacterSet[],
): boolean =>
  screenSpriteCount > 0 ||
  sprites.some((sprite) => isSpriteTileEmpty(sprite.pixels) === false) ||
  characterSets.some((characterSet) => characterSet.sprites.length > 0);
