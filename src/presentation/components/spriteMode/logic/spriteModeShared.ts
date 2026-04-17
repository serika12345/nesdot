import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useMemo } from "react";
import {
  type PaletteIndex,
  type ProjectSpriteSize,
  type ProjectStoreState,
  type SpriteTile,
  useProjectState,
} from "../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../application/state/workbenchStore";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import { makeTile } from "../../../../domain/tiles/utils";
import { getArrayItem } from "../../../../shared/arrayAccess";

const createSpriteModeProjectUpdate = (
  state: ProjectStoreState,
  tile: SpriteTile,
  index: number,
): Pick<ProjectStoreState, "nes" | "screen" | "sprites"> => {
  const nextSprites = state.sprites.map((sprite, spriteIndex) =>
    spriteIndex === index ? tile : sprite,
  );
  const nextScreen = {
    ...state.screen,
    sprites: state.screen.sprites.map((screenSprite) =>
      screenSprite.spriteIndex === index
        ? { ...screenSprite, ...tile }
        : screenSprite,
    ),
  };

  return {
    sprites: nextSprites,
    screen: nextScreen,
    nes: mergeScreenIntoNesOam(state.nes, nextScreen),
  };
};

export const makeEmptySpriteModeTile = (
  height: ProjectSpriteSize,
  paletteIndex: PaletteIndex,
): SpriteTile => makeTile(height, paletteIndex, 0);

export const resolveSpriteModeTile = (
  spriteSize: ProjectSpriteSize,
  sprites: ReadonlyArray<SpriteTile>,
  activeSprite: number,
  activePalette: PaletteIndex,
): SpriteTile =>
  pipe(
    getArrayItem(sprites, activeSprite),
    O.getOrElse(() => makeEmptySpriteModeTile(spriteSize, activePalette)),
  );

export const useSpriteModeTileChangeAction = (): ((
  tile: SpriteTile,
  index: number,
) => void) =>
  useCallback((tile: SpriteTile, index: number): void => {
    useProjectState.setState(
      createSpriteModeProjectUpdate(useProjectState.getState(), tile, index),
    );
  }, []);

export const useSpriteModeActiveTile = (): SpriteTile => {
  const activePalette = useWorkbenchState(
    (state) => state.spriteMode.activePalette,
  );
  const activeSprite = useWorkbenchState(
    (state) => state.spriteMode.activeSprite,
  );
  const projectSpriteSize = useProjectState((state) => state.spriteSize);
  const sprites = useProjectState((state) => state.sprites);

  return useMemo(
    () =>
      resolveSpriteModeTile(
        projectSpriteSize,
        sprites,
        activeSprite,
        activePalette,
      ),
    [activePalette, activeSprite, projectSpriteSize, sprites],
  );
};
