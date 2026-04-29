import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useMemo } from "react";
import { useCharacterState } from "../../../../application/state/characterStore";
import {
  type ProjectStoreState,
  type Screen,
  type SpriteTile,
  useProjectState,
} from "../../../../application/state/projectStore";
import { type CharacterSet } from "../../../../domain/characters/characterSet";
import { scanProjectStateV2SpriteConstraints } from "../../../../domain/screen/constraints";
import { type BackgroundTile } from "../../../../domain/project/projectV2";

export type ScreenModeScanReport = ReturnType<
  typeof scanProjectStateV2SpriteConstraints
>;

export interface ScreenModeProjectStateResult {
  screen: Screen;
  sprites: ReadonlyArray<SpriteTile>;
  backgroundTiles: ProjectStoreState["backgroundTiles"];
  backgroundPalettes: ProjectStoreState["palettes"]["background"];
  spritePalettes: ProjectStoreState["palettes"]["sprite"];
  universalBackgroundColor: ProjectStoreState["palettes"]["universalBackgroundColor"];
  spritesOnScreen: Screen["sprites"];
  characterSets: ReadonlyArray<CharacterSet>;
  selectedCharacterId: O.Option<string>;
  activeCharacter: O.Option<CharacterSet>;
  scanReport: ScreenModeScanReport;
  selectCharacterSet: (value: O.Option<string>) => void;
  scan: (checkeeScreen?: Screen) => ScreenModeScanReport;
  setScreenAndSyncNes: (nextScreen: Screen) => void;
}

export interface ScreenModeBackgroundTilePickerState {
  backgroundPalettes: ProjectStoreState["palettes"]["background"];
  universalBackgroundColor: ProjectStoreState["palettes"]["universalBackgroundColor"];
  visibleBackgroundTiles: ReadonlyArray<BackgroundTile>;
}

const useScreenModeProjectValues = (): Readonly<{
  screen: Screen;
  sprites: ReadonlyArray<SpriteTile>;
  backgroundTiles: ProjectStoreState["backgroundTiles"];
  backgroundPalettes: ProjectStoreState["palettes"]["background"];
  spritePalettes: ProjectStoreState["palettes"]["sprite"];
  universalBackgroundColor: ProjectStoreState["palettes"]["universalBackgroundColor"];
  spritesOnScreen: Screen["sprites"];
}> => {
  const projectState = useProjectState();

  return {
    screen: projectState.screen,
    sprites: projectState.spriteTiles,
    backgroundTiles: projectState.backgroundTiles,
    backgroundPalettes: projectState.palettes.background,
    spritePalettes: projectState.palettes.sprite,
    universalBackgroundColor: projectState.palettes.universalBackgroundColor,
    spritesOnScreen: projectState.screen.sprites,
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
  scan: (checkeeScreen?: Screen) => ScreenModeScanReport;
  setScreenAndSyncNes: (nextScreen: Screen) => void;
}> => {
  const scan = useCallback(
    (checkeeScreen = useProjectState.getState().screen): ScreenModeScanReport =>
      scanProjectStateV2SpriteConstraints({
        ...useProjectState.getState(),
        screen: checkeeScreen,
      }),
    [],
  );

  const setScreenAndSyncNes = useCallback((nextScreen: Screen): void => {
    useProjectState.setState({
      screen: nextScreen,
    });
  }, []);

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
  const {
    backgroundPalettes,
    backgroundTiles,
    screen,
    spritePalettes,
    sprites,
    spritesOnScreen,
    universalBackgroundColor,
  } = useScreenModeProjectValues();
  const {
    activeCharacter,
    characterSets,
    selectedCharacterId,
    selectCharacterSet,
  } = useScreenModeCharacterSelectionState();
  const { scan, setScreenAndSyncNes } = useScreenModeProjectActions();
  const scanReport = useMemo(() => scan(screen), [scan, screen]);

  return {
    screen,
    sprites,
    backgroundTiles,
    backgroundPalettes,
    spritePalettes,
    universalBackgroundColor,
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
      (state) => state.palettes.background,
    );
    const visibleBackgroundTiles = useProjectState(
      (state) => state.backgroundTiles,
    );
    const universalBackgroundColor = useProjectState(
      (state) => state.palettes.universalBackgroundColor,
    );

    return {
      backgroundPalettes,
      universalBackgroundColor,
      visibleBackgroundTiles,
    };
  };
