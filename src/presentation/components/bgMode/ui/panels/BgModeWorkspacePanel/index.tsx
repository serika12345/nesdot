import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import React from "react";
import useExportImage from "../../../../../../infrastructure/browser/useExportImage";
import {
  CanvasViewport,
  CollapseToggle,
  Panel,
  PanelHeader,
  PanelTitle,
  ScrollArea,
  SplitLayout,
  ToolButton,
} from "../../../../../App.styles";
import {
  emptyFileMenuState,
  type FileMenuState,
} from "../../../../common/logic/state/fileMenuState";
import { BackgroundTilePreview } from "../../../../common/ui/preview/BackgroundTilePreview";
import { useBgModeWorkspaceEditingState } from "../../../logic/bgModeWorkspaceEditingState";
import { createBgModeWorkspaceProjectActions } from "../../../logic/bgModeWorkspaceProjectActions";
import { BgModeTileEditorCanvas } from "../../canvas/BgModeTileEditorCanvas";
import {
  canvasOverlayMenuProps,
  canvasOverlayRootProps,
  centeredCanvasWrapProps,
  chevronStyle,
  mockToolbarProps,
  overlayToggleButtonStyle,
  tileButtonLayoutProps,
  tileLibraryGridProps,
} from "./styles";

interface BgModeWorkspacePanelProps {
  onFileMenuStateChange: (fileMenuState: FileMenuState) => void;
}

type BgPaletteIndex = 0 | 1 | 2 | 3;
const BG_PALETTE_OPTIONS: ReadonlyArray<BgPaletteIndex> = [0, 1, 2, 3];

const formatTileNumber = (tileIndex: number): string =>
  String(tileIndex).padStart(3, "0");

interface BgTileLibraryPreviewState {
  activePaletteIndex: BgPaletteIndex;
  backgroundPalettes: ReturnType<
    typeof useBgModeWorkspaceEditingState
  >["backgroundPalettes"];
  universalBackgroundColor: ReturnType<
    typeof useBgModeWorkspaceEditingState
  >["universalBackgroundColor"];
}

interface BgTileLibraryProps {
  onSelectTile: (tileIndex: number) => void;
  previewState: BgTileLibraryPreviewState;
  selectedTileIndex: number;
  tiles: ReturnType<
    typeof useBgModeWorkspaceEditingState
  >["visibleBackgroundTiles"];
}

const BgTileLibraryComponent: React.FC<BgTileLibraryProps> = ({
  onSelectTile,
  previewState,
  selectedTileIndex,
  tiles,
}) => {
  return (
    <Grid {...tileLibraryGridProps}>
      {tiles.map((tile, tileIndex) => (
        <Grid key={`bg-tile-preview-${tileIndex}`} size={1}>
          <ToolButton
            type="button"
            active={selectedTileIndex === tileIndex}
            aria-label={`#${formatTileNumber(tileIndex)}`}
            aria-pressed={selectedTileIndex === tileIndex}
            onClick={() => {
              onSelectTile(tileIndex);
            }}
          >
            <Stack {...tileButtonLayoutProps}>
              <BackgroundTilePreview
                scale={6}
                tile={tile}
                palette={
                  previewState.backgroundPalettes[
                    previewState.activePaletteIndex
                  ]
                }
                universalBackgroundColor={previewState.universalBackgroundColor}
              />
              <span>{`#${formatTileNumber(tileIndex)}`}</span>
            </Stack>
          </ToolButton>
        </Grid>
      ))}
    </Grid>
  );
};

const BgTileLibrary = React.memo(BgTileLibraryComponent);

const BgModeWorkspacePanelComponent: React.FC<BgModeWorkspacePanelProps> = ({
  onFileMenuStateChange,
}) => {
  const bgModeState = useBgModeWorkspaceEditingState();
  const { exportChr, exportPng, exportSvgSimple } = useExportImage();
  const deferredVisibleBackgroundTiles = React.useDeferredValue(
    bgModeState.visibleBackgroundTiles,
  );
  const tileLibraryPreviewState = React.useMemo<BgTileLibraryPreviewState>(
    () => ({
      activePaletteIndex: bgModeState.activePaletteIndex,
      backgroundPalettes: bgModeState.backgroundPalettes,
      universalBackgroundColor: bgModeState.universalBackgroundColor,
    }),
    [
      bgModeState.activePaletteIndex,
      bgModeState.backgroundPalettes,
      bgModeState.universalBackgroundColor,
    ],
  );
  const projectActions = React.useMemo(
    () =>
      createBgModeWorkspaceProjectActions({
        exportChr,
        exportPng,
        exportSvgSimple,
        getActivePaletteIndex: () => bgModeState.activePaletteIndex,
        getSelectedTile: () => bgModeState.selectedTile,
        getSelectedTileIndex: () => bgModeState.selectedTileIndex,
      }),
    [
      bgModeState.activePaletteIndex,
      bgModeState.selectedTile,
      bgModeState.selectedTileIndex,
      exportChr,
      exportPng,
      exportSvgSimple,
    ],
  );
  const fileMenuState = React.useMemo<FileMenuState>(
    () => ({
      shareActions: projectActions,
      restoreAction: emptyFileMenuState.restoreAction,
    }),
    [projectActions],
  );

  React.useEffect(() => {
    onFileMenuStateChange(fileMenuState);
  }, [fileMenuState, onFileMenuStateChange]);

  React.useEffect(() => {
    return () => {
      onFileMenuStateChange(emptyFileMenuState);
    };
  }, [onFileMenuStateChange]);

  return (
    <SplitLayout
      flex={1}
      height="100%"
      role="region"
      aria-label="BG編集ワークスペース"
    >
      <Panel
        role="region"
        aria-label="BGタイル一覧"
        flex="0 0 21rem"
        minHeight={0}
      >
        <PanelHeader>
          <PanelTitle>BG編集</PanelTitle>
        </PanelHeader>

        <ScrollArea flex={1} minHeight={0}>
          <BgTileLibrary
            onSelectTile={bgModeState.setSelectedTileIndex}
            previewState={tileLibraryPreviewState}
            selectedTileIndex={bgModeState.selectedTileIndex}
            tiles={deferredVisibleBackgroundTiles}
          />
        </ScrollArea>
      </Panel>

      <Panel aria-label="BGタイルエディター" flex={1} minHeight={0}>
        <CanvasViewport
          flex={1}
          minHeight={0}
          aria-label="BGタイル編集キャンバスビュー"
        >
          <Box {...canvasOverlayRootProps}>
            <CollapseToggle
              type="button"
              open={bgModeState.isToolMenuOpen}
              aria-expanded={bgModeState.isToolMenuOpen}
              aria-controls="bg-mode-canvas-tool-menu"
              aria-label={
                bgModeState.isToolMenuOpen
                  ? "BGツールを閉じる"
                  : "BGツールを開く"
              }
              style={overlayToggleButtonStyle}
              onClick={() => {
                bgModeState.setIsToolMenuOpen((previous) => previous === false);
              }}
            >
              {bgModeState.isToolMenuOpen ? "閉じる" : "開く"}
              <ExpandMoreRoundedIcon
                style={chevronStyle(bgModeState.isToolMenuOpen)}
              />
            </CollapseToggle>

            {bgModeState.isToolMenuOpen === true ? (
              <Stack {...canvasOverlayMenuProps} id="bg-mode-canvas-tool-menu">
                <Stack {...mockToolbarProps}>
                  <ToolButton
                    type="button"
                    active={bgModeState.tool === "pen"}
                    aria-label="ペンツール"
                    aria-pressed={bgModeState.tool === "pen"}
                    onClick={() => {
                      bgModeState.setTool("pen");
                    }}
                  >
                    ペン
                  </ToolButton>
                  <ToolButton
                    type="button"
                    active={bgModeState.tool === "eraser"}
                    aria-label="消しゴムツール"
                    aria-pressed={bgModeState.tool === "eraser"}
                    onClick={() => {
                      bgModeState.setTool("eraser");
                    }}
                  >
                    消しゴム
                  </ToolButton>
                </Stack>

                <Stack {...mockToolbarProps}>
                  {BG_PALETTE_OPTIONS.map((paletteIndex) => (
                    <ToolButton
                      key={`bg-mode-palette-${paletteIndex}`}
                      type="button"
                      active={bgModeState.activePaletteIndex === paletteIndex}
                      aria-label={`BGパレット ${paletteIndex}`}
                      aria-pressed={
                        bgModeState.activePaletteIndex === paletteIndex
                      }
                      onClick={() => {
                        bgModeState.setActivePaletteIndex(paletteIndex);
                      }}
                    >
                      {`Palette ${paletteIndex}`}
                    </ToolButton>
                  ))}
                </Stack>
              </Stack>
            ) : (
              <></>
            )}
          </Box>

          <Grid {...centeredCanvasWrapProps}>
            <BgModeTileEditorCanvas
              tile={bgModeState.selectedTile}
              palette={
                bgModeState.backgroundPalettes[bgModeState.activePaletteIndex]
              }
              universalBackgroundColor={bgModeState.universalBackgroundColor}
              onPaintPixel={bgModeState.handlePaintPixel}
            />
          </Grid>
        </CanvasViewport>
      </Panel>
    </SplitLayout>
  );
};

export const BgModeWorkspacePanel = React.memo(BgModeWorkspacePanelComponent);
