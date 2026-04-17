import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useMemo } from "react";
import { useCharacterState } from "../../../../application/state/characterStore";
import { decodeBackgroundTileAtIndex } from "../../../../domain/nes/backgroundEditing";
import {
  type ProjectStoreState,
  type Screen,
  type SpriteTile,
  useProjectState,
} from "../../../../application/state/projectStore";
import { type CharacterSet } from "../../../../domain/characters/characterSet";
import * as E from "fp-ts/Either";
import { scanNesSpriteConstraints } from "../../../../domain/screen/constraints";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import {
  PROJECT_BACKGROUND_TILE_COUNT,
  createEmptyBackgroundTile,
  type BackgroundTile,
} from "../../../../domain/project/projectV2";

export type ScreenModeScanReport = ReturnType<typeof scanNesSpriteConstraints>;

export interface ScreenModeProjectStateResult {
  screen: Screen;
  nes: ProjectStoreState["nes"];
  sprites: SpriteTile[];
  spritesOnScreen: Screen["sprites"];
  characterSets: ReadonlyArray<CharacterSet>;
  selectedCharacterId: O.Option<string>;
  activeCharacter: O.Option<CharacterSet>;
  scanReport: ScreenModeScanReport;
  selectCharacterSet: (value: O.Option<string>) => void;
  scan: (
    checkeeScreen?: Screen,
    checkeeNes?: ProjectStoreState["nes"],
  ) => ScreenModeScanReport;
  setScreenAndSyncNes: (
    nextScreen: Screen,
    nextNes?: ProjectStoreState["nes"],
  ) => void;
}

export interface ScreenModeBackgroundTilePickerState {
  backgroundPalettes: ProjectStoreState["nes"]["backgroundPalettes"];
  universalBackgroundColor: ProjectStoreState["nes"]["universalBackgroundColor"];
  visibleBackgroundTiles: ReadonlyArray<BackgroundTile>;
}

const decodeVisibleBackgroundTiles = (
  chrBytes: ProjectStoreState["nes"]["chrBytes"],
): ReadonlyArray<BackgroundTile> =>
  Array.from({ length: PROJECT_BACKGROUND_TILE_COUNT }, (_, tileIndex) => {
    const decodedTile = decodeBackgroundTileAtIndex(chrBytes, tileIndex);

    return E.isRight(decodedTile)
      ? decodedTile.right
      : createEmptyBackgroundTile();
  });

const useScreenModeProjectValues = (): Readonly<{
  nes: ProjectStoreState["nes"];
  screen: Screen;
  sprites: SpriteTile[];
  spritesOnScreen: Screen["sprites"];
}> => {
  const screen = useProjectState((state) => state.screen);
  const nes = useProjectState((state) => state.nes);
  const sprites = useProjectState((state) => state.sprites);
  const spritesOnScreen = useProjectState((state) => state.screen.sprites);

  return {
    nes,
    screen,
    sprites,
    spritesOnScreen,
  };
};

const useScreenModeCharacterSelectionState = (): Readonly<{
  activeCharacter: O.Option<CharacterSet>;
  characterSets: ReadonlyArray<CharacterSet>;
  selectedCharacterId: O.Option<string>;
  selectCharacterSet: (value: O.Option<string>) => void;
}> => {
  const characterSets = useCharacterState((state) => state.characterSets);
  const selectedCharacterId = useCharacterState(
    (state) => state.selectedCharacterId,
  );
  const selectCharacterSet = useCharacterState((state) => state.selectSet);

  const activeCharacter = useMemo(
    () =>
      pipe(
        selectedCharacterId,
        O.chain((id) =>
          O.fromNullable(
            characterSets.find((characterSet) => characterSet.id === id),
          ),
        ),
      ),
    [characterSets, selectedCharacterId],
  );

  return {
    activeCharacter,
    characterSets,
    selectedCharacterId,
    selectCharacterSet,
  };
};

const useScreenModeProjectActions = (): Readonly<{
  scan: (
    checkeeScreen?: Screen,
    checkeeNes?: ProjectStoreState["nes"],
  ) => ScreenModeScanReport;
  setScreenAndSyncNes: (
    nextScreen: Screen,
    nextNes?: ProjectStoreState["nes"],
  ) => void;
}> => {
  const scan = useCallback(
    (
      checkeeScreen = useProjectState.getState().screen,
      checkeeNes = useProjectState.getState().nes,
    ): ScreenModeScanReport =>
      scanNesSpriteConstraints(
        mergeScreenIntoNesOam(checkeeNes, checkeeScreen),
      ),
    [],
  );

  const setScreenAndSyncNes = useCallback(
    (nextScreen: Screen, nextNes = useProjectState.getState().nes): void => {
      useProjectState.setState({
        screen: nextScreen,
        nes: mergeScreenIntoNesOam(nextNes, nextScreen),
      });
    },
    [],
  );

  return {
    scan,
    setScreenAndSyncNes,
  };
};

/**
 * `screenMode` が共有するストア境界と派生値をまとめます。
 * Zustand と character store から読む値、制約スキャン、NES 同期をここに閉じ込めます。
 */
export const useScreenModeProjectState = (): ScreenModeProjectStateResult => {
  const { nes, screen, sprites, spritesOnScreen } =
    useScreenModeProjectValues();
  const {
    activeCharacter,
    characterSets,
    selectedCharacterId,
    selectCharacterSet,
  } = useScreenModeCharacterSelectionState();
  const { scan, setScreenAndSyncNes } = useScreenModeProjectActions();
  const scanReport = useMemo(() => scan(screen, nes), [nes, scan, screen]);

  return {
    screen,
    nes,
    sprites,
    spritesOnScreen,
    characterSets,
    selectedCharacterId,
    activeCharacter,
    scanReport,
    selectCharacterSet,
    scan,
    setScreenAndSyncNes,
  };
};

/**
 * screen mode の BG picker dialog が必要とする preview data です。
 * UI leaf が project store を直接読まずに済むよう、BG tile decode をこの hook で閉じます。
 */
export const useScreenModeBackgroundTilePickerState =
  (): ScreenModeBackgroundTilePickerState => {
    const backgroundPalettes = useProjectState(
      (state) => state.nes.backgroundPalettes,
    );
    const chrBytes = useProjectState((state) => state.nes.chrBytes);
    const universalBackgroundColor = useProjectState(
      (state) => state.nes.universalBackgroundColor,
    );

    const visibleBackgroundTiles = useMemo(
      () => decodeVisibleBackgroundTiles(chrBytes),
      [chrBytes],
    );

    return {
      backgroundPalettes,
      universalBackgroundColor,
      visibleBackgroundTiles,
    };
  };
