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
import { createPortal } from "react-dom";
import { type SpriteTile } from "../../../application/state/projectStore";
import { nesIndexToCssHex } from "../../../domain/nes/palette";
import { renderSpriteTileToHexArray } from "../../../domain/nes/rendering";
import {
  Badge,
  FieldLabel,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  ToolButton,
} from "../../App.styles";
import { ProjectActions } from "../common/ProjectActions";
import { CharacterModeComposeSidebar } from "./CharacterModeComposeSidebar";
import { CharacterModeDecomposeSidebar } from "./CharacterModeDecomposeSidebar";
import {
  CharacterStageViewport,
  CharacterWorkspaceGrid,
  CharacterWorkspaceRoot,
  ComposeCanvasMount,
  DecompositionCanvasElement,
  DecompositionToolCard,
  DecompositionToolGrid,
  EmptyTilePreview,
  FloatingLibraryPreview,
  PaletteControlContainer,
  PaletteControlRow,
  PaletteSlotGrid,
  PixelPreviewCell,
  PortalOverlay,
  PositionedActionMenu,
  PositionedActionMenuButton,
  PreviewControlsRow,
  PreviewHeaderLayout,
  RegionOverlayButton,
  StageDragPreview,
  StageEditorCard,
  StageInputContainer,
  StageSurface,
  ViewportCenterWrap,
} from "./CharacterModeLayoutPrimitives";
import { CharacterModeSetHeader } from "./CharacterModeSetHeader";
import {
  getIssueLabel,
  getRegionStatusLabel,
} from "./decomposition/decompositionRegionRules";
import {
  CHARACTER_MODE_STAGE_LIMITS,
  DECOMPOSITION_COLOR_SLOTS,
  INSPECTOR_PREVIEW_SCALE,
  LIBRARY_PREVIEW_SCALE,
  STAGE_CONTEXT_MENU_HEIGHT,
  STAGE_CONTEXT_MENU_WIDTH,
  useCharacterModeController,
} from "./hooks/useCharacterModeController";

const PREVIEW_TRANSPARENT_HEX = "#00000000";

/**
 * キャラクター編集モード全体の UI を描画します。
 * セット管理、合成、分解、ステージ操作を一つの画面にまとめ、コントローラが返す状態を組み立てます。
 */
export const CharacterMode: React.FC = () => {
  const {
    activeSet,
    activeSetId,
    activeSetName,
    activeSetSpriteCount,
    characterSets,
    decompositionAnalysis,
    decompositionCanvasCursor,
    decompositionColorIndex,
    decompositionInvalidRegionCount,
    decompositionPaletteIndex,
    decompositionRegions,
    decompositionTool,
    decompositionValidRegionCount,
    editorMode,
    handleApplyDecomposition,
    handleComposeCanvasRef,
    handleComposeContextMenu,
    handleCreateSet,
    handleDecompositionCanvasPointerDown,
    handleDecompositionCanvasRef,
    handleDecompositionColorSlotSelect,
    handleDecompositionPaletteSelect,
    handleDecompositionRegionPointerDown,
    handleDecompositionToolChange,
    handleDeleteSet,
    handleEditorModeChange,
    handleLibraryPointerDown,
    handleNewNameChange,
    handleProjectSpriteSizeChange,
    handleRemoveSelectedRegion,
    handleSelectRegion,
    handleSelectSet,
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
    handleWorkspacePointerDownCapture,
    handleWorkspacePointerEnd,
    handleWorkspacePointerMove,
    handleZoomIn,
    handleZoomOut,
    isSpriteDragging,
    isStageDropActive,
    libraryDragState,
    newName,
    projectActions,
    projectSpriteSize,
    projectSpriteSizeLocked,
    getSpriteTile,
    selectedCharacterId,
    selectedRegionAnalysis,
    selectedRegionId,
    selectedSpriteStageMetadata,
    spriteContextMenu,
    closeSpriteContextMenu,
    spritePalettes,
    sprites,
    focusStageElement,
    handleDeleteContextMenuSprite,
    handleShiftContextMenuSpriteLayer,
    stageHeight,
    stageScale,
    stageWidth,
    stageZoomLevel,
    viewportPanState,
  } = useCharacterModeController();

  const renderTilePixels = (
    tileOption: O.Option<SpriteTile>,
    scale: number,
    keyPrefix: string,
  ): React.ReactElement => {
    if (O.isNone(tileOption)) {
      return (
        <EmptyTilePreview previewWidth={8 * scale} previewHeight={16 * scale} />
      );
    }

    const tile = tileOption.value;
    const hexPixels = renderSpriteTileToHexArray(tile, spritePalettes);

    return (
      <Stack
        spacing={0}
        width={tile.width * scale}
        height={tile.height * scale}
        alignItems="stretch"
      >
        {tile.pixels.map((pixelRow, rowIndex) => (
          <Stack
            key={`pixel-row-${keyPrefix}-${rowIndex}`}
            direction="row"
            spacing={0}
            alignItems="stretch"
          >
            {pixelRow.map((colorIndex, columnIndex) => {
              const hexRowOption = O.fromNullable(hexPixels[rowIndex]);
              const hexOption = pipe(
                hexRowOption,
                O.chain((row) => O.fromNullable(row[columnIndex])),
              );
              const colorHex = pipe(
                hexOption,
                O.getOrElse(() => PREVIEW_TRANSPARENT_HEX),
              );
              const isTransparent = colorIndex === 0;

              return (
                <PixelPreviewCell
                  key={`pixel-${keyPrefix}-${rowIndex}-${columnIndex}`}
                  pixelSize={scale}
                  colorHex={isTransparent ? "transparent" : colorHex}
                />
              );
            })}
          </Stack>
        ))}
      </Stack>
    );
  };

  const renderSpritePixels = (spriteIndex: number, scale: number) =>
    renderTilePixels(
      getSpriteTile(spriteIndex),
      scale,
      `sprite-${spriteIndex}`,
    );

  const spriteContextMenuPortal =
    typeof document === "undefined"
      ? O.none
      : pipe(
          spriteContextMenu,
          O.map((menuState) => {
            const viewportWidth =
              typeof window === "undefined"
                ? menuState.clientX
                : window.innerWidth;
            const viewportHeight =
              typeof window === "undefined"
                ? menuState.clientY
                : window.innerHeight;
            const left = Math.max(
              12,
              Math.min(
                menuState.clientX,
                viewportWidth - STAGE_CONTEXT_MENU_WIDTH - 12,
              ),
            );
            const top = Math.max(
              12,
              Math.min(
                menuState.clientY,
                viewportHeight - STAGE_CONTEXT_MENU_HEIGHT - 12,
              ),
            );
            const menuActions: ReadonlyArray<{
              label: string;
              onSelect: () => void;
              tone?: "default" | "danger";
            }> = [
              {
                label: "レイヤーを上げる",
                onSelect: () =>
                  handleShiftContextMenuSpriteLayer(
                    menuState.spriteEditorIndex,
                    1,
                  ),
              },
              {
                label: "レイヤーを下げる",
                onSelect: () =>
                  handleShiftContextMenuSpriteLayer(
                    menuState.spriteEditorIndex,
                    -1,
                  ),
              },
              {
                label: "削除",
                onSelect: () =>
                  handleDeleteContextMenuSprite(menuState.spriteEditorIndex),
                tone: "danger",
              },
            ];

            return createPortal(
              <PortalOverlay
                data-sprite-context-menu-root="true"
                onContextMenu={handleComposeContextMenu}
                onPointerDown={closeSpriteContextMenu}
              >
                <PositionedActionMenu
                  role="menu"
                  aria-label="スプライトメニュー"
                  onPointerDown={(event) => event.stopPropagation()}
                  menuLeft={left}
                  menuTop={top}
                  menuWidth={STAGE_CONTEXT_MENU_WIDTH}
                  ready={true}
                >
                  {menuActions.map((action) => (
                    <PositionedActionMenuButton
                      key={action.label}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        action.onSelect();
                        focusStageElement();
                      }}
                      danger={action.tone === "danger"}
                    >
                      {action.label}
                    </PositionedActionMenuButton>
                  ))}
                </PositionedActionMenu>
              </PortalOverlay>,
              document.body,
            );
          }),
        );

  return (
    <Panel flex={1} minHeight={0} height="100%">
      <PanelHeader>
        <PanelHeaderRow>
          <PanelTitle>キャラクター編集</PanelTitle>
          <ProjectActions actions={projectActions} />
        </PanelHeaderRow>
      </PanelHeader>

      <CharacterWorkspaceRoot
        flex={1}
        onPointerDownCapture={handleWorkspacePointerDownCapture}
        onPointerMoveCapture={handleWorkspacePointerMove}
        onPointerUpCapture={handleWorkspacePointerEnd}
        onPointerCancelCapture={handleWorkspacePointerEnd}
      >
        <CharacterModeSetHeader
          newName={newName}
          selectedCharacterId={selectedCharacterId}
          characterSets={characterSets}
          activeSetAvailable={O.isSome(activeSet)}
          activeSetId={activeSetId}
          onNewNameChange={handleNewNameChange}
          onCreateSet={handleCreateSet}
          onSelectSet={handleSelectSet}
          onDeleteSet={handleDeleteSet}
        />

        <CharacterWorkspaceGrid
          aria-label="キャラクター編集ワークスペース"
          decompose={editorMode === "decompose"}
          flex={1}
        >
          <CharacterModeComposeSidebar
            activeSetAvailable={O.isSome(activeSet)}
            activeSetName={activeSetName}
            editorMode={editorMode}
            projectSpriteSize={projectSpriteSize}
            projectSpriteSizeLocked={projectSpriteSizeLocked}
            sprites={sprites}
            isLibraryDraggable={editorMode === "compose" && O.isSome(activeSet)}
            isSpriteDragging={isSpriteDragging}
            onSetNameChange={handleSetNameChange}
            onEditorModeChange={handleEditorModeChange}
            onProjectSpriteSizeChange={handleProjectSpriteSizeChange}
            onLibraryPointerDown={handleLibraryPointerDown}
            renderSpritePixels={renderSpritePixels}
            libraryPreviewScale={LIBRARY_PREVIEW_SCALE}
          />

          <StageEditorCard decompose={editorMode === "decompose"} flex={1}>
            <PreviewHeaderLayout>
              <PanelHeaderRow>
                <FieldLabel>
                  {editorMode === "compose"
                    ? "プレビューキャンバス"
                    : "分解キャンバス"}
                </FieldLabel>
                <Badge tone="accent">
                  {editorMode === "compose"
                    ? `${activeSetSpriteCount} items`
                    : `${decompositionRegions.length} regions`}
                </Badge>
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
                    onChange={(event) =>
                      handleStageWidthChange(event.target.value)
                    }
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
                    onChange={(event) =>
                      handleStageHeightChange(event.target.value)
                    }
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

            {editorMode === "decompose" && (
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
                          if (
                            typeof value !== "string" &&
                            typeof value !== "number"
                          ) {
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
                            <Typography variant="caption">
                              {`slot${slotIndex}`}
                            </Typography>
                          </Stack>
                        );
                      })}
                    </PaletteSlotGrid>
                  </PaletteControlRow>
                </DecompositionToolGrid>
              </DecompositionToolCard>
            )}

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
                  tabIndex={editorMode === "compose" ? 0 : -1}
                  onContextMenu={handleComposeContextMenu}
                  onKeyDown={handleStageKeyDown}
                  activeDrop={isStageDropActive}
                  stageWidthPx={stageWidth * stageScale}
                  stageHeightPx={stageHeight * stageScale}
                  stageScale={stageScale}
                >
                  <ComposeCanvasMount onCanvasRef={handleComposeCanvasRef} />

                  {editorMode === "compose" &&
                    pipe(
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

                  {editorMode === "decompose" && (
                    <>
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

                      {decompositionAnalysis.regions.map(
                        (regionAnalysis, regionIndex) => {
                          const isSelected = pipe(
                            selectedRegionId,
                            O.match(
                              () => false,
                              (regionId) =>
                                regionId === regionAnalysis.region.id,
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
                              onClick={() =>
                                handleSelectRegion(regionAnalysis.region.id)
                              }
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
                        },
                      )}
                    </>
                  )}
                </StageSurface>
              </ViewportCenterWrap>
            </CharacterStageViewport>
          </StageEditorCard>

          {editorMode === "decompose" && (
            <CharacterModeDecomposeSidebar
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
          )}
        </CharacterWorkspaceGrid>

        {editorMode === "compose" &&
          pipe(
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
                    {renderSpritePixels(
                      drag.spriteIndex,
                      LIBRARY_PREVIEW_SCALE,
                    )}
                  </Stack>
                </FloatingLibraryPreview>
              ),
            ),
          )}

        {pipe(
          spriteContextMenuPortal,
          O.match(
            () => <></>,
            (menu) => menu,
          ),
        )}
      </CharacterWorkspaceRoot>
    </Panel>
  );
};
