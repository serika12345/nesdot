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
  type CharacterModeController,
} from "./hooks/useCharacterModeController";

interface CharacterModeComposeWorkspaceProps {
  controller: CharacterModeController;
  renderSpritePixels: (spriteIndex: number, scale: number) => React.ReactNode;
}

/**
 * キャラクター合成モードのワークスペースを描画します。
 * 左サイドバー、ステージ、ドラッグ中プレビューを合成専用の責務としてまとめます。
 */
export const CharacterModeComposeWorkspace: React.FC<
  CharacterModeComposeWorkspaceProps
> = ({ controller, renderSpritePixels }) => {
  const {
    activeSet,
    activeSetName,
    activeSetSpriteCount,
    handleComposeCanvasRef,
    handleComposeContextMenu,
    handleEditorModeChange,
    handleLibraryPointerDown,
    handleProjectSpriteSizeChange,
    handleSetNameChange,
    handleStageHeightChange,
    handleStageKeyDown,
    handleStageRef,
    handleStageWidthChange,
    handleViewportPointerDown,
    handleViewportPointerEnd,
    handleViewportPointerMove,
    handleViewportRef,
    handleViewportWheel,
    handleZoomIn,
    handleZoomOut,
    isSpriteDragging,
    isStageDropActive,
    libraryDragState,
    projectSpriteSize,
    projectSpriteSizeLocked,
    selectedSpriteStageMetadata,
    sprites,
    stageHeight,
    stageScale,
    stageWidth,
    stageZoomLevel,
    viewportPanState,
  } = controller;

  return (
    <>
      <CharacterComposeWorkspaceGrid
        aria-label="キャラクター編集ワークスペース"
        flex={1}
      >
        <CharacterModeSidebar
          activeSetAvailable={O.isSome(activeSet)}
          activeSetName={activeSetName}
          activeMode="compose"
          projectSpriteSize={projectSpriteSize}
          projectSpriteSizeLocked={projectSpriteSizeLocked}
          sprites={sprites}
          isLibraryDraggable={O.isSome(activeSet)}
          isSpriteDragging={isSpriteDragging}
          onSetNameChange={handleSetNameChange}
          onEditorModeChange={handleEditorModeChange}
          onProjectSpriteSizeChange={handleProjectSpriteSizeChange}
          onLibraryPointerDown={handleLibraryPointerDown}
          renderSpritePixels={renderSpritePixels}
          libraryPreviewScale={LIBRARY_PREVIEW_SCALE}
        />

        <StageEditorCard flex={1}>
          <PreviewHeaderLayout>
            <PanelHeaderRow>
              <FieldLabel>プレビューキャンバス</FieldLabel>
              <Badge tone="accent">{`${activeSetSpriteCount} items`}</Badge>
            </PanelHeaderRow>

            <PreviewControlsRow>
              <StageInputContainer>
                <OutlinedInput
                  type="number"
                  value={stageWidth}
                  inputProps={{
                    min: CHARACTER_MODE_STAGE_LIMITS.minWidth,
                    max: CHARACTER_MODE_STAGE_LIMITS.maxWidth,
                    step: 8,
                    "aria-label": "プレビューキャンバス幅",
                  }}
                  onChange={(event) => handleStageWidthChange(event.target.value)}
                />
              </StageInputContainer>
              <StageInputContainer>
                <OutlinedInput
                  type="number"
                  value={stageHeight}
                  inputProps={{
                    min: CHARACTER_MODE_STAGE_LIMITS.minHeight,
                    max: CHARACTER_MODE_STAGE_LIMITS.maxHeight,
                    step: 8,
                    "aria-label": "プレビューキャンバス高さ",
                  }}
                  onChange={(event) => handleStageHeightChange(event.target.value)}
                />
              </StageInputContainer>
              <Badge tone="neutral">{`${stageZoomLevel}x`}</Badge>
              <ToolButton type="button" onClick={handleZoomOut}>
                -
              </ToolButton>
              <ToolButton type="button" onClick={handleZoomIn}>
                +
              </ToolButton>
            </PreviewControlsRow>
          </PreviewHeaderLayout>

          <CharacterStageViewport
            ref={handleViewportRef}
            aria-label="プレビューキャンバスビュー"
            onWheel={handleViewportWheel}
            onPointerDown={handleViewportPointerDown}
            onPointerMove={handleViewportPointerMove}
            onPointerUp={handleViewportPointerEnd}
            onPointerCancel={handleViewportPointerEnd}
            onMouseDown={(event) => {
              if (event.button === 1) {
                event.preventDefault();
              }
            }}
            dragging={O.isSome(viewportPanState)}
          >
            <ViewportCenterWrap>
              <StageSurface
                ref={handleStageRef}
                aria-label="キャラクターステージ"
                data-active-set-name={activeSetName}
                data-stage-sprite-count={activeSetSpriteCount}
                data-selected-sprite-index={selectedSpriteStageMetadata.index}
                data-selected-sprite-layer={selectedSpriteStageMetadata.layer}
                data-selected-sprite-x={selectedSpriteStageMetadata.x}
                data-selected-sprite-y={selectedSpriteStageMetadata.y}
                tabIndex={0}
                onContextMenu={handleComposeContextMenu}
                onKeyDown={handleStageKeyDown}
                activeDrop={isStageDropActive}
                stageWidthPx={stageWidth * stageScale}
                stageHeightPx={stageHeight * stageScale}
                stageScale={stageScale}
              >
                <ComposeCanvasMount onCanvasRef={handleComposeCanvasRef} />

                {pipe(
                  libraryDragState,
                  O.match(
                    () => <></>,
                    (drag) => {
                      if (drag.isOverStage === false) {
                        return <></>;
                      }

                      return (
                        <StageDragPreview
                          key={`library-preview-${drag.spriteIndex}`}
                          previewLeft={drag.stageX * stageScale}
                          previewTop={drag.stageY * stageScale}
                        >
                          {renderSpritePixels(drag.spriteIndex, stageScale)}
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
        libraryDragState,
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
                {renderSpritePixels(drag.spriteIndex, LIBRARY_PREVIEW_SCALE)}
              </Stack>
            </FloatingLibraryPreview>
          ),
        ),
      )}
    </>
  );
};
