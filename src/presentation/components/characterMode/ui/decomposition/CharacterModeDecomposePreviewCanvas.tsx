import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import {
  type CharacterDecompositionAnalysis,
  type CharacterDecompositionRegionAnalysis,
} from "../../../../../domain/characters/characterDecomposition";
import { CHARACTER_MODE_STAGE_LIMITS } from "../../logic/characterModeConstants";
import {
  useCharacterModeDecompositionCanvasState,
  useCharacterModeDecompositionRegions,
  useCharacterModeDecompositionTool,
} from "../../logic/characterModeDecompositionState";
import { getRegionStatusLabel } from "../../logic/decomposition/decompositionRegionRules";
import {
  useCharacterModeStageDisplay,
  useCharacterModeStageSize,
  useCharacterModeStageZoom,
  useCharacterModeViewportPan,
} from "../../logic/characterModeEditorState";
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
} from "../primitives/CharacterModePrimitives";
import { CharacterModeDecompositionToolOverlay } from "./CharacterModeDecompositionToolOverlay";

interface CharacterModeDecompositionCanvasHandlers {
  handleDecompositionCanvasPointerDown: React.PointerEventHandler<HTMLCanvasElement>;
  handleDecompositionCanvasRef: (element: HTMLCanvasElement | null) => void;
  handleDecompositionRegionContextMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    region: CharacterDecompositionAnalysis["regions"][number]["region"],
  ) => void;
  handleDecompositionRegionPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    region: CharacterDecompositionAnalysis["regions"][number]["region"],
  ) => void;
}

interface CharacterModeDecompositionStageHandlers {
  handleStageRef: (element: HTMLDivElement | null) => void;
  handleViewportPointerDown: React.PointerEventHandler<HTMLDivElement>;
  handleViewportPointerEnd: React.PointerEventHandler<HTMLDivElement>;
  handleViewportPointerMove: React.PointerEventHandler<HTMLDivElement>;
  handleViewportRef: (element: HTMLDivElement | null) => void;
  handleViewportWheel: React.WheelEventHandler<HTMLDivElement>;
}

interface CharacterModeDecomposePreviewCanvasProps {
  decompositionHandlers: CharacterModeDecompositionCanvasHandlers;
  stageHandlers: CharacterModeDecompositionStageHandlers;
}

/**
 * 分解モードのプレビューキャンバス全体を描画します。
 * ヘッダー操作、ズーム、ビューポート、切り取り領域オーバーレイをまとめて扱います。
 */
export const CharacterModeDecomposePreviewCanvas: React.FC<
  CharacterModeDecomposePreviewCanvasProps
> = ({ decompositionHandlers, stageHandlers }) => {
  const stageDisplay = useCharacterModeStageDisplay();
  const stageSize = useCharacterModeStageSize();
  const stageZoom = useCharacterModeStageZoom();
  const viewportPan = useCharacterModeViewportPan();
  const decompositionTool = useCharacterModeDecompositionTool();
  const decompositionCanvas = useCharacterModeDecompositionCanvasState();
  const decompositionRegions = useCharacterModeDecompositionRegions();
  const decompositionAnalysis: CharacterDecompositionAnalysis =
    decompositionRegions.decompositionAnalysis;

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
          <Typography variant="body2">分解キャンバス</Typography>
          <Chip
            size="small"
            color="primary"
            label={`${decompositionRegions.decompositionRegions.length} regions`}
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
        <CharacterModeDecompositionToolOverlay />

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
            tabIndex={-1}
            activeDrop={stageDisplay.isStageDropActive}
            stageWidthPx={stageSize.stageWidth * stageSize.stageScale}
            stageHeightPx={stageSize.stageHeight * stageSize.stageScale}
            stageScale={stageSize.stageScale}
          >
            <DecompositionCanvasElement
              ref={decompositionHandlers.handleDecompositionCanvasRef}
              aria-label="分解描画キャンバス"
              data-stage-width={stageSize.stageWidth}
              data-stage-height={stageSize.stageHeight}
              width={stageSize.stageWidth}
              height={stageSize.stageHeight}
              onPointerDown={
                decompositionHandlers.handleDecompositionCanvasPointerDown
              }
              cursorStyle={decompositionCanvas.decompositionCanvasCursor}
            />

            {decompositionAnalysis.regions.map(
              (
                regionAnalysis: CharacterDecompositionRegionAnalysis,
                regionIndex: number,
              ) => {
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
                      decompositionHandlers.handleDecompositionRegionPointerDown(
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
                      decompositionHandlers.handleDecompositionRegionContextMenu(
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
                      <Chip
                        size="small"
                        color={hasIssues ? "error" : "primary"}
                        label={`#${regionIndex}`}
                      />
                      <Chip
                        size="small"
                        color={hasIssues ? "error" : "default"}
                        label={getRegionStatusLabel(regionAnalysis)}
                      />
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
