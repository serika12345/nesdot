import { OutlinedInput, Stack } from "@mui/material";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { Badge, FieldLabel, PanelHeaderRow, ToolButton } from "../../App.styles";
import {
  CharacterComposeWorkspaceGrid,
  CharacterStageViewport,
  ComposeCanvasMount,
  FloatingLibraryPreview,
  PreviewControlsRow,
  PreviewHeaderLayout,
  StageDragPreview,
  StageEditorCard,
  StageInputContainer,
  StageSurface,
  ViewportCenterWrap,
} from "./CharacterModeLayoutPrimitives";
import { CharacterModeSidebar } from "./CharacterModeSidebar";
import {
  CHARACTER_MODE_STAGE_LIMITS,
  LIBRARY_PREVIEW_SCALE,
} from "./hooks/useCharacterModeState";
import {
  useCharacterModeComposeCanvas,
  useCharacterModeLibraryDragPreview,
  useCharacterModeStageDisplay,
  useCharacterModeStageSize,
  useCharacterModeStageViewport,
  useCharacterModeStageZoom,
  useCharacterModeViewportPan,
} from "./CharacterModeStateProvider";
import { CharacterModeTilePreview } from "./CharacterModeTilePreview";

/**
 * キャラクター合成モードのワークスペースを描画します。
 * 左サイドバー、ステージ、ドラッグ中プレビューを合成専用の責務としてまとめます。
 */
export const CharacterModeComposeWorkspace: React.FC = () => {
  const stageDisplay = useCharacterModeStageDisplay();
  const stageSize = useCharacterModeStageSize();
  const stageZoom = useCharacterModeStageZoom();
  const viewport = useCharacterModeStageViewport();
  const viewportPan = useCharacterModeViewportPan();
  const composeCanvas = useCharacterModeComposeCanvas();
  const dragPreview = useCharacterModeLibraryDragPreview();

  return (
    <>
      <CharacterComposeWorkspaceGrid
        aria-label="キャラクター編集ワークスペース"
        flex={1}
      >
        <CharacterModeSidebar />

        <StageEditorCard flex={1}>
          <PreviewHeaderLayout>
            <PanelHeaderRow>
              <FieldLabel>プレビューキャンバス</FieldLabel>
              <Badge tone="accent">{`${stageDisplay.activeSetSpriteCount} items`}</Badge>
            </PanelHeaderRow>

            <PreviewControlsRow>
              <StageInputContainer>
                <OutlinedInput
                  type="number"
                  value={stageSize.stageWidth}
                  inputProps={{
                    min: CHARACTER_MODE_STAGE_LIMITS.minWidth,
                    max: CHARACTER_MODE_STAGE_LIMITS.maxWidth,
                    step: 8,
                    "aria-label": "プレビューキャンバス幅",
                  }}
                  onChange={(event) =>
                    stageSize.handleStageWidthChange(event.target.value)
                  }
                />
              </StageInputContainer>
              <StageInputContainer>
                <OutlinedInput
                  type="number"
                  value={stageSize.stageHeight}
                  inputProps={{
                    min: CHARACTER_MODE_STAGE_LIMITS.minHeight,
                    max: CHARACTER_MODE_STAGE_LIMITS.maxHeight,
                    step: 8,
                    "aria-label": "プレビューキャンバス高さ",
                  }}
                  onChange={(event) =>
                    stageSize.handleStageHeightChange(event.target.value)
                  }
                />
              </StageInputContainer>
              <Badge tone="neutral">{`${stageZoom.stageZoomLevel}x`}</Badge>
              <ToolButton type="button" onClick={stageZoom.handleZoomOut}>
                -
              </ToolButton>
              <ToolButton type="button" onClick={stageZoom.handleZoomIn}>
                +
              </ToolButton>
            </PreviewControlsRow>
          </PreviewHeaderLayout>

          <CharacterStageViewport
            ref={viewport.handleViewportRef}
            aria-label="プレビューキャンバスビュー"
            onWheel={viewport.handleViewportWheel}
            onPointerDown={viewport.handleViewportPointerDown}
            onPointerMove={viewport.handleViewportPointerMove}
            onPointerUp={viewport.handleViewportPointerEnd}
            onPointerCancel={viewport.handleViewportPointerEnd}
            onMouseDown={(event) => {
              if (event.button === 1) {
                event.preventDefault();
              }
            }}
            dragging={O.isSome(viewportPan.viewportPanState)}
          >
            <ViewportCenterWrap>
              <StageSurface
                ref={composeCanvas.handleStageRef}
                aria-label="キャラクターステージ"
                data-active-set-name={stageDisplay.activeSetName}
                data-stage-sprite-count={stageDisplay.activeSetSpriteCount}
                data-selected-sprite-index={
                  stageDisplay.selectedSpriteStageMetadata.index
                }
                data-selected-sprite-layer={
                  stageDisplay.selectedSpriteStageMetadata.layer
                }
                data-selected-sprite-x={stageDisplay.selectedSpriteStageMetadata.x}
                data-selected-sprite-y={stageDisplay.selectedSpriteStageMetadata.y}
                tabIndex={0}
                onContextMenu={composeCanvas.handleComposeContextMenu}
                onKeyDown={composeCanvas.handleStageKeyDown}
                activeDrop={stageDisplay.isStageDropActive}
                stageWidthPx={stageSize.stageWidth * stageSize.stageScale}
                stageHeightPx={stageSize.stageHeight * stageSize.stageScale}
                stageScale={stageSize.stageScale}
              >
                <ComposeCanvasMount onCanvasRef={composeCanvas.handleComposeCanvasRef} />

                {pipe(
                  dragPreview.libraryDragState,
                  O.match(
                    () => <></>,
                    (drag) => {
                      if (drag.isOverStage === false) {
                        return <></>;
                      }

                      return (
                        <StageDragPreview
                          key={`library-preview-${drag.spriteIndex}`}
                          previewLeft={drag.stageX * dragPreview.stageScale}
                          previewTop={drag.stageY * dragPreview.stageScale}
                        >
                          <CharacterModeTilePreview
                            scale={dragPreview.stageScale}
                            tileOption={dragPreview.getSpriteTile(drag.spriteIndex)}
                          />
                        </StageDragPreview>
                      );
                    },
                  ),
                )}
              </StageSurface>
            </ViewportCenterWrap>
          </CharacterStageViewport>
        </StageEditorCard>
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
