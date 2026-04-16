import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { decodeBackgroundTileAtIndex } from "../../../../../../domain/nes/backgroundEditing";
import { createEmptyBackgroundTile } from "../../../../../../domain/project/projectV2";
import { type ScreenModeWorkspaceBackgroundEditingStateResult } from "../../../logic/screenModeWorkspaceBackgroundEditingState";
import { useScreenModeContextMenuState } from "../../../logic/useScreenModeContextMenuState";
import { useScreenModeLibraryState } from "../../../logic/useScreenModeLibraryState";
import { type ScreenModeProjectStateResult } from "../../../logic/useScreenModeProjectState";
import { useScreenModeStageState } from "../../../logic/useScreenModeStageState";
import { type ScreenModeViewportStateResult } from "../../../logic/useScreenModeViewportState";
import { ScreenModeBackgroundPlacementMockOverlay } from "../../overlays/ScreenModeBackgroundPlacementMockOverlay";
import { ScreenModeCharacterLibraryPanel } from "./ScreenModeCharacterLibraryPanel";
import { ScreenModeFloatingPreview } from "./ScreenModeFloatingPreview";
import { ScreenModeGestureContextMenu } from "./ScreenModeGestureContextMenu";
import { ScreenModeSpriteLibraryPanel } from "./ScreenModeSpriteLibraryPanel";
import { ScreenModeStageViewport } from "./ScreenModeStageViewport";
import { ScreenModeWorkspaceHeader } from "./ScreenModeWorkspaceHeader";
import { helperTextStyle, sidebarScrollStyle } from "./styles";
import {
  type ScreenModeGestureWorkspaceBackgroundEditing,
  type ScreenModeGestureWorkspaceDisplayState,
} from "./types";

interface ScreenModeGestureWorkspaceProps {
  backgroundEditingState: ScreenModeWorkspaceBackgroundEditingStateResult;
  projectState: ScreenModeProjectStateResult;
  viewportState: ScreenModeViewportStateResult;
}

/**
 * スクリーン配置モードのジェスチャー中心ワークスペースを描画します。
 * focused hook をこの境界で組み合わせ、子コンポーネントへは役割単位の最小 props だけを渡します。
 */
export const ScreenModeGestureWorkspace: React.FC<
  ScreenModeGestureWorkspaceProps
> = ({ backgroundEditingState, projectState, viewportState }) => {
  const [displayState, setDisplayState] =
    React.useState<ScreenModeGestureWorkspaceDisplayState>({
      isSpriteIndexVisible: false,
      isSpriteOutlineVisible: true,
    });
  const stageController = useScreenModeStageState({
    scan: projectState.scan,
    screen: projectState.screen,
    screenZoomLevel: viewportState.screenZoomLevel,
    setScreenAndSyncNes: projectState.setScreenAndSyncNes,
  });
  const contextMenuState = useScreenModeContextMenuState({
    closeContextMenu: stageController.closeContextMenu,
    contextMenu: stageController.contextMenu,
    replaceSelection: stageController.replaceSelection,
    scan: projectState.scan,
    screen: projectState.screen,
    selectedSpriteIndices: stageController.stageState.selectedSpriteIndices,
    setScreenAndSyncNes: projectState.setScreenAndSyncNes,
  });
  const libraryController = useScreenModeLibraryState({
    characterSets: projectState.characterSets,
    closeContextMenu: stageController.closeContextMenu,
    nes: projectState.nes,
    replaceSelection: stageController.replaceSelection,
    resolveStagePointFromClient: stageController.resolveStagePointFromClient,
    scan: projectState.scan,
    screen: projectState.screen,
    setScreenAndSyncNes: projectState.setScreenAndSyncNes,
    sprites: projectState.sprites,
  });
  const closeContextMenu = stageController.closeContextMenu;
  const handleDeleteSprites = contextMenuState.handleDeleteSprites;
  const handleNudgeSelection = stageController.handleNudgeSelection;

  const handleWorkspaceContextMenuCapture = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );
  const handleWorkspacePointerDownCapture = React.useCallback(() => {
    closeContextMenu();
  }, [closeContextMenu]);

  const grabbedBackgroundTile = React.useMemo(() => {
    if (O.isNone(backgroundEditingState.grabbedTileIndex)) {
      return O.none;
    }

    const decodedTile = decodeBackgroundTileAtIndex(
      projectState.nes.chrBytes,
      backgroundEditingState.grabbedTileIndex.value,
    );

    return O.some(
      E.isRight(decodedTile) ? decodedTile.right : createEmptyBackgroundTile(),
    );
  }, [backgroundEditingState.grabbedTileIndex, projectState.nes.chrBytes]);

  const grabbedTilePreview =
    backgroundEditingState.editingTarget === "bgTile" &&
    O.isSome(grabbedBackgroundTile)
      ? O.some(grabbedBackgroundTile.value)
      : O.none;

  const backgroundEditing: O.Option<ScreenModeGestureWorkspaceBackgroundEditing> =
    backgroundEditingState.editingTarget !== "sprite"
      ? pipe(
          backgroundEditingState.cursorOverlay,
          O.match(
            () =>
              O.some({
                overlay: <></>,
                onClick: backgroundEditingState.handleStageClick,
                onPointerDown: backgroundEditingState.handleStagePointerDown,
                onPointerMove: backgroundEditingState.handleStagePointerMove,
                onPointerUp: backgroundEditingState.handleStagePointerUp,
              }),
            (overlayState) =>
              O.some({
                overlay: O.isSome(grabbedTilePreview) ? (
                  <ScreenModeBackgroundPlacementMockOverlay
                    placement={overlayState}
                    preview={{
                      kind: "tile",
                      palette:
                        projectState.nes.backgroundPalettes[
                          backgroundEditingState.activePaletteIndex
                        ],
                      tile: grabbedTilePreview.value,
                      universalBackgroundColor:
                        projectState.nes.universalBackgroundColor,
                    }}
                    screenZoomLevel={viewportState.screenZoomLevel}
                  />
                ) : (
                  <ScreenModeBackgroundPlacementMockOverlay
                    placement={overlayState}
                    preview={{ kind: "none" }}
                    screenZoomLevel={viewportState.screenZoomLevel}
                  />
                ),
                onClick: backgroundEditingState.handleStageClick,
                onPointerDown: backgroundEditingState.handleStagePointerDown,
                onPointerMove: backgroundEditingState.handleStagePointerMove,
                onPointerUp: backgroundEditingState.handleStagePointerUp,
              }),
          ),
        )
      : O.none;

  const handleStageKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeContextMenu();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleNudgeSelection("left");
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNudgeSelection("right");
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        handleNudgeSelection("up");
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        handleNudgeSelection("down");
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        handleDeleteSprites();
      }
    },
    [closeContextMenu, handleDeleteSprites, handleNudgeSelection],
  );

  return (
    <Stack
      useFlexGap
      flex={1}
      minHeight={0}
      spacing="0.875rem"
      onContextMenuCapture={handleWorkspaceContextMenuCapture}
      onPointerDownCapture={handleWorkspacePointerDownCapture}
      onPointerMoveCapture={libraryController.handleWorkspacePointerMoveCapture}
      onPointerUpCapture={libraryController.handleWorkspacePointerEndCapture}
      onPointerCancelCapture={
        libraryController.handleWorkspacePointerEndCapture
      }
    >
      <ScreenModeWorkspaceHeader
        backgroundEditingState={backgroundEditingState}
        displayState={displayState}
        onDisplayStateChange={setDisplayState}
        summary={{
          selectedSpriteCount: stageController.stageState.selectedSpriteCount,
          spriteCount: projectState.screen.sprites.length,
          zoomLevel: viewportState.screenZoomLevel,
        }}
        zoomActions={{
          handleZoomIn: viewportState.handleZoomIn,
          handleZoomOut: viewportState.handleZoomOut,
        }}
      />

      <Box component="p" m={0} mt={0.25} style={helperTextStyle}>
        スプライト/キャラクタープレビューをドラッグして配置。右クリックで編集メニュー、Shift+クリックで複数選択、ドラッグで移動できます。
      </Box>

      <Stack
        useFlexGap
        minHeight={0}
        minWidth={0}
        flex="1 1 0"
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
      >
        <Stack
          useFlexGap
          minHeight={0}
          minWidth={0}
          maxHeight="100%"
          spacing={1.5}
          width={{ lg: "21rem" }}
          flexShrink={{ lg: 0 }}
          style={sidebarScrollStyle}
          role="complementary"
          aria-label="スクリーン配置サイドバー"
        >
          <ScreenModeSpriteLibraryPanel
            libraryState={libraryController.libraryState}
            sprites={projectState.sprites}
          />
          <ScreenModeCharacterLibraryPanel
            libraryState={libraryController.libraryState}
          />
        </Stack>

        <ScreenModeStageViewport
          screen={projectState.screen}
          stageState={stageController.stageState}
          stageUiState={{
            backgroundEditing,
            displayState,
            handleKeyDown: handleStageKeyDown,
          }}
          viewportState={viewportState}
        />
      </Stack>

      <ScreenModeGestureContextMenu contextMenuState={contextMenuState} />
      <ScreenModeFloatingPreview
        libraryState={libraryController.libraryState}
        sprites={projectState.sprites}
      />
    </Stack>
  );
};
