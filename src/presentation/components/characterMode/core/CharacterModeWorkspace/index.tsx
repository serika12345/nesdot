import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { CharacterModeComposePreviewCanvas } from "../../compose/CharacterModeComposePreviewCanvas";
import { CharacterModeDecomposePreviewCanvas } from "../../decomposition/CharacterModeDecomposePreviewCanvas";
import { CharacterModeDecompositionInspector } from "../../decomposition/CharacterModeDecompositionInspector";
import { LIBRARY_PREVIEW_SCALE } from "../../hooks/characterModeConstants";
import { CharacterModeTilePreview } from "../../preview/CharacterModeTilePreview";
import {
  CharacterComposeWorkspaceGrid,
  FloatingLibraryPreview,
} from "../../primitives/CharacterModePrimitives";
import { CharacterModeSidebar } from "../../sidebar/CharacterModeSidebar";
import {
  useCharacterModeEditorModeValue,
  useCharacterModeLibraryDragPreview,
  useCharacterModeSetSelection,
} from "../CharacterModeStateProvider";
import {
  workspaceGateProps,
  workspaceLockMessageStyle,
  workspaceLockOverlayProps,
} from "./styles";

/**
 * 現在の編集モードに応じてワークスペース本体を切り替えます。
 */
export const CharacterModeWorkspace: React.FC = () => {
  const { editorMode } = useCharacterModeEditorModeValue();
  const dragPreview = useCharacterModeLibraryDragPreview();
  const setSelection = useCharacterModeSetSelection();
  const isWorkspaceLocked = O.isNone(setSelection.selectedCharacterId);

  return (
    <>
      <Box {...workspaceGateProps}>
        <CharacterComposeWorkspaceGrid
          aria-label="キャラクター編集ワークスペース"
          aria-disabled={isWorkspaceLocked}
          flex={1}
        >
          <CharacterModeSidebar>
            {editorMode === "decompose" ? (
              <CharacterModeDecompositionInspector />
            ) : (
              <></>
            )}
          </CharacterModeSidebar>

          {editorMode === "compose" ? (
            <CharacterModeComposePreviewCanvas />
          ) : (
            <CharacterModeDecomposePreviewCanvas />
          )}
        </CharacterComposeWorkspaceGrid>

        {isWorkspaceLocked === true ? (
          <Box
            {...workspaceLockOverlayProps}
            aria-label="キャラクター編集ロックオーバーレイ"
          >
            <Box component="div" style={workspaceLockMessageStyle}>
              セットを作成すると編集できます
            </Box>
          </Box>
        ) : (
          <></>
        )}
      </Box>

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
    </>
  );
};
