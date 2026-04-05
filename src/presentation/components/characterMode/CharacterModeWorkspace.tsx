import { Stack } from "@mui/material";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  CharacterComposeWorkspaceGrid,
  FloatingLibraryPreview,
} from "./CharacterModeLayoutPrimitives";
import { CharacterModeComposePreviewCanvas } from "./CharacterModeComposePreviewCanvas";
import { CharacterModeDecomposePreviewCanvas } from "./CharacterModeDecomposePreviewCanvas";
import { CharacterModeDecompositionInspector } from "./CharacterModeDecompositionInspector";
import { CharacterModeSidebar } from "./CharacterModeSidebar";
import {
  useCharacterModeEditorModeValue,
  useCharacterModeLibraryDragPreview,
} from "./CharacterModeStateProvider";
import { LIBRARY_PREVIEW_SCALE } from "./hooks/useCharacterModeState";
import { CharacterModeTilePreview } from "./CharacterModeTilePreview";

/**
 * 現在の編集モードに応じてワークスペース本体を切り替えます。
 */
export const CharacterModeWorkspace: React.FC = () => {
  const { editorMode } = useCharacterModeEditorModeValue();
  const dragPreview = useCharacterModeLibraryDragPreview();

  return (
    <>
      <CharacterComposeWorkspaceGrid
        aria-label="キャラクター編集ワークスペース"
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

      {editorMode === "compose"
        ? pipe(
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
        : <></>}
    </>
  );
};
