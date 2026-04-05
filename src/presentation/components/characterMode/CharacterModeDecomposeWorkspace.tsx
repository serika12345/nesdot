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
import { type SpriteTile } from "../../../application/state/projectStore";
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
  getIssueLabel,
  getRegionStatusLabel,
} from "./decomposition/decompositionRegionRules";
import {
  CHARACTER_MODE_STAGE_LIMITS,
  DECOMPOSITION_COLOR_SLOTS,
  INSPECTOR_PREVIEW_SCALE,
  LIBRARY_PREVIEW_SCALE,
  type CharacterModeController,
} from "./hooks/useCharacterModeController";

interface CharacterModeDecomposeWorkspaceProps {
  controller: CharacterModeController;
  renderSpritePixels: (spriteIndex: number, scale: number) => React.ReactNode;
  renderTilePixels: (
    tileOption: O.Option<SpriteTile>,
    pixelSize: number,
    keyPrefix: string,
  ) => React.ReactElement;
}

/**
 * キャラクター分解モードのワークスペースを描画します。
 * 左サイドバー、分解キャンバス、右インスペクタを分解専用の責務としてまとめます。
 */
export const CharacterModeDecomposeWorkspace: React.FC<
  CharacterModeDecomposeWorkspaceProps
> = ({ controller, renderSpritePixels, renderTilePixels }) => {
  const {
    activeSet,
    activeSetName,
    activeSetSpriteCount,
    decompositionAnalysis,
    decompositionCanvasCursor,
    decompositionColorIndex,
    decompositionInvalidRegionCount,
    decompositionPaletteIndex,
    decompositionRegions,
    decompositionTool,
    decompositionValidRegionCount,
    handleApplyDecomposition,
    handleDecompositionCanvasPointerDown,
    handleDecompositionCanvasRef,
    handleDecompositionColorSlotSelect,
    handleDecompositionPaletteSelect,
    handleDecompositionRegionPointerDown,
    handleDecompositionToolChange,
    handleEditorModeChange,
    handleLibraryPointerDown,
    handleProjectSpriteSizeChange,
    handleRemoveSelectedRegion,
    handleSelectRegion,
    handleSetNameChange,
    handleStageHeightChange,
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
    projectSpriteSize,
    projectSpriteSizeLocked,
    selectedRegionAnalysis,
    selectedRegionId,
    selectedSpriteStageMetadata,
    spritePalettes,
    sprites,
    stageHeight,
    stageScale,
    stageWidth,
    stageZoomLevel,
    viewportPanState,
  } = controller;

  return (
    <CharacterDecomposeWorkspaceGrid
      aria-label="キャラクター編集ワークスペース"
      flex={1}
    >
      <CharacterModeSidebar
        activeSetAvailable={O.isSome(activeSet)}
        activeSetName={activeSetName}
        activeMode="decompose"
        projectSpriteSize={projectSpriteSize}
        projectSpriteSizeLocked={projectSpriteSizeLocked}
        sprites={sprites}
        isLibraryDraggable={false}
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
            <FieldLabel>分解キャンバス</FieldLabel>
            <Badge tone="accent">{`${decompositionRegions.length} regions`}</Badge>
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

        <DecompositionToolCard>
          <PanelHeaderRow>
            <FieldLabel>分解ツール</FieldLabel>
            <Badge tone="neutral">
              {projectSpriteSize === 8 ? "8×8" : "8×16"}
            </Badge>
          </PanelHeaderRow>

          <DecompositionToolGrid>
            <ToolButton
              type="button"
              aria-label="分解ツール ペン"
              active={decompositionTool === "pen"}
              onClick={() => handleDecompositionToolChange("pen")}
            >
              ペン
            </ToolButton>
            <ToolButton
              type="button"
              aria-label="分解ツール 消しゴム"
              active={decompositionTool === "eraser"}
              onClick={() => handleDecompositionToolChange("eraser")}
            >
              消しゴム
            </ToolButton>
            <ToolButton
              type="button"
              aria-label="分解ツール 切り取り"
              active={decompositionTool === "region"}
              onClick={() => handleDecompositionToolChange("region")}
            >
              切り取り
            </ToolButton>
            <PaletteControlRow>
              <PaletteControlContainer>
                <Select
                  variant="outlined"
                  value={decompositionPaletteIndex}
                  inputProps={{
                    "aria-label": "分解描画パレット",
                  }}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (typeof value !== "string" && typeof value !== "number") {
                      return;
                    }

                    handleDecompositionPaletteSelect(value);
                  }}
                >
                  {spritePalettes.map((_, paletteIndex) => (
                    <MenuItem key={paletteIndex} value={paletteIndex}>
                      パレット {paletteIndex}
                    </MenuItem>
                  ))}
                </Select>
              </PaletteControlContainer>

              <PaletteSlotGrid>
                {DECOMPOSITION_COLOR_SLOTS.map((slotIndex) => {
                  const tone =
                    decompositionColorIndex === slotIndex &&
                    decompositionTool !== "eraser";
                  const colorHex = nesIndexToCssHex(
                    spritePalettes[decompositionPaletteIndex][slotIndex],
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
                          handleDecompositionColorSlotSelect(slotIndex)
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
              tabIndex={-1}
              activeDrop={isStageDropActive}
              stageWidthPx={stageWidth * stageScale}
              stageHeightPx={stageHeight * stageScale}
              stageScale={stageScale}
            >
              <DecompositionCanvasElement
                ref={handleDecompositionCanvasRef}
                aria-label="分解描画キャンバス"
                data-stage-width={stageWidth}
                data-stage-height={stageHeight}
                width={stageWidth * stageScale}
                height={stageHeight * stageScale}
                onPointerDown={handleDecompositionCanvasPointerDown}
                cursorStyle={decompositionCanvasCursor}
              />

              {decompositionAnalysis.regions.map((regionAnalysis, regionIndex) => {
                const isSelected = pipe(
                  selectedRegionId,
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
                      handleDecompositionRegionPointerDown(
                        event,
                        regionAnalysis.region,
                      )
                    }
                    onClick={() => handleSelectRegion(regionAnalysis.region.id)}
                    selectedState={isSelected}
                    issueState={hasIssues}
                    regionLeft={regionAnalysis.region.x * stageScale}
                    regionTop={regionAnalysis.region.y * stageScale}
                    regionHeightPx={projectSpriteSize * stageScale}
                    regionScale={stageScale}
                    toolMode={decompositionTool}
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
              })}
            </StageSurface>
          </ViewportCenterWrap>
        </CharacterStageViewport>
      </StageEditorCard>

      <CharacterModeDecompositionInspector
        selectedRegionId={selectedRegionId}
        selectedRegionAnalysis={selectedRegionAnalysis}
        decompositionAnalysis={decompositionAnalysis}
        decompositionRegionsCount={decompositionRegions.length}
        decompositionValidRegionCount={decompositionValidRegionCount}
        decompositionInvalidRegionCount={decompositionInvalidRegionCount}
        activeSetAvailable={O.isSome(activeSet)}
        onRemoveSelectedRegion={handleRemoveSelectedRegion}
        onApplyDecomposition={handleApplyDecomposition}
        onSelectRegion={handleSelectRegion}
        renderTilePixels={renderTilePixels}
        inspectorPreviewScale={INSPECTOR_PREVIEW_SCALE}
        getRegionStatusLabel={getRegionStatusLabel}
        getIssueLabel={getIssueLabel}
      />
    </CharacterDecomposeWorkspaceGrid>
  );
};
