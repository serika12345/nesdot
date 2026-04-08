import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";
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
  emptyFileMenuState,
  type FileMenuState,
} from "../../common/state/fileMenuState";

interface BgModeWorkspacePanelProps {
  onFileMenuStateChange: (fileMenuState: FileMenuState) => void;
}

type BgTool = "pen" | "eraser";
type BgPaletteIndex = 0 | 1 | 2 | 3;

const MOCK_BG_TILE_PREVIEW_COUNT = 16;
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

const TilePreviewSwatch = styled("span")({
  width: "3rem",
  height: "3rem",
  borderRadius: "0.75rem",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
  background:
    "linear-gradient(135deg, rgba(15, 118, 110, 0.24) 0%, rgba(15, 23, 42, 0.08) 100%), repeating-linear-gradient(0deg, rgba(15, 23, 42, 0.08) 0, rgba(15, 23, 42, 0.08) 0.375rem, rgba(255, 255, 255, 0.16) 0.375rem, rgba(255, 255, 255, 0.16) 0.75rem), repeating-linear-gradient(90deg, rgba(15, 23, 42, 0.08) 0, rgba(15, 23, 42, 0.08) 0.375rem, rgba(255, 255, 255, 0.16) 0.375rem, rgba(255, 255, 255, 0.16) 0.75rem)",
  boxShadow: "inset 0 0.0625rem 0 rgba(255, 255, 255, 0.3)",
});

const MockCanvasSurface = styled("div")({
  width: "18rem",
  height: "18rem",
  borderRadius: "1.25rem",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.02)), repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.14) 0, rgba(148, 163, 184, 0.14) 0.0625rem, transparent 0.0625rem, transparent 2.25rem), repeating-linear-gradient(90deg, rgba(148, 163, 184, 0.14) 0, rgba(148, 163, 184, 0.14) 0.0625rem, transparent 0.0625rem, transparent 2.25rem)",
  display: "grid",
  placeItems: "center",
});

const CanvasFocusTile = styled("div")({
  width: "4.5rem",
  height: "4.5rem",
  borderRadius: "0.875rem",
  border: "0.125rem dashed rgba(20, 184, 166, 0.88)",
  background: "rgba(45, 212, 191, 0.12)",
  boxShadow: "0 0 0 0.375rem rgba(45, 212, 191, 0.08)",
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

const BgModeWorkspacePanelComponent: React.FC<BgModeWorkspacePanelProps> = ({
  onFileMenuStateChange,
}) => {
  const [selectedTileIndex, setSelectedTileIndex] = React.useState(0);
  const [tool, setTool] = React.useState<BgTool>("pen");
  const [activePaletteIndex, setActivePaletteIndex] =
    React.useState<BgPaletteIndex>(0);
  const [isToolMenuOpen, setIsToolMenuOpen] = React.useState(false);

  React.useEffect(() => {
    onFileMenuStateChange(emptyFileMenuState);

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
          <TileLibraryGrid>
            {Array.from(
              { length: MOCK_BG_TILE_PREVIEW_COUNT },
              (_, tileIndex) => (
                <ToolButton
                  key={`bg-tile-preview-${tileIndex}`}
                  type="button"
                  active={selectedTileIndex === tileIndex}
                  aria-label={`#${formatTileNumber(tileIndex)}`}
                  aria-pressed={selectedTileIndex === tileIndex}
                  onClick={() => {
                    setSelectedTileIndex(tileIndex);
                  }}
                >
                  <TileButtonLayout>
                    <TilePreviewSwatch aria-hidden="true" />
                    <span>{`#${formatTileNumber(tileIndex)}`}</span>
                  </TileButtonLayout>
                </ToolButton>
              ),
            )}
          </TileLibraryGrid>
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
              open={isToolMenuOpen}
              aria-expanded={isToolMenuOpen}
              aria-controls="bg-mode-canvas-tool-menu"
              aria-label={
                isToolMenuOpen ? "BGツールを閉じる" : "BGツールを開く"
              }
              onClick={() => {
                setIsToolMenuOpen((previous) => previous === false);
              }}
            >
              {isToolMenuOpen ? "閉じる" : "開く"}
              <ExpandMoreRoundedIcon style={chevronStyle(isToolMenuOpen)} />
            </OverlayToggleButton>

            {isToolMenuOpen === true ? (
              <CanvasOverlayMenu
                id="bg-mode-canvas-tool-menu"
                spacing="0.75rem"
                useFlexGap
              >
                <MockToolbar>
                  <ToolButton
                    type="button"
                    active={tool === "pen"}
                    aria-label="ペンツール"
                    aria-pressed={tool === "pen"}
                    onClick={() => {
                      setTool("pen");
                    }}
                  >
                    ペン
                  </ToolButton>
                  <ToolButton
                    type="button"
                    active={tool === "eraser"}
                    aria-label="消しゴムツール"
                    aria-pressed={tool === "eraser"}
                    onClick={() => {
                      setTool("eraser");
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
                      active={activePaletteIndex === paletteIndex}
                      aria-label={`BGパレット ${paletteIndex}`}
                      aria-pressed={activePaletteIndex === paletteIndex}
                      onClick={() => {
                        setActivePaletteIndex(paletteIndex);
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
            <MockCanvasSurface>
              <CanvasFocusTile aria-hidden="true" />
            </MockCanvasSurface>
          </CenteredCanvasWrap>
        </CanvasViewport>
      </Panel>
    </SplitLayout>
  );
};

export const BgModeWorkspacePanel = React.memo(BgModeWorkspacePanelComponent);
