import { Badge, Button, TextField } from "@radix-ui/themes";
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
import {
  useCharacterModeStageDisplay,
  useCharacterModeStageSize,
  useCharacterModeStageZoom,
  useCharacterModeViewportPan,
} from "../../logic/characterModeEditorState";
import { getRegionStatusLabel } from "../../logic/decomposition/decompositionRegionRules";
import styles from "../compose/CharacterModeCanvasPanels.module.css";
import {
  CharacterStageStatus,
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
    <StageEditorCard>
      <PreviewHeaderLayout>
        <div className={styles.headerRow}>
          <span className={styles.title}>分解キャンバス</span>
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
        <CharacterModeDecompositionToolOverlay />

        <ViewportCenterWrap>
          <StageSurface
            ref={stageHandlers.handleStageRef}
            aria-label="キャラクターステージ"
            tabIndex={-1}
            activeDrop={stageDisplay.isStageDropActive}
            stageWidthPx={stageSize.stageWidth * stageSize.stageScale}
            stageHeightPx={stageSize.stageHeight * stageSize.stageScale}
            stageScale={stageSize.stageScale}
          >
            <DecompositionCanvasElement
              ref={decompositionHandlers.handleDecompositionCanvasRef}
              aria-label="分解描画キャンバス"
              width={stageSize.stageWidth}
              height={stageSize.stageHeight}
              onPointerDown={
                decompositionHandlers.handleDecompositionCanvasPointerDown
              }
              cursorStyle={decompositionCanvas.decompositionCanvasCursor}
            />
            <CharacterStageStatus
              activeSetName={stageDisplay.activeSetName}
              selectedSprite={stageDisplay.selectedSpriteStageMetadata}
              spriteCount={stageDisplay.activeSetSpriteCount}
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
                    <div className={styles.regionLabels}>
                      <Badge
                        color={hasIssues === true ? "red" : "teal"}
                        size="2"
                        variant="surface"
                      >
                        {`#${regionIndex}`}
                      </Badge>
                      <Badge
                        color={hasIssues === true ? "red" : "gray"}
                        size="2"
                        variant="surface"
                      >
                        {getRegionStatusLabel(regionAnalysis)}
                      </Badge>
                    </div>
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
