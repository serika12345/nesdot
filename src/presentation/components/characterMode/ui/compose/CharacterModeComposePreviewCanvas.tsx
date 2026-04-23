import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { Badge, Button, TextField } from "@radix-ui/themes";
import React from "react";
import {
  useCharacterModeLibraryDragPreview,
  useCharacterModeStageDisplay,
  useCharacterModeStageSize,
  useCharacterModeStageZoom,
  useCharacterModeViewportPan,
} from "../../logic/characterModeEditorState";
import { CHARACTER_MODE_STAGE_LIMITS } from "../../logic/characterModeConstants";
import { CharacterModeTilePreview } from "../preview/CharacterModeTilePreview";
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
} from "../primitives/CharacterModePrimitives";
import styles from "./CharacterModeCanvasPanels.module.css";

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
    <StageEditorCard>
      <PreviewHeaderLayout>
        <div className={styles.headerRow}>
          <span className={styles.title}>プレビューキャンバス</span>
          <Badge color="teal" size="2" variant="surface">
            {`${stageDisplay.activeSetSpriteCount} items`}
          </Badge>
        </div>

        <PreviewControlsRow>
          <StageInputContainer>
            <TextField.Root
              type="number"
              value={stageSize.stageWidth}
              min={CHARACTER_MODE_STAGE_LIMITS.minWidth}
              max={CHARACTER_MODE_STAGE_LIMITS.maxWidth}
              step={8}
              aria-label="プレビューキャンバス幅"
              style={{ width: "100%" }}
              onChange={(event) =>
                stageSize.handleStageWidthChange(event.target.value)
              }
            />
          </StageInputContainer>
          <StageInputContainer>
            <TextField.Root
              type="number"
              value={stageSize.stageHeight}
              min={CHARACTER_MODE_STAGE_LIMITS.minHeight}
              max={CHARACTER_MODE_STAGE_LIMITS.maxHeight}
              step={8}
              aria-label="プレビューキャンバス高さ"
              style={{ width: "100%" }}
              onChange={(event) =>
                stageSize.handleStageHeightChange(event.target.value)
              }
            />
          </StageInputContainer>
          <Badge color="gray" size="2" variant="surface">
            {`${stageZoom.stageZoomLevel}x`}
          </Badge>
          <Button
            color="gray"
            size="1"
            variant="outline"
            onClick={stageZoom.handleZoomOut}
          >
            -
          </Button>
          <Button
            color="gray"
            size="1"
            variant="outline"
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
                        spritePalettes={dragPreview.spritePalettes}
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
