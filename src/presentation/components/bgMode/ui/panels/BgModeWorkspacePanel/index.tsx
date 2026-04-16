import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import { useProjectState } from "../../../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../../../application/state/workbenchStore";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../../domain/project/projectV2";
import { BackgroundTilePreview } from "../../../../common/ui/preview/BackgroundTilePreview";
import { useBgModeTileEditorState } from "../../../logic/bgModeWorkspaceEditingState";
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

type BgPaletteIndex = 0 | 1 | 2 | 3;

const BG_PALETTE_OPTIONS: ReadonlyArray<BgPaletteIndex> = [0, 1, 2, 3];
const DEFAULT_BG_PALETTE: NesSubPalette = [0, 0, 0, 0];

const formatTileNumber = (tileIndex: number): string =>
  String(tileIndex).padStart(3, "0");

const resolveActivePalette = (
  backgroundPalettes: ReadonlyArray<NesSubPalette>,
  activePaletteIndex: BgPaletteIndex,
): NesSubPalette =>
  backgroundPalettes[activePaletteIndex] ?? DEFAULT_BG_PALETTE;

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
  backgroundPalettes: ReadonlyArray<NesSubPalette>;
  universalBackgroundColor: NesColorIndex;
}

interface BgTileLibraryProps {
  onSelectTile: (tileIndex: number) => void;
  previewState: BgTileLibraryPreviewState;
  selectedTileIndex: number;
  tiles: ReadonlyArray<BackgroundTile>;
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
                palette={resolveActivePalette(
                  previewState.backgroundPalettes,
                  previewState.activePaletteIndex,
                )}
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

const BgModeWorkspacePanelComponent: React.FC = () => {
  const activePaletteIndex = useWorkbenchState(
    (state) => state.bgMode.activePaletteIndex,
  );
  const isToolMenuOpen = useWorkbenchState(
    (state) => state.bgMode.isToolMenuOpen,
  );
  const selectedTileIndex = useWorkbenchState(
    (state) => state.bgMode.selectedTileIndex,
  );
  const setActivePaletteIndex = useWorkbenchState(
    (state) => state.setBgModeActivePaletteIndex,
  );
  const setIsToolMenuOpen = useWorkbenchState(
    (state) => state.setBgModeToolMenuOpen,
  );
  const setSelectedTileIndex = useWorkbenchState(
    (state) => state.setBgModeSelectedTileIndex,
  );
  const setTool = useWorkbenchState((state) => state.setBgModeTool);
  const tool = useWorkbenchState((state) => state.bgMode.tool);
  const backgroundPalettes = useProjectState(
    (state) => state.nes.backgroundPalettes,
  );
  const universalBackgroundColor = useProjectState(
    (state) => state.nes.universalBackgroundColor,
  );
  const { handlePaintPixel, selectedTile, visibleBackgroundTiles } =
    useBgModeTileEditorState();
  const deferredVisibleBackgroundTiles = React.useDeferredValue(
    visibleBackgroundTiles,
  );
  const tileLibraryPreviewState = React.useMemo<BgTileLibraryPreviewState>(
    () => ({
      activePaletteIndex,
      backgroundPalettes,
      universalBackgroundColor,
    }),
    [activePaletteIndex, backgroundPalettes, universalBackgroundColor],
  );
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
            onSelectTile={setSelectedTileIndex}
            previewState={tileLibraryPreviewState}
            selectedTileIndex={selectedTileIndex}
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
              aria-expanded={isToolMenuOpen}
              aria-controls="bg-mode-canvas-tool-menu"
              aria-label={
                isToolMenuOpen ? "BGツールを閉じる" : "BGツールを開く"
              }
              color={isToolMenuOpen === true ? "primary" : "inherit"}
              endIcon={
                <ExpandMoreRoundedIcon style={chevronStyle(isToolMenuOpen)} />
              }
              size="small"
              style={overlayToggleButtonStyle}
              variant={isToolMenuOpen === true ? "contained" : "outlined"}
              onClick={() => {
                setIsToolMenuOpen(isToolMenuOpen === false);
              }}
            >
              {isToolMenuOpen ? "閉じる" : "開く"}
            </Button>

            {isToolMenuOpen === true ? (
              <Stack {...canvasOverlayMenuProps} id="bg-mode-canvas-tool-menu">
                <Stack {...mockToolbarProps}>
                  <BgModeToolButton
                    type="button"
                    active={tool === "pen"}
                    size="small"
                    aria-label="ペンツール"
                    aria-pressed={tool === "pen"}
                    onClick={() => {
                      setTool("pen");
                    }}
                  >
                    ペン
                  </BgModeToolButton>
                  <BgModeToolButton
                    type="button"
                    active={tool === "eraser"}
                    size="small"
                    aria-label="消しゴムツール"
                    aria-pressed={tool === "eraser"}
                    onClick={() => {
                      setTool("eraser");
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
                      active={activePaletteIndex === paletteIndex}
                      size="small"
                      aria-label={`BGパレット ${paletteIndex}`}
                      aria-pressed={activePaletteIndex === paletteIndex}
                      onClick={() => {
                        setActivePaletteIndex(paletteIndex);
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
              tile={selectedTile}
              palette={resolveActivePalette(
                backgroundPalettes,
                activePaletteIndex,
              )}
              universalBackgroundColor={universalBackgroundColor}
              onPaintPixel={handlePaintPixel}
            />
          </Grid>
        </Box>
      </Stack>
    </Stack>
  );
};

export const BgModeWorkspacePanel = React.memo(BgModeWorkspacePanelComponent);
