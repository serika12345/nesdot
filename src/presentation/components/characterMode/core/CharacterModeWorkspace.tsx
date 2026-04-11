import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  CHARACTER_WORKSPACE_GATE_CLASS_NAME,
  CHARACTER_WORKSPACE_LOCK_MESSAGE_CLASS_NAME,
  CHARACTER_WORKSPACE_LOCK_OVERLAY_CLASS_NAME,
} from "../../../styleClassNames";
import { CharacterModeComposePreviewCanvas } from "../compose/CharacterModeComposePreviewCanvas";
import { CharacterModeDecomposePreviewCanvas } from "../decomposition/CharacterModeDecomposePreviewCanvas";
import { CharacterModeDecompositionInspector } from "../decomposition/CharacterModeDecompositionInspector";
import { LIBRARY_PREVIEW_SCALE } from "../hooks/characterModeConstants";
import { CharacterModeTilePreview } from "../preview/CharacterModeTilePreview";
import {
  CharacterComposeWorkspaceGrid,
  FloatingLibraryPreview,
} from "../primitives/CharacterModePrimitives";
import { CharacterModeSidebar } from "../sidebar/CharacterModeSidebar";
import {
  useCharacterModeEditorModeValue,
  useCharacterModeLibraryDragPreview,
  useCharacterModeSetSelection,
} from "./CharacterModeStateProvider";

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
        className={CHARACTER_WORKSPACE_GATE_CLASS_NAME}
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
            className={CHARACTER_WORKSPACE_LOCK_OVERLAY_CLASS_NAME}
            aria-label="キャラクター編集ロックオーバーレイ"
            position="absolute"
            top={0}
            right={0}
            bottom={0}
            left={0}
            zIndex={14}
            display="grid"
            style={{ placeItems: "center" }}
          >
            <div className={CHARACTER_WORKSPACE_LOCK_MESSAGE_CLASS_NAME}>
              セットを作成すると編集できます
            </div>
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
