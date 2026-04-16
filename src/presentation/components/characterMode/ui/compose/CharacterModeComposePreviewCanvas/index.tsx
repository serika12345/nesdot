import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  useCharacterModeLibraryDragPreview,
  useCharacterModeStageDisplay,
  useCharacterModeStageSize,
  useCharacterModeStageZoom,
  useCharacterModeViewportPan,
} from "../../../logic/characterModeEditorState";
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

interface CharacterModeComposeCanvasHandlers {
  handleComposeCanvasRef: (element: HTMLCanvasElement | null) => void;
  handleComposeContextMenu: React.MouseEventHandler<HTMLElement>;
  handleStageKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
}

interface CharacterModeComposeStageHandlers {
  handleStageRef: (element: HTMLDivElement | null) => void;
  handleViewportPointerDown: React.PointerEventHandler<HTMLDivElement>;
  handleViewportPointerEnd: React.PointerEventHandler<HTMLDivElement>;
  handleViewportPointerMove: React.PointerEventHandler<HTMLDivElement>;
  handleViewportRef: (element: HTMLDivElement | null) => void;
  handleViewportWheel: React.WheelEventHandler<HTMLDivElement>;
}

interface CharacterModeComposePreviewCanvasProps {
  composeHandlers: CharacterModeComposeCanvasHandlers;
  stageHandlers: CharacterModeComposeStageHandlers;
}

/**
 * 合成モードのプレビューキャンバス全体を描画します。
 * ヘッダー操作、ズーム、ビューポート、ステージ上ドラッグプレビューをまとめて扱います。
 */
export const CharacterModeComposePreviewCanvas: React.FC<
  CharacterModeComposePreviewCanvasProps
> = ({ composeHandlers, stageHandlers }) => {
  const stageDisplay = useCharacterModeStageDisplay();
  const stageSize = useCharacterModeStageSize();
  const stageZoom = useCharacterModeStageZoom();
  const viewportPan = useCharacterModeViewportPan();
  const dragPreview = useCharacterModeLibraryDragPreview();

  return (
    <StageEditorCard flex={1} minWidth={0}>
      <PreviewHeaderLayout>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1.5}
          useFlexGap
          flexWrap="wrap"
        >
          <Typography variant="body2">プレビューキャンバス</Typography>
          <Chip
            size="small"
            color="primary"
            label={`${stageDisplay.activeSetSpriteCount} items`}
          />
        </Stack>

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
          <Chip
            size="small"
            variant="outlined"
            label={`${stageZoom.stageZoomLevel}x`}
          />
          <Button
            type="button"
            size="small"
            variant="outlined"
            onClick={stageZoom.handleZoomOut}
          >
            -
          </Button>
          <Button
            type="button"
            size="small"
            variant="outlined"
            onClick={stageZoom.handleZoomIn}
          >
            +
          </Button>
        </PreviewControlsRow>
      </PreviewHeaderLayout>

      <CharacterStageViewport
        ref={stageHandlers.handleViewportRef}
        aria-label="プレビューキャンバスビュー"
        onWheel={stageHandlers.handleViewportWheel}
        onPointerDown={stageHandlers.handleViewportPointerDown}
        onPointerMove={stageHandlers.handleViewportPointerMove}
        onPointerUp={stageHandlers.handleViewportPointerEnd}
        onPointerCancel={stageHandlers.handleViewportPointerEnd}
        onMouseDown={(event) => {
          if (event.button === 1) {
            event.preventDefault();
          }
        }}
        dragging={O.isSome(viewportPan.viewportPanState)}
      >
        <ViewportCenterWrap>
          <StageSurface
            ref={stageHandlers.handleStageRef}
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
            onContextMenu={composeHandlers.handleComposeContextMenu}
            onKeyDown={composeHandlers.handleStageKeyDown}
            activeDrop={stageDisplay.isStageDropActive}
            stageWidthPx={stageSize.stageWidth * stageSize.stageScale}
            stageHeightPx={stageSize.stageHeight * stageSize.stageScale}
            stageScale={stageSize.stageScale}
          >
            <ComposeCanvasMount
              onCanvasRef={composeHandlers.handleComposeCanvasRef}
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
