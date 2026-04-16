import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { LIBRARY_PREVIEW_SCALE } from "../../../logic/characterModeConstants";
import { CharacterModeComposePreviewCanvas } from "../../compose/CharacterModeComposePreviewCanvas";
import { CharacterModeDecomposePreviewCanvas } from "../../decomposition/CharacterModeDecomposePreviewCanvas";
import { CharacterModeDecompositionInspector } from "../../decomposition/CharacterModeDecompositionInspector";
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
import { workspaceLockMessageStyle, workspaceLockOverlayStyle } from "./styles";

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
      <Box
        position="relative"
        minHeight={0}
        minWidth={0}
        flex="1 1 0"
        display="flex"
      >
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
            aria-label="キャラクター編集ロックオーバーレイ"
            position="absolute"
            top={0}
            right={0}
            bottom={0}
            left={0}
            zIndex={14}
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="1.25rem"
            border="0.0625rem solid rgba(148, 163, 184, 0.26)"
            bgcolor="rgba(248, 250, 252, 0.76)"
            style={workspaceLockOverlayStyle}
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
