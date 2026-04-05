import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useMemo } from "react";
import { useCharacterState } from "../../../../application/state/characterStore";
import {
  type ProjectStoreState,
  type Screen,
  type SpriteTile,
  useProjectState,
} from "../../../../application/state/projectStore";
import { type CharacterSet } from "../../../../domain/characters/characterSet";
import { scanNesSpriteConstraints } from "../../../../domain/screen/constraints";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";

export type ScreenModeScanReport = ReturnType<typeof scanNesSpriteConstraints>;

export interface ScreenModeProjectStateResult {
  screen: Screen;
  nes: ProjectStoreState["nes"];
  sprites: SpriteTile[];
  spritesOnScreen: Screen["sprites"];
  projectState: ProjectStoreState;
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

/**
 * `screenMode` が共有するストア境界と派生値をまとめます。
 * Zustand と character store から読む値、制約スキャン、NES 同期をここに閉じ込めます。
 */
export const useScreenModeProjectState = (): ScreenModeProjectStateResult => {
  const screen = useProjectState((state) => state.screen);
  const nes = useProjectState((state) => state.nes);
  const sprites = useProjectState((state) => state.sprites);
  const spritesOnScreen = useProjectState((state) => state.screen.sprites);
  const projectState = useProjectState((state) => state);

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

  const scan = (
    checkeeScreen = useProjectState.getState().screen,
    checkeeNes = useProjectState.getState().nes,
  ): ScreenModeScanReport =>
    scanNesSpriteConstraints(mergeScreenIntoNesOam(checkeeNes, checkeeScreen));

  const setScreenAndSyncNes = (
    nextScreen: Screen,
    nextNes = nes,
  ): void => {
    useProjectState.setState({
      screen: nextScreen,
      nes: mergeScreenIntoNesOam(nextNes, nextScreen),
    });
  };

  const scanReport = useMemo(() => scan(screen, nes), [nes, screen]);

  return {
    screen,
    nes,
    sprites,
    spritesOnScreen,
    projectState,
    characterSets,
    selectedCharacterId,
    activeCharacter,
    scanReport,
    selectCharacterSet,
    scan,
    setScreenAndSyncNes,
  };
};
