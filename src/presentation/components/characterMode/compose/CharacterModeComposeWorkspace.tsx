import { Stack } from "@mui/material";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  CharacterComposeWorkspaceGrid,
  FloatingLibraryPreview,
} from "../primitives/CharacterModePrimitives";
import { CharacterModeComposePreviewCanvas } from "./CharacterModeComposePreviewCanvas";
import { CharacterModeSidebar } from "../sidebar/CharacterModeSidebar";
import { LIBRARY_PREVIEW_SCALE } from "../hooks/useCharacterModeState";
import {
  useCharacterModeLibraryDragPreview,
} from "../core/CharacterModeStateProvider";
import { CharacterModeTilePreview } from "../preview/CharacterModeTilePreview";

/**
 * キャラクター合成モードのワークスペースを描画します。
 * 左サイドバー、ステージ、ドラッグ中プレビューを合成専用の責務としてまとめます。
 */
export const CharacterModeComposeWorkspace: React.FC = () => {
  const dragPreview = useCharacterModeLibraryDragPreview();

  return (
    <>
      <CharacterComposeWorkspaceGrid
        aria-label="キャラクター編集ワークスペース"
        flex={1}
      >
        <CharacterModeSidebar />

        <CharacterModeComposePreviewCanvas />
      </CharacterComposeWorkspaceGrid>

      {pipe(
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
      )}
    </>
  );
};
