import OutlinedInput from "@mui/material/OutlinedInput";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  Badge,
  FieldLabel,
  PanelHeaderRow,
  ToolButton,
} from "../../../../../App.styles";
import {
  useCharacterModeComposeCanvas,
  useCharacterModeLibraryDragPreview,
  useCharacterModeStageDisplay,
  useCharacterModeStageSize,
  useCharacterModeStageViewport,
  useCharacterModeStageZoom,
  useCharacterModeViewportPan,
} from "../../core/CharacterModeStateProvider";
import { CHARACTER_MODE_STAGE_LIMITS } from "../../../logic/characterModeConstants";
import { CharacterModeTilePreview } from "../../preview/CharacterModeTilePreview";
import {
  CharacterStageViewport,
  ComposeCanvasMount,
  PreviewControlsRow,
  PreviewHeaderLayout,
  StageDragPreview,
  StageEditorCard,
  StageInputContainer,
  StageSurface,
  ViewportCenterWrap,
} from "../../primitives/CharacterModePrimitives";

/**
 * 合成モードのプレビューキャンバス全体を描画します。
 * ヘッダー操作、ズーム、ビューポート、ステージ上ドラッグプレビューをまとめて扱います。
 */
export const CharacterModeComposePreviewCanvas: React.FC = () => {
  const stageDisplay = useCharacterModeStageDisplay();
  const stageSize = useCharacterModeStageSize();
  const stageZoom = useCharacterModeStageZoom();
  const viewport = useCharacterModeStageViewport();
  const viewportPan = useCharacterModeViewportPan();
  const composeCanvas = useCharacterModeComposeCanvas();
  const dragPreview = useCharacterModeLibraryDragPreview();

  return (
    <StageEditorCard flex={1} minWidth={0}>
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
            <ComposeCanvasMount
              onCanvasRef={composeCanvas.handleComposeCanvasRef}
            />

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
  );
};
