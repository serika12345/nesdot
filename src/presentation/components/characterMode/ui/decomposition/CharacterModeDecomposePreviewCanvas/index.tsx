import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
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
  useCharacterModeDecompositionCanvas,
  useCharacterModeDecompositionRegions,
  useCharacterModeDecompositionTool,
  useCharacterModeStageDisplay,
  useCharacterModeStageSize,
  useCharacterModeStageViewport,
  useCharacterModeStageZoom,
  useCharacterModeViewportPan,
} from "../../core/CharacterModeStateProvider";
import { CHARACTER_MODE_STAGE_LIMITS } from "../../../logic/characterModeConstants";
import {
  CharacterStageViewport,
  DecompositionCanvasElement,
  PreviewControlsRow,
  PreviewHeaderLayout,
  RegionOverlayButton,
  StageEditorCard,
  StageInputContainer,
  StageSurface,
  ViewportCenterWrap,
} from "../../primitives/CharacterModePrimitives";
import { CharacterModeDecompositionToolOverlay } from "../CharacterModeDecompositionToolOverlay";
import { getRegionStatusLabel } from "../../../logic/decomposition/decompositionRegionRules";

/**
 * 分解モードのプレビューキャンバス全体を描画します。
 * ヘッダー操作、ズーム、ビューポート、切り取り領域オーバーレイをまとめて扱います。
 */
export const CharacterModeDecomposePreviewCanvas: React.FC = () => {
  const stageDisplay = useCharacterModeStageDisplay();
  const stageSize = useCharacterModeStageSize();
  const stageZoom = useCharacterModeStageZoom();
  const viewport = useCharacterModeStageViewport();
  const viewportPan = useCharacterModeViewportPan();
  const decompositionTool = useCharacterModeDecompositionTool();
  const decompositionCanvas = useCharacterModeDecompositionCanvas();
  const decompositionRegions = useCharacterModeDecompositionRegions();

  return (
    <StageEditorCard flex={1} minWidth={0}>
      <PreviewHeaderLayout>
        <PanelHeaderRow>
          <FieldLabel>分解キャンバス</FieldLabel>
          <Badge tone="accent">
            {`${decompositionRegions.decompositionRegions.length} regions`}
          </Badge>
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
        <CharacterModeDecompositionToolOverlay />

        <ViewportCenterWrap>
          <StageSurface
            ref={decompositionCanvas.handleStageRef}
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
            tabIndex={-1}
            activeDrop={stageDisplay.isStageDropActive}
            stageWidthPx={stageSize.stageWidth * stageSize.stageScale}
            stageHeightPx={stageSize.stageHeight * stageSize.stageScale}
            stageScale={stageSize.stageScale}
          >
            <DecompositionCanvasElement
              ref={decompositionCanvas.handleDecompositionCanvasRef}
              aria-label="分解描画キャンバス"
              data-stage-width={stageSize.stageWidth}
              data-stage-height={stageSize.stageHeight}
              width={stageSize.stageWidth}
              height={stageSize.stageHeight}
              onPointerDown={
                decompositionCanvas.handleDecompositionCanvasPointerDown
              }
              cursorStyle={decompositionCanvas.decompositionCanvasCursor}
            />

            {decompositionRegions.decompositionAnalysis.regions.map(
              (regionAnalysis, regionIndex) => {
                const isSelected = pipe(
                  decompositionRegions.selectedRegionId,
                  O.match(
                    () => false,
                    (regionId) => regionId === regionAnalysis.region.id,
                  ),
                );
                const hasIssues = regionAnalysis.issues.length > 0;

                return (
                  <RegionOverlayButton
                    key={regionAnalysis.region.id}
                    type="button"
                    aria-label={`切り取り領域 ${regionIndex}`}
                    onPointerDown={(event) =>
                      decompositionRegions.handleDecompositionRegionPointerDown(
                        event,
                        regionAnalysis.region,
                      )
                    }
                    onClick={() =>
                      decompositionRegions.handleSelectRegion(
                        regionAnalysis.region.id,
                      )
                    }
                    onContextMenu={(event) =>
                      decompositionRegions.handleDecompositionRegionContextMenu(
                        event,
                        regionAnalysis.region,
                      )
                    }
                    selectedState={isSelected}
                    issueState={hasIssues}
                    regionLeft={regionAnalysis.region.x * stageSize.stageScale}
                    regionTop={regionAnalysis.region.y * stageSize.stageScale}
                    regionHeightPx={
                      decompositionTool.projectSpriteSize * stageSize.stageScale
                    }
                    regionScale={stageSize.stageScale}
                    toolMode={decompositionTool.decompositionTool}
                  >
                    <Stack
                      height="100%"
                      width="100%"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      spacing={0}
                    >
                      <Badge tone={hasIssues ? "danger" : "accent"}>
                        {`#${regionIndex}`}
                      </Badge>
                      <Badge tone={hasIssues ? "danger" : "neutral"}>
                        {getRegionStatusLabel(regionAnalysis)}
                      </Badge>
                    </Stack>
                  </RegionOverlayButton>
                );
              },
            )}
          </StageSurface>
        </ViewportCenterWrap>
      </CharacterStageViewport>
    </StageEditorCard>
  );
};
