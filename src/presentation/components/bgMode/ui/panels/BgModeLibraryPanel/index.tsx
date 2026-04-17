import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React from "react";
import { type PaletteIndex } from "../../../../../../application/state/projectStore";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../../domain/project/projectV2";
import { BackgroundTilePreview } from "../../../../common/ui/preview/BackgroundTilePreview";
import {
  tileButtonLayoutProps,
  tileLibraryGridProps,
} from "../bgModePanelStyles";

const DEFAULT_BG_PALETTE: NesSubPalette = [0, 0, 0, 0];

const formatTileNumber = (tileIndex: number): string =>
  String(tileIndex).padStart(3, "0");

const resolveActivePalette = (
  backgroundPalettes: ReadonlyArray<NesSubPalette>,
  activePaletteIndex: PaletteIndex,
): NesSubPalette =>
  backgroundPalettes[activePaletteIndex] ?? DEFAULT_BG_PALETTE;

export interface BgModeLibraryPanelState {
  activePaletteIndex: PaletteIndex;
  backgroundPalettes: ReadonlyArray<NesSubPalette>;
  handleSelectTile: (tileIndex: number) => void;
  selectedTileIndex: number;
  tiles: ReadonlyArray<BackgroundTile>;
  universalBackgroundColor: NesColorIndex;
}

interface BgModeLibraryPanelProps {
  libraryPanelState: BgModeLibraryPanelState;
}

/**
 * BG タイル一覧の panel です。
 * 選択状態と preview 表示だけを扱います。
 */
export const BgModeLibraryPanel: React.FC<BgModeLibraryPanelProps> = ({
  libraryPanelState,
}) => {
  return (
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
        <Grid {...tileLibraryGridProps}>
          {libraryPanelState.tiles.map((tile, tileIndex) => (
            <Grid key={`bg-tile-preview-${tileIndex}`} size={1}>
              <Button
                type="button"
                color={
                  libraryPanelState.selectedTileIndex === tileIndex
                    ? "primary"
                    : "inherit"
                }
                variant={
                  libraryPanelState.selectedTileIndex === tileIndex
                    ? "contained"
                    : "outlined"
                }
                fullWidth
                aria-label={`#${formatTileNumber(tileIndex)}`}
                aria-pressed={libraryPanelState.selectedTileIndex === tileIndex}
                onClick={() => {
                  libraryPanelState.handleSelectTile(tileIndex);
                }}
              >
                <Stack {...tileButtonLayoutProps}>
                  <BackgroundTilePreview
                    scale={6}
                    tile={tile}
                    palette={resolveActivePalette(
                      libraryPanelState.backgroundPalettes,
                      libraryPanelState.activePaletteIndex,
                    )}
                    universalBackgroundColor={
                      libraryPanelState.universalBackgroundColor
                    }
                  />
                  <span>{`#${formatTileNumber(tileIndex)}`}</span>
                </Stack>
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
};
