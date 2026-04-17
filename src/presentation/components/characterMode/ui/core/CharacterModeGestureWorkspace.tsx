import Stack from "@mui/material/Stack";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  useCharacterModeEditorModeValue,
  useCharacterModeLibraryDragPreview,
  useCharacterModeSetSelection,
} from "../../logic/characterModeEditorState";
import { useCharacterModeComposeStore } from "../../logic/characterModeComposeStore";
import { useCharacterModeDecompositionStore } from "../../logic/characterModeDecompositionStore";
import { LIBRARY_PREVIEW_SCALE } from "../../logic/characterModeConstants";
import { useCharacterModeComposeBridge } from "../../logic/useCharacterModeComposeBridge";
import { useCharacterModeDecompositionBridge } from "../../logic/useCharacterModeDecompositionBridge";
import { useCharacterModeStageBridge } from "../../logic/useCharacterModeStageBridge";
import { CharacterModeComposePreviewCanvas } from "../compose/CharacterModeComposePreviewCanvas";
import { CharacterModeDecomposePreviewCanvas } from "../decomposition/CharacterModeDecomposePreviewCanvas";
import { CharacterModeDecompositionInspector } from "../decomposition/CharacterModeDecompositionInspector";
import { CharacterModeDecompositionRegionMenu } from "../decomposition/CharacterModeDecompositionRegionMenu";
import { CharacterModeSpriteMenu } from "../menu/CharacterModeSpriteMenu";
import { CharacterModeTilePreview } from "../preview/CharacterModeTilePreview";
import {
  CharacterWorkspaceRoot,
  FloatingLibraryPreview,
} from "../primitives/CharacterModePrimitives";
import { CharacterModeSidebar } from "../sidebar/CharacterModeSidebar";
import { CharacterModeWorkspace } from "./CharacterModeWorkspace";

/**
 * CharacterMode の DOM bridge と gesture 系イベントをこの境界で組み立てます。
 * 子コンポーネントには必要な imperative handler だけを props で渡します。
 */
export const CharacterModeGestureWorkspace: React.FC = () => {
  const stageBridge = useCharacterModeStageBridge();
  const composeBridge = useCharacterModeComposeBridge(
    stageBridge.focusStageElement,
    stageBridge.getStageRect,
  );
  const decompositionBridge = useCharacterModeDecompositionBridge(
    stageBridge.getStageRect,
  );
  const { editorMode } = useCharacterModeEditorModeValue();
  const dragPreview = useCharacterModeLibraryDragPreview();
  const setSelection = useCharacterModeSetSelection();
  const isWorkspaceLocked = O.isNone(setSelection.selectedCharacterId);
  const handleComposeWorkspacePointerMove =
    composeBridge.handleComposeWorkspacePointerMove;
  const handleComposeWorkspacePointerEnd =
    composeBridge.handleComposeWorkspacePointerEnd;
  const handleLibraryPointerDown = composeBridge.handleLibraryPointerDown;
  const handleDecompositionWorkspacePointerMove =
    decompositionBridge.handleDecompositionWorkspacePointerMove;
  const handleDecompositionWorkspacePointerEnd =
    decompositionBridge.handleDecompositionWorkspacePointerEnd;

  const handleWorkspacePointerDownCapture = React.useCallback<
    React.PointerEventHandler<HTMLDivElement>
  >((event) => {
    const targetElement = event.target;
    const isInsideContextMenu =
      targetElement instanceof Element &&
      targetElement.closest("[data-context-menu]") instanceof Element;

    if (isInsideContextMenu === true) {
      return;
    }

    useCharacterModeComposeStore.getState().closeSpriteContextMenu();
    useCharacterModeDecompositionStore
      .getState()
      .closeDecompositionRegionContextMenu();
  }, []);

  const handleWorkspacePointerMoveCapture = React.useCallback<
    React.PointerEventHandler<HTMLDivElement>
  >(
    (event) => {
      if (handleComposeWorkspacePointerMove(event) === true) {
        return;
      }

      handleDecompositionWorkspacePointerMove(event);
    },
    [
      handleComposeWorkspacePointerMove,
      handleDecompositionWorkspacePointerMove,
    ],
  );

  const handleWorkspacePointerEndCapture = React.useCallback<
    React.PointerEventHandler<HTMLDivElement>
  >(
    (event) => {
      if (handleComposeWorkspacePointerEnd(event) === true) {
        return;
      }

      handleDecompositionWorkspacePointerEnd(event);
    },
    [handleComposeWorkspacePointerEnd, handleDecompositionWorkspacePointerEnd],
  );

  return (
    <CharacterWorkspaceRoot
      flex={1}
      onPointerDownCapture={handleWorkspacePointerDownCapture}
      onPointerMoveCapture={handleWorkspacePointerMoveCapture}
      onPointerUpCapture={handleWorkspacePointerEndCapture}
      onPointerCancelCapture={handleWorkspacePointerEndCapture}
    >
      <CharacterModeWorkspace
        isWorkspaceLocked={isWorkspaceLocked}
        sidebarContent={
          <CharacterModeSidebar
            handleLibraryPointerDown={handleLibraryPointerDown}
          >
            {editorMode === "decompose" ? (
              <CharacterModeDecompositionInspector />
            ) : (
              <></>
            )}
          </CharacterModeSidebar>
        }
        workspaceContent={
          editorMode === "compose" ? (
            <CharacterModeComposePreviewCanvas
              composeHandlers={{
                handleComposeCanvasRef: composeBridge.handleComposeCanvasRef,
                handleComposeContextMenu:
                  composeBridge.handleComposeContextMenu,
                handleStageKeyDown: composeBridge.handleStageKeyDown,
              }}
              stageHandlers={{
                handleStageRef: stageBridge.handleStageRef,
                handleViewportPointerDown:
                  stageBridge.handleViewportPointerDown,
                handleViewportPointerEnd: stageBridge.handleViewportPointerEnd,
                handleViewportPointerMove:
                  stageBridge.handleViewportPointerMove,
                handleViewportRef: stageBridge.handleViewportRef,
                handleViewportWheel: stageBridge.handleViewportWheel,
              }}
            />
          ) : (
            <CharacterModeDecomposePreviewCanvas
              decompositionHandlers={{
                handleDecompositionCanvasPointerDown:
                  decompositionBridge.handleDecompositionCanvasPointerDown,
                handleDecompositionCanvasRef:
                  decompositionBridge.handleDecompositionCanvasRef,
                handleDecompositionRegionContextMenu:
                  decompositionBridge.handleDecompositionRegionContextMenu,
                handleDecompositionRegionPointerDown:
                  decompositionBridge.handleDecompositionRegionPointerDown,
              }}
              stageHandlers={{
                handleStageRef: stageBridge.handleStageRef,
                handleViewportPointerDown:
                  stageBridge.handleViewportPointerDown,
                handleViewportPointerEnd: stageBridge.handleViewportPointerEnd,
                handleViewportPointerMove:
                  stageBridge.handleViewportPointerMove,
                handleViewportRef: stageBridge.handleViewportRef,
                handleViewportWheel: stageBridge.handleViewportWheel,
              }}
            />
          )
        }
      />

      {editorMode === "compose" ? (
        pipe(
          dragPreview.libraryDragState,
          O.match(
            () => <></>,
            (drag) => (
              <FloatingLibraryPreview
                aria-label="ライブラリドラッグプレビュー"
                dragClientX={drag.clientX}
                dragClientY={drag.clientY}
              >
                <Stack
                  height="100%"
                  width="100%"
                  alignItems="center"
                  justifyContent="center"
                  spacing={0}
                >
                  <CharacterModeTilePreview
                    scale={LIBRARY_PREVIEW_SCALE}
                    spritePalettes={dragPreview.spritePalettes}
                    tileOption={dragPreview.getSpriteTile(drag.spriteIndex)}
                  />
                </Stack>
              </FloatingLibraryPreview>
            ),
          ),
        )
      ) : (
        <></>
      )}

      <CharacterModeSpriteMenu
        focusStageElement={stageBridge.focusStageElement}
        handleComposeContextMenu={composeBridge.handleComposeContextMenu}
      />
      <CharacterModeDecompositionRegionMenu
        focusStageElement={stageBridge.focusStageElement}
      />
    </CharacterWorkspaceRoot>
  );
};
