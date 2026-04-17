import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import React from "react";
import {
  type NesBackgroundPalettes,
  type NesColorIndex,
} from "../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../domain/project/projectV2";
import { BackgroundTilePreview } from "../../../common/ui/preview/BackgroundTilePreview";
import { previewButtonStyle } from "./ScreenModeBackgroundTilePickerDialogStyle";

type BgPickerMode = "bgTile" | "bgPalette";
type BgPaletteIndex = 0 | 1 | 2 | 3;

interface ScreenModeBackgroundTilePickerDialogState {
  activePaletteIndex: BgPaletteIndex;
  isOpen: boolean;
  pendingPaletteIndex: BgPaletteIndex;
  pickerMode: BgPickerMode;
}

interface ScreenModeBackgroundTilePickerDialogProps {
  dialog: ScreenModeBackgroundTilePickerDialogState;
  actions: Readonly<{
    onApplyPaletteSelection: () => void;
    onClose: () => void;
    onPaletteSelect: (paletteIndex: BgPaletteIndex) => void;
    onTileSelect: (tileIndex: number) => void;
  }>;
  preview: Readonly<{
    backgroundPalettes: NesBackgroundPalettes;
    universalBackgroundColor: NesColorIndex;
    visibleBackgroundTiles: ReadonlyArray<BackgroundTile>;
  }>;
}

const BG_PALETTE_OPTIONS: ReadonlyArray<BgPaletteIndex> = [0, 1, 2, 3];

const resolveDialogMaxWidth = (pickerMode: BgPickerMode): "lg" | "sm" => {
  if (pickerMode === "bgTile") {
    return "lg";
  }

  return "sm";
};

const resolveDialogTitle = (pickerMode: BgPickerMode): string => {
  if (pickerMode === "bgTile") {
    return "BGタイル追加";
  }

  return "BGパレット変更";
};

/**
 * BG タイル配置導線の picker dialog を描画します。
 * 見た目に必要な BG preview data は親から受け取り、component 自体は表示だけに保ちます。
 */
export const ScreenModeBackgroundTilePickerDialog: React.FC<
  ScreenModeBackgroundTilePickerDialogProps
> = ({ actions, dialog, preview }) => {
  const { activePaletteIndex, isOpen, pendingPaletteIndex, pickerMode } =
    dialog;

  return (
    <Dialog
      open={isOpen}
      onClose={actions.onClose}
      fullWidth
      maxWidth={resolveDialogMaxWidth(pickerMode)}
    >
      <DialogTitle>{resolveDialogTitle(pickerMode)}</DialogTitle>
      <DialogContent>
        {pickerMode === "bgTile" ? (
          <Grid
            container
            columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
            spacing={1.75}
          >
            {preview.visibleBackgroundTiles.map((tile, tileIndex) => (
              <Grid key={`screen-mode-bg-dialog-tile-${tileIndex}`} size={1}>
                <ButtonBase
                  type="button"
                  aria-label={`BGタイルプレビュー ${tileIndex}`}
                  style={previewButtonStyle}
                  onClick={() => {
                    actions.onTileSelect(tileIndex);
                  }}
                >
                  <Stack
                    useFlexGap
                    width="100%"
                    alignItems="flex-start"
                    spacing="0.625rem"
                  >
                    <BackgroundTilePreview
                      scale={8}
                      tile={tile}
                      palette={preview.backgroundPalettes[activePaletteIndex]}
                      universalBackgroundColor={
                        preview.universalBackgroundColor
                      }
                    />
                    <strong>{`#${String(tileIndex).padStart(3, "0")}`}</strong>
                  </Stack>
                </ButtonBase>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Stack
            direction="row"
            flexWrap="wrap"
            alignItems="center"
            spacing="0.625rem"
            useFlexGap
          >
            {BG_PALETTE_OPTIONS.map((paletteIndex) => (
              <Button
                key={`screen-mode-dialog-bg-palette-${paletteIndex}`}
                type="button"
                size="small"
                variant={
                  pendingPaletteIndex === paletteIndex
                    ? "contained"
                    : "outlined"
                }
                aria-label={`BGパレット ${paletteIndex}`}
                aria-pressed={pendingPaletteIndex === paletteIndex}
                onClick={() => {
                  actions.onPaletteSelect(paletteIndex);
                }}
              >
                {`Palette ${paletteIndex}`}
              </Button>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={actions.onClose}>閉じる</Button>
        {pickerMode === "bgPalette" ? (
          <Button variant="contained" onClick={actions.onApplyPaletteSelection}>
            変更する
          </Button>
        ) : (
          <></>
        )}
      </DialogActions>
    </Dialog>
  );
};
