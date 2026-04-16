import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import useExportImage from "../../../../../../infrastructure/browser/useExportImage";
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

type BgModeToolButtonProps = React.ComponentProps<typeof Button> & {
  active?: boolean;
};

const BgModeToolButton = React.forwardRef<
  HTMLButtonElement,
  BgModeToolButtonProps
>(function BgModeToolButton({ active, ...props }, ref) {
  return (
    <Button
      ref={ref}
      {...props}
      color={active === true ? "primary" : "inherit"}
      variant={active === true ? "contained" : "outlined"}
    />
  );
});

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
          <BgModeToolButton
            type="button"
            active={selectedTileIndex === tileIndex}
            fullWidth
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
          </BgModeToolButton>
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
    <Stack
      useFlexGap
      direction={{ xs: "column", lg: "row" }}
      spacing="1rem"
      minHeight={0}
      flex={1}
      height="100%"
      role="region"
      aria-label="BG編集ワークスペース"
    >
      <Stack
        component={Paper}
        variant="outlined"
        spacing="0.875rem"
        p="1.125rem"
        role="region"
        aria-label="BGタイル一覧"
        flex="0 0 21rem"
        minHeight={0}
      >
        <Stack position="relative" zIndex={1} spacing="0.3125rem" useFlexGap>
          <Typography component="h2" variant="h2" color="text.primary">
            BG編集
          </Typography>
        </Stack>

        <Box
          flex={1}
          minHeight={0}
          overflow="auto"
          mr={-2.25}
          pr={2.25}
          style={{ scrollbarGutter: "stable" }}
        >
          <BgTileLibrary
            onSelectTile={bgModeState.setSelectedTileIndex}
            previewState={tileLibraryPreviewState}
            selectedTileIndex={bgModeState.selectedTileIndex}
            tiles={deferredVisibleBackgroundTiles}
          />
        </Box>
      </Stack>

      <Stack
        component={Paper}
        variant="outlined"
        spacing="0.875rem"
        p="1.125rem"
        aria-label="BGタイルエディター"
        flex={1}
        minHeight={0}
      >
        <Box
          component={Paper}
          variant="outlined"
          flex={1}
          minHeight={0}
          overflow="auto"
          position="relative"
          p="1.125rem"
          aria-label="BGタイル編集キャンバスビュー"
        >
          <Box {...canvasOverlayRootProps}>
            <Button
              type="button"
              aria-expanded={bgModeState.isToolMenuOpen}
              aria-controls="bg-mode-canvas-tool-menu"
              aria-label={
                bgModeState.isToolMenuOpen
                  ? "BGツールを閉じる"
                  : "BGツールを開く"
              }
              color={
                bgModeState.isToolMenuOpen === true ? "primary" : "inherit"
              }
              endIcon={
                <ExpandMoreRoundedIcon
                  style={chevronStyle(bgModeState.isToolMenuOpen)}
                />
              }
              size="small"
              style={overlayToggleButtonStyle}
              variant={
                bgModeState.isToolMenuOpen === true ? "contained" : "outlined"
              }
              onClick={() => {
                bgModeState.setIsToolMenuOpen((previous) => previous === false);
              }}
            >
              {bgModeState.isToolMenuOpen ? "閉じる" : "開く"}
            </Button>

            {bgModeState.isToolMenuOpen === true ? (
              <Stack {...canvasOverlayMenuProps} id="bg-mode-canvas-tool-menu">
                <Stack {...mockToolbarProps}>
                  <BgModeToolButton
                    type="button"
                    active={bgModeState.tool === "pen"}
                    size="small"
                    aria-label="ペンツール"
                    aria-pressed={bgModeState.tool === "pen"}
                    onClick={() => {
                      bgModeState.setTool("pen");
                    }}
                  >
                    ペン
                  </BgModeToolButton>
                  <BgModeToolButton
                    type="button"
                    active={bgModeState.tool === "eraser"}
                    size="small"
                    aria-label="消しゴムツール"
                    aria-pressed={bgModeState.tool === "eraser"}
                    onClick={() => {
                      bgModeState.setTool("eraser");
                    }}
                  >
                    消しゴム
                  </BgModeToolButton>
                </Stack>

                <Stack {...mockToolbarProps}>
                  {BG_PALETTE_OPTIONS.map((paletteIndex) => (
                    <BgModeToolButton
                      key={`bg-mode-palette-${paletteIndex}`}
                      type="button"
                      active={bgModeState.activePaletteIndex === paletteIndex}
                      size="small"
                      aria-label={`BGパレット ${paletteIndex}`}
                      aria-pressed={
                        bgModeState.activePaletteIndex === paletteIndex
                      }
                      onClick={() => {
                        bgModeState.setActivePaletteIndex(paletteIndex);
                      }}
                    >
                      {`Palette ${paletteIndex}`}
                    </BgModeToolButton>
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
        </Box>
      </Stack>
    </Stack>
  );
};

export const BgModeWorkspacePanel = React.memo(BgModeWorkspacePanelComponent);
