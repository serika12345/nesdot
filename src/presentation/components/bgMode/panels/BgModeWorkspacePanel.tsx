import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Box, Stack } from "@mui/material";
import React from "react";
import useExportImage from "../../../../infrastructure/browser/useExportImage";
import {
  CanvasViewport,
  CollapseToggle,
  Panel,
  PanelHeader,
  PanelTitle,
  ScrollArea,
  SplitLayout,
  ToolButton,
} from "../../../App.styles";
import {
  BG_MODE_CANVAS_OVERLAY_MENU_CLASS_NAME,
  BG_MODE_CANVAS_OVERLAY_ROOT_CLASS_NAME,
  BG_MODE_CENTERED_CANVAS_WRAP_CLASS_NAME,
  BG_MODE_MOCK_TOOLBAR_CLASS_NAME,
  BG_MODE_OVERLAY_TOGGLE_BUTTON_CLASS_NAME,
  BG_MODE_TILE_BUTTON_LAYOUT_CLASS_NAME,
  BG_MODE_TILE_LIBRARY_GRID_CLASS_NAME,
} from "../../../styleClassNames";
import { BackgroundTilePreview } from "../../common/preview/BackgroundTilePreview";
import {
  emptyFileMenuState,
  type FileMenuState,
} from "../../common/state/fileMenuState";
import { BgModeTileEditorCanvas } from "../canvas/BgModeTileEditorCanvas";
import { useBgModeEditingState } from "../hooks/useBgModeEditingState";
import { createBgModeProjectActions } from "../hooks/useBgModeProjectActions";

interface BgModeWorkspacePanelProps {
  onFileMenuStateChange: (fileMenuState: FileMenuState) => void;
}

type BgPaletteIndex = 0 | 1 | 2 | 3;
const BG_PALETTE_OPTIONS: ReadonlyArray<BgPaletteIndex> = [0, 1, 2, 3];

const formatTileNumber = (tileIndex: number): string =>
  String(tileIndex).padStart(3, "0");

const chevronStyle = (open: boolean): React.CSSProperties => ({
  transform: open ? "rotate(180deg)" : "rotate(0deg)",
  transition: "transform 160ms ease",
});

interface BgTileLibraryPreviewState {
  activePaletteIndex: BgPaletteIndex;
  backgroundPalettes: ReturnType<
    typeof useBgModeEditingState
  >["backgroundPalettes"];
  universalBackgroundColor: ReturnType<
    typeof useBgModeEditingState
  >["universalBackgroundColor"];
}

interface BgTileLibraryProps {
  onSelectTile: (tileIndex: number) => void;
  previewState: BgTileLibraryPreviewState;
  selectedTileIndex: number;
  tiles: ReturnType<typeof useBgModeEditingState>["visibleBackgroundTiles"];
}

const BgTileLibraryComponent: React.FC<BgTileLibraryProps> = ({
  onSelectTile,
  previewState,
  selectedTileIndex,
  tiles,
}) => {
  return (
    <Box
      className={BG_MODE_TILE_LIBRARY_GRID_CLASS_NAME}
      display="grid"
      gridTemplateColumns="repeat(auto-fill, minmax(5.5rem, 1fr))"
      gap={1.5}
    >
      {tiles.map((tile, tileIndex) => (
        <ToolButton
          key={`bg-tile-preview-${tileIndex}`}
          type="button"
          active={selectedTileIndex === tileIndex}
          aria-label={`#${formatTileNumber(tileIndex)}`}
          aria-pressed={selectedTileIndex === tileIndex}
          onClick={() => {
            onSelectTile(tileIndex);
          }}
        >
          <Stack
            className={BG_MODE_TILE_BUTTON_LAYOUT_CLASS_NAME}
            alignItems="center"
            spacing={1}
            useFlexGap
            width="100%"
          >
            <BackgroundTilePreview
              scale={6}
              tile={tile}
              palette={
                previewState.backgroundPalettes[previewState.activePaletteIndex]
              }
              universalBackgroundColor={previewState.universalBackgroundColor}
            />
            <span>{`#${formatTileNumber(tileIndex)}`}</span>
          </Stack>
        </ToolButton>
      ))}
    </Box>
  );
};

const BgTileLibrary = React.memo(BgTileLibraryComponent);

const BgModeWorkspacePanelComponent: React.FC<BgModeWorkspacePanelProps> = ({
  onFileMenuStateChange,
}) => {
  const bgModeState = useBgModeEditingState();
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
      createBgModeProjectActions({
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
          <Box
            className={BG_MODE_CANVAS_OVERLAY_ROOT_CLASS_NAME}
            position="absolute"
            top={2.25}
            left={2.25}
            zIndex={2}
            style={{ pointerEvents: "none" }}
          >
            <CollapseToggle
              className={BG_MODE_OVERLAY_TOGGLE_BUTTON_CLASS_NAME}
              type="button"
              open={bgModeState.isToolMenuOpen}
              aria-expanded={bgModeState.isToolMenuOpen}
              aria-controls="bg-mode-canvas-tool-menu"
              aria-label={
                bgModeState.isToolMenuOpen
                  ? "BGツールを閉じる"
                  : "BGツールを開く"
              }
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
              <Stack
                className={BG_MODE_CANVAS_OVERLAY_MENU_CLASS_NAME}
                id="bg-mode-canvas-tool-menu"
                spacing={1.5}
                useFlexGap
                width="20rem"
                maxWidth="calc(100vw - 4rem)"
                p={1.5}
                style={{ pointerEvents: "auto" }}
              >
                <Stack
                  className={BG_MODE_MOCK_TOOLBAR_CLASS_NAME}
                  direction="row"
                  flexWrap="wrap"
                  alignItems="center"
                  spacing={1.25}
                  useFlexGap
                >
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

                <Stack
                  className={BG_MODE_MOCK_TOOLBAR_CLASS_NAME}
                  direction="row"
                  flexWrap="wrap"
                  alignItems="center"
                  spacing={1.25}
                  useFlexGap
                >
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

          <Box
            className={BG_MODE_CENTERED_CANVAS_WRAP_CLASS_NAME}
            display="grid"
            width="100%"
            height="100%"
            minWidth="100%"
            minHeight="100%"
            style={{ placeItems: "center" }}
          >
            <BgModeTileEditorCanvas
              tile={bgModeState.selectedTile}
              palette={
                bgModeState.backgroundPalettes[bgModeState.activePaletteIndex]
              }
              universalBackgroundColor={bgModeState.universalBackgroundColor}
              onPaintPixel={bgModeState.handlePaintPixel}
            />
          </Box>
        </CanvasViewport>
      </Panel>
    </SplitLayout>
  );
};

export const BgModeWorkspacePanel = React.memo(BgModeWorkspacePanelComponent);
