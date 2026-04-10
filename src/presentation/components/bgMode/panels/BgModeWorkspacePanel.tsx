import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
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

const TileLibraryGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(5.5rem, 1fr))",
  gap: "0.75rem",
});

const TileButtonLayout = styled(Stack)({
  alignItems: "center",
  gap: "0.5rem",
  width: "100%",
});

const MockToolbar = styled(Stack)({
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "0.625rem",
});

const CenteredCanvasWrap = styled("div")({
  display: "grid",
  placeItems: "center",
  width: "100%",
  height: "100%",
  minWidth: "100%",
  minHeight: "100%",
});

const CanvasOverlayRoot = styled("div")({
  position: "absolute",
  top: "1.125rem",
  left: "1.125rem",
  zIndex: 2,
  pointerEvents: "none",
});

const CanvasOverlayMenu = styled(Stack)({
  marginTop: "0.75rem",
  width: "20rem",
  maxWidth: "calc(100vw - 4rem)",
  pointerEvents: "auto",
  borderRadius: "1.125rem",
  background: "rgba(255, 255, 255, 0.98)",
  border: "0.0625rem solid rgba(148, 163, 184, 0.2)",
  boxShadow: "0 1.375rem 2.5rem rgba(15, 23, 42, 0.16)",
  backdropFilter: "blur(1.125rem)",
  padding: "0.75rem",
});

const OverlayToggleButton = styled(CollapseToggle)({
  pointerEvents: "auto",
});

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
    <TileLibraryGrid>
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
          <TileButtonLayout>
            <BackgroundTilePreview
              scale={6}
              tile={tile}
              palette={
                previewState.backgroundPalettes[previewState.activePaletteIndex]
              }
              universalBackgroundColor={previewState.universalBackgroundColor}
            />
            <span>{`#${formatTileNumber(tileIndex)}`}</span>
          </TileButtonLayout>
        </ToolButton>
      ))}
    </TileLibraryGrid>
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
          <CanvasOverlayRoot>
            <OverlayToggleButton
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
            </OverlayToggleButton>

            {bgModeState.isToolMenuOpen === true ? (
              <CanvasOverlayMenu
                id="bg-mode-canvas-tool-menu"
                spacing="0.75rem"
                useFlexGap
              >
                <MockToolbar>
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
                </MockToolbar>

                <MockToolbar>
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
                </MockToolbar>
              </CanvasOverlayMenu>
            ) : (
              <></>
            )}
          </CanvasOverlayRoot>

          <CenteredCanvasWrap>
            <BgModeTileEditorCanvas
              tile={bgModeState.selectedTile}
              palette={
                bgModeState.backgroundPalettes[bgModeState.activePaletteIndex]
              }
              universalBackgroundColor={bgModeState.universalBackgroundColor}
              onPaintPixel={bgModeState.handlePaintPixel}
            />
          </CenteredCanvasWrap>
        </CanvasViewport>
      </Panel>
    </SplitLayout>
  );
};

export const BgModeWorkspacePanel = React.memo(BgModeWorkspacePanelComponent);
