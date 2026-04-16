import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
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

interface ScreenModeBackgroundTilePickerDialogProps {
  activePaletteIndex: BgPaletteIndex;
  pickerMode: O.Option<BgPickerMode>;
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
 * 既存 UI を増やさず、実プロジェクト状態の BG タイル preview を選択に使います。
 */
export const ScreenModeBackgroundTilePickerDialog: React.FC<
  ScreenModeBackgroundTilePickerDialogProps
> = ({
  activePaletteIndex,
  pickerMode,
  onClose,
  onPaletteSelect,
  onTileSelect,
}) => {
  const nes = useProjectState((state) => state.nes);
  const [pendingPaletteIndex, setPendingPaletteIndex] =
    React.useState<BgPaletteIndex>(activePaletteIndex);

  const visibleBackgroundTiles = React.useMemo(
    () =>
      Array.from({ length: PROJECT_BACKGROUND_TILE_COUNT }, (_, tileIndex) => {
        const tile = decodeBackgroundTileAtIndex(nes.chrBytes, tileIndex);

        return E.isRight(tile) ? tile.right : createEmptyBackgroundTile();
      }),
    [nes.chrBytes],
  );

  React.useEffect(() => {
    if (O.isSome(pickerMode) && pickerMode.value === "bgPalette") {
      setPendingPaletteIndex(activePaletteIndex);
    }
  }, [activePaletteIndex, pickerMode]);

  const handleApplyPaletteSelection = React.useCallback((): void => {
    onPaletteSelect(pendingPaletteIndex);
  }, [onPaletteSelect, pendingPaletteIndex]);

  return (
    <Dialog
      open={O.isSome(pickerMode)}
      onClose={onClose}
      fullWidth
      maxWidth={
        O.isSome(pickerMode) ? resolveDialogMaxWidth(pickerMode.value) : "sm"
      }
    >
      <DialogTitle>
        {O.isSome(pickerMode) ? resolveDialogTitle(pickerMode.value) : ""}
      </DialogTitle>
      <DialogContent>
        {O.match(
          () => <></>,
          (mode: BgPickerMode) => {
            if (mode === "bgTile") {
              return (
                <Grid
                  container
                  columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
                  spacing={1.75}
                >
                  {visibleBackgroundTiles.map((tile, tileIndex) => (
                    <Grid
                      key={`screen-mode-bg-dialog-tile-${tileIndex}`}
                      size={1}
                    >
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
                            universalBackgroundColor={
                              nes.universalBackgroundColor
                            }
                          />
                          <strong>{`#${String(tileIndex).padStart(3, "0")}`}</strong>
                        </Stack>
                      </ButtonBase>
                    </Grid>
                  ))}
                </Grid>
              );
            }

            return (
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
                      setPendingPaletteIndex(paletteIndex);
                    }}
                  >
                    {`Palette ${paletteIndex}`}
                  </Button>
                ))}
              </Stack>
            );
          },
        )(pickerMode)}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
        {O.isSome(pickerMode) && pickerMode.value === "bgPalette" ? (
          <Button variant="contained" onClick={handleApplyPaletteSelection}>
            変更する
          </Button>
        ) : (
          <></>
        )}
      </DialogActions>
    </Dialog>
  );
};
