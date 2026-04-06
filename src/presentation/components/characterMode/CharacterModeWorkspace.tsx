import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { CharacterModeComposePreviewCanvas } from "./CharacterModeComposePreviewCanvas";
import { CharacterModeDecomposePreviewCanvas } from "./CharacterModeDecomposePreviewCanvas";
import { CharacterModeDecompositionInspector } from "./CharacterModeDecompositionInspector";
import {
  CharacterComposeWorkspaceGrid,
  FloatingLibraryPreview,
} from "./CharacterModeLayoutPrimitives";
import { CharacterModeSidebar } from "./CharacterModeSidebar";
import {
  useCharacterModeEditorModeValue,
  useCharacterModeLibraryDragPreview,
  useCharacterModeSetSelection,
} from "./CharacterModeStateProvider";
import { CharacterModeTilePreview } from "./CharacterModeTilePreview";
import { LIBRARY_PREVIEW_SCALE } from "./hooks/useCharacterModeState";

const shouldForwardLockedStateProp = (prop: PropertyKey): boolean =>
  prop !== "lockedState";

const WorkspaceGateRoot = styled("div")({
  position: "relative",
  minHeight: 0,
  minWidth: 0,
  flex: "1 1 0",
  display: "flex",
});

const WorkspaceLockOverlay = styled("div", {
  shouldForwardProp: shouldForwardLockedStateProp,
})<{ lockedState: boolean }>(({ lockedState }) => ({
  position: "absolute",
  inset: 0,
  zIndex: 14,
  display: lockedState ? "grid" : "none",
  placeItems: "center",
  borderRadius: "1.25rem",
  border: "0.0625rem solid rgba(148, 163, 184, 0.26)",
  background: "rgba(248, 250, 252, 0.76)",
  backdropFilter: "blur(1.5px)",
}));

const WorkspaceLockMessage = styled("div")({
  borderRadius: "999px",
  padding: "0.625rem 0.875rem",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92))",
  border: "0.0625rem solid rgba(148, 163, 184, 0.28)",
  color: "var(--ink-strong)",
  fontSize: "0.8125rem",
  fontWeight: 700,
  letterSpacing: "0.05em",
});

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
      <WorkspaceGateRoot>
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
          <WorkspaceLockOverlay
            lockedState={isWorkspaceLocked}
            aria-label="キャラクター編集ロックオーバーレイ"
          >
            <WorkspaceLockMessage>
              セットを作成すると編集できます
            </WorkspaceLockMessage>
          </WorkspaceLockOverlay>
        ) : (
          <></>
        )}
      </WorkspaceGateRoot>

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
