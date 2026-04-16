import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import * as E from "fp-ts/Either";
import React from "react";
import { useProjectState } from "../../../../../../application/state/projectStore";
import { decodeBackgroundTileAtIndex } from "../../../../../../domain/nes/backgroundEditing";
import {
  PROJECT_BACKGROUND_TILE_COUNT,
  createEmptyBackgroundTile,
} from "../../../../../../domain/project/projectV2";
import { BackgroundTilePreview } from "../../../../common/ui/preview/BackgroundTilePreview";
import { previewButtonStyle } from "./styles";

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
  onApplyPaletteSelection: () => void;
  onClose: () => void;
  onPaletteSelect: (paletteIndex: BgPaletteIndex) => void;
  onTileSelect: (tileIndex: number) => void;
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
 * 実プロジェクト状態の BG preview を描画しつつ、見た目状態は親の hook から controlled に受け取ります。
 */
export const ScreenModeBackgroundTilePickerDialog: React.FC<
  ScreenModeBackgroundTilePickerDialogProps
> = ({
  dialog,
  onApplyPaletteSelection,
  onClose,
  onPaletteSelect,
  onTileSelect,
}) => {
  const { activePaletteIndex, isOpen, pendingPaletteIndex, pickerMode } =
    dialog;
  const nes = useProjectState((state) => state.nes);

  const visibleBackgroundTiles = React.useMemo(
    () =>
      Array.from({ length: PROJECT_BACKGROUND_TILE_COUNT }, (_, tileIndex) => {
        const tile = decodeBackgroundTileAtIndex(nes.chrBytes, tileIndex);

        return E.isRight(tile) ? tile.right : createEmptyBackgroundTile();
      }),
    [nes.chrBytes],
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
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
            {visibleBackgroundTiles.map((tile, tileIndex) => (
              <Grid key={`screen-mode-bg-dialog-tile-${tileIndex}`} size={1}>
                <ButtonBase
                  type="button"
                  aria-label={`BGタイルプレビュー ${tileIndex}`}
                  style={previewButtonStyle}
                  onClick={() => {
                    onTileSelect(tileIndex);
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
                      palette={nes.backgroundPalettes[activePaletteIndex]}
                      universalBackgroundColor={nes.universalBackgroundColor}
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
                  onPaletteSelect(paletteIndex);
                }}
              >
                {`Palette ${paletteIndex}`}
              </Button>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
        {pickerMode === "bgPalette" ? (
          <Button variant="contained" onClick={onApplyPaletteSelection}>
            変更する
          </Button>
        ) : (
          <></>
        )}
      </DialogActions>
    </Dialog>
  );
};
