import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  type ProjectStoreState,
  type SpriteTile,
} from "../../../../application/state/projectStore";
import {
  buildCharacterPreviewHexGrid,
  type CharacterSet,
} from "../../../../domain/characters/characterSet";

const PREVIEW_TRANSPARENT_HEX = "#00000000";

interface PreviewPlacementBounds {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface CharacterPreviewBounds {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

export interface ScreenModeCharacterPreviewCard {
  id: string;
  name: string;
  spriteCount: number;
  previewGrid: O.Option<ReadonlyArray<ReadonlyArray<string>>>;
}

const resolvePreviewPlacements = (
  characterSet: CharacterSet,
  sprites: ReadonlyArray<SpriteTile>,
): O.Option<ReadonlyArray<PreviewPlacementBounds>> => {
  const seed: O.Option<ReadonlyArray<PreviewPlacementBounds>> = O.some([]);

  return pipe(
    characterSet.sprites.reduce(
      (placementsOption, sprite) =>
        pipe(
          placementsOption,
          O.chain((placements) =>
            pipe(
              O.fromNullable(sprites[sprite.spriteIndex]),
              O.map((tile) => [
                ...placements,
                {
                  height: tile.height,
                  width: tile.width,
                  x: sprite.x,
                  y: sprite.y,
                },
              ]),
            ),
          ),
        ),
      seed,
    ),
    O.filter((placements) => placements.length > 0),
  );
};

const resolveCharacterPreviewBounds = (
  characterSet: CharacterSet,
  sprites: ReadonlyArray<SpriteTile>,
): O.Option<CharacterPreviewBounds> =>
  pipe(
    resolvePreviewPlacements(characterSet, sprites),
    O.chain((placements) => {
      const firstPlacementOption = O.fromNullable(placements[0]);

      if (O.isNone(firstPlacementOption)) {
        return O.none;
      }

      const firstPlacement = firstPlacementOption.value;

      return O.some(
        placements.reduce<CharacterPreviewBounds>(
          (bounds, placement) => ({
            maxX: Math.max(bounds.maxX, placement.x + placement.width),
            maxY: Math.max(bounds.maxY, placement.y + placement.height),
            minX: Math.min(bounds.minX, placement.x),
            minY: Math.min(bounds.minY, placement.y),
          }),
          {
            maxX: firstPlacement.x + firstPlacement.width,
            maxY: firstPlacement.y + firstPlacement.height,
            minX: firstPlacement.x,
            minY: firstPlacement.y,
          },
        ),
      );
    }),
  );

const normalizeCharacterSetForPreview = (
  characterSet: CharacterSet,
  sprites: ReadonlyArray<SpriteTile>,
): O.Option<CharacterSet> =>
  pipe(
    resolveCharacterPreviewBounds(characterSet, sprites),
    O.map((bounds) => ({
      ...characterSet,
      sprites: characterSet.sprites.map((sprite) => ({
        ...sprite,
        x: sprite.x - bounds.minX,
        y: sprite.y - bounds.minY,
      })),
    })),
  );

const resolveCharacterPreviewGrid = (params: {
  characterSet: CharacterSet;
  spritePalettes: ProjectStoreState["nes"]["spritePalettes"];
  sprites: ReadonlyArray<SpriteTile>;
}): O.Option<ReadonlyArray<ReadonlyArray<string>>> =>
  pipe(
    normalizeCharacterSetForPreview(params.characterSet, params.sprites),
    O.chain((normalizedCharacterSet) =>
      pipe(
        buildCharacterPreviewHexGrid(normalizedCharacterSet, {
          palettes: params.spritePalettes,
          sprites: [...params.sprites],
          transparentHex: PREVIEW_TRANSPARENT_HEX,
        }),
        E.match(
          () => O.none,
          (previewGrid) => O.some(previewGrid),
        ),
      ),
    ),
  );

export const createScreenModeCharacterPreviewCards = (params: {
  characterSets: ReadonlyArray<CharacterSet>;
  spritePalettes: ProjectStoreState["nes"]["spritePalettes"];
  sprites: ReadonlyArray<SpriteTile>;
}): ReadonlyArray<ScreenModeCharacterPreviewCard> =>
  params.characterSets.map((characterSet) => ({
    id: characterSet.id,
    name: characterSet.name,
    spriteCount: characterSet.sprites.length,
    previewGrid: resolveCharacterPreviewGrid({
      characterSet,
      spritePalettes: params.spritePalettes,
      sprites: params.sprites,
    }),
  }));
