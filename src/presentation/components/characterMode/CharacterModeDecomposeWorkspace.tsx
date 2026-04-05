import {
  ButtonBase,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { nesIndexToCssHex } from "../../../domain/nes/palette";
import { Badge, FieldLabel, PanelHeaderRow, ToolButton } from "../../App.styles";
import {
  CharacterDecomposeWorkspaceGrid,
  CharacterStageViewport,
  DecompositionCanvasElement,
  DecompositionToolCard,
  DecompositionToolGrid,
  PaletteControlContainer,
  PaletteControlRow,
  PaletteSlotGrid,
  RegionOverlayButton,
  StageEditorCard,
  StageInputContainer,
  StageSurface,
  ViewportCenterWrap,
  PreviewControlsRow,
  PreviewHeaderLayout,
} from "./CharacterModeLayoutPrimitives";
import { CharacterModeDecompositionInspector } from "./CharacterModeDecompositionInspector";
import { CharacterModeSidebar } from "./CharacterModeSidebar";
import {
  getRegionStatusLabel,
} from "./decomposition/decompositionRegionRules";
import {
  CHARACTER_MODE_STAGE_LIMITS,
  DECOMPOSITION_COLOR_SLOTS,
} from "./hooks/useCharacterModeState";
import {
  useCharacterModeDecompositionCanvas,
  useCharacterModeDecompositionPalette,
  useCharacterModeDecompositionRegions,
  useCharacterModeDecompositionTool,
  useCharacterModeStageDisplay,
  useCharacterModeStageSize,
  useCharacterModeStageViewport,
  useCharacterModeStageZoom,
  useCharacterModeViewportPan,
} from "./CharacterModeStateProvider";

/**
 * キャラクター分解モードのワークスペースを描画します。
 * 左サイドバー、分解キャンバス、右インスペクタを分解専用の責務としてまとめます。
 */
export const CharacterModeDecomposeWorkspace: React.FC = () => {
  const stageDisplay = useCharacterModeStageDisplay();
  const stageSize = useCharacterModeStageSize();
  const stageZoom = useCharacterModeStageZoom();
  const viewport = useCharacterModeStageViewport();
  const viewportPan = useCharacterModeViewportPan();
  const decompositionTool = useCharacterModeDecompositionTool();
  const decompositionPalette = useCharacterModeDecompositionPalette();
  const decompositionCanvas = useCharacterModeDecompositionCanvas();
  const decompositionRegions = useCharacterModeDecompositionRegions();

  return (
    <CharacterDecomposeWorkspaceGrid
      aria-label="キャラクター編集ワークスペース"
      flex={1}
    >
      <CharacterModeSidebar />

      <StageEditorCard flex={1}>
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

        <DecompositionToolCard>
          <PanelHeaderRow>
            <FieldLabel>分解ツール</FieldLabel>
            <Badge tone="neutral">
              {decompositionTool.projectSpriteSize === 8 ? "8×8" : "8×16"}
            </Badge>
          </PanelHeaderRow>

          <DecompositionToolGrid>
            <ToolButton
              type="button"
              aria-label="分解ツール ペン"
              active={decompositionTool.decompositionTool === "pen"}
              onClick={() =>
                decompositionTool.handleDecompositionToolChange("pen")
              }
            >
              ペン
            </ToolButton>
            <ToolButton
              type="button"
              aria-label="分解ツール 消しゴム"
              active={decompositionTool.decompositionTool === "eraser"}
              onClick={() =>
                decompositionTool.handleDecompositionToolChange("eraser")
              }
            >
              消しゴム
            </ToolButton>
            <ToolButton
              type="button"
              aria-label="分解ツール 切り取り"
              active={decompositionTool.decompositionTool === "region"}
              onClick={() =>
                decompositionTool.handleDecompositionToolChange("region")
              }
            >
              切り取り
            </ToolButton>
            <PaletteControlRow>
              <PaletteControlContainer>
                <Select
                  variant="outlined"
                  value={decompositionPalette.decompositionPaletteIndex}
                  inputProps={{
                    "aria-label": "分解描画パレット",
                  }}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (typeof value !== "string" && typeof value !== "number") {
                      return;
                    }

                    decompositionPalette.handleDecompositionPaletteSelect(value);
                  }}
                >
                  {decompositionPalette.spritePalettes.map((_, paletteIndex) => (
                    <MenuItem key={paletteIndex} value={paletteIndex}>
                      パレット {paletteIndex}
                    </MenuItem>
                  ))}
                </Select>
              </PaletteControlContainer>

              <PaletteSlotGrid>
                {DECOMPOSITION_COLOR_SLOTS.map((slotIndex) => {
                  const tone =
                    decompositionPalette.decompositionColorIndex === slotIndex &&
                    decompositionTool.decompositionTool !== "eraser";
                  const colorHex = nesIndexToCssHex(
                    decompositionPalette.spritePalettes[
                      decompositionPalette.decompositionPaletteIndex
                    ][slotIndex],
                  );

                  return (
                    <Stack
                      key={`decompose-slot-${slotIndex}`}
                      alignItems="center"
                      spacing="0.5rem"
                    >
                      <ButtonBase
                        type="button"
                        aria-label={`分解色スロット ${slotIndex}`}
                        style={{
                          width: "2.625rem",
                          height: "2.625rem",
                          borderRadius: "0.875rem",
                          border:
                            tone === true
                              ? "0.1875rem solid #0f766e"
                              : "0.0625rem solid rgba(148, 163, 184, 0.28)",
                          boxShadow:
                            tone === true
                              ? "0 0.75rem 1.5rem rgba(15, 118, 110, 0.16)"
                              : "0 0.5rem 1rem rgba(15, 23, 42, 0.06)",
                          backgroundColor: colorHex,
                        }}
                        onClick={() =>
                          decompositionPalette.handleDecompositionColorSlotSelect(
                            slotIndex,
                          )
                        }
                      />
                      <Typography variant="caption">{`slot${slotIndex}`}</Typography>
                    </Stack>
                  );
                })}
              </PaletteSlotGrid>
            </PaletteControlRow>
          </DecompositionToolGrid>
        </DecompositionToolCard>

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
                width={stageSize.stageWidth * stageSize.stageScale}
                height={stageSize.stageHeight * stageSize.stageScale}
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

      <CharacterModeDecompositionInspector />
    </CharacterDecomposeWorkspaceGrid>
  );
};
