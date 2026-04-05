import { useScreenModeGroupMoveState } from "./useScreenModeGroupMoveState";
import { useScreenModePlacementState } from "./useScreenModePlacementState";
import { useScreenModeProjectActions } from "./useScreenModeProjectActions";
import { useScreenModeProjectState } from "./useScreenModeProjectState";
import { useScreenModeSelectionState } from "./useScreenModeSelectionState";
import { useScreenModeViewportState } from "./useScreenModeViewportState";

/**
 * スクリーン配置画面の公開 state を組み立てます。
 * 実装は責務別フックへ分割し、画面側には 1 つの読み取り面だけを公開します。
 */
export const useScreenModeState = () => {
  const projectModel = useScreenModeProjectState();
  const { scan, setScreenAndSyncNes, selectCharacterSet } = projectModel;

  const selectionState = useScreenModeSelectionState({
    screen: projectModel.screen,
    spritesOnScreen: projectModel.spritesOnScreen,
    scan,
    setScreenAndSyncNes,
  });
  const { setSelectedSpriteIndex, ...selectionView } = selectionState;

  const placementState = useScreenModePlacementState({
    screen: projectModel.screen,
    sprites: projectModel.sprites,
    activeCharacter: projectModel.activeCharacter,
    selectCharacterSet,
    scan,
    setScreenAndSyncNes,
    selectedSpriteIndex: selectionState.selectedSpriteIndex,
    setSelectedSpriteIndex,
  });

  const groupMoveState = useScreenModeGroupMoveState({
    screen: projectModel.screen,
    spritesOnScreen: projectModel.spritesOnScreen,
    scan,
    setScreenAndSyncNes,
  });

  const viewportState = useScreenModeViewportState();

  const projectActionsState = useScreenModeProjectActions({
    screen: projectModel.screen,
    projectState: projectModel.projectState,
    scan,
    setSelectedSpriteIndex,
  });

  return {
    screen: projectModel.screen,
    spritesOnScreen: projectModel.spritesOnScreen,
    characterSets: projectModel.characterSets,
    selectedCharacterId: projectModel.selectedCharacterId,
    activeCharacter: projectModel.activeCharacter,
    scanReport: projectModel.scanReport,
    ...placementState,
    ...selectionView,
    ...groupMoveState,
    ...viewportState,
    ...projectActionsState,
  };
};

export type ScreenModeState = ReturnType<typeof useScreenModeState>;
