import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import * as E from "fp-ts/Either";
import React from "react";
import { useProjectState } from "../../../../application/state/projectStore";
import { decodeBackgroundTileAtIndex } from "../../../../domain/nes/backgroundEditing";
import {
  PROJECT_BACKGROUND_TILE_COUNT,
  createEmptyBackgroundTile,
} from "../../../../domain/project/projectV2";
import { ToolButton } from "../../../App.styles";
import { SCREEN_BG_TILE_PICKER_PREVIEW_BUTTON_CLASS_NAME } from "../../../styleClassNames";
import { BackgroundTilePreview } from "../../common/preview/BackgroundTilePreview";

type BgPickerMode = "bgTile" | "bgPalette";
type BgPaletteIndex = 0 | 1 | 2 | 3;

interface ScreenModeBackgroundTilePickerDialogProps {
  activePaletteIndex: BgPaletteIndex;
  open: boolean;
  onClose: () => void;
  onPaletteSelect: (paletteIndex: BgPaletteIndex) => void;
  onTileSelect: (tileIndex: number) => void;
}

const BG_PALETTE_OPTIONS: ReadonlyArray<BgPaletteIndex> = [0, 1, 2, 3];

/**
 * BG タイル配置導線の picker dialog を描画します。
 * 既存 UI を増やさず、実プロジェクト状態の BG タイル preview を選択に使います。
 */
export const ScreenModeBackgroundTilePickerDialog: React.FC<
  ScreenModeBackgroundTilePickerDialogProps
> = ({ activePaletteIndex, open, onClose, onPaletteSelect, onTileSelect }) => {
  const [pickerMode, setPickerMode] = React.useState<BgPickerMode>("bgTile");
  const nes = useProjectState((state) => state.nes);

  const visibleBackgroundTiles = React.useMemo(
    () =>
      Array.from({ length: PROJECT_BACKGROUND_TILE_COUNT }, (_, tileIndex) => {
        const tile = decodeBackgroundTileAtIndex(nes.chrBytes, tileIndex);

        return E.isRight(tile) ? tile.right : createEmptyBackgroundTile();
      }),
    [nes.chrBytes],
  );

  React.useEffect(() => {
    if (open === true) {
      setPickerMode("bgTile");
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>BG編集</DialogTitle>
      <DialogContent>
        <Stack spacing="1rem" useFlexGap>
          <Stack
            direction="row"
            flexWrap="wrap"
            alignItems="center"
            spacing="0.625rem"
            useFlexGap
          >
            <ToolButton
              type="button"
              active={pickerMode === "bgTile"}
              aria-label="BGタイル"
              aria-pressed={pickerMode === "bgTile"}
              onClick={() => {
                setPickerMode("bgTile");
              }}
            >
              BGタイル
            </ToolButton>
            <ToolButton
              type="button"
              active={pickerMode === "bgPalette"}
              aria-label="BG属性"
              aria-pressed={pickerMode === "bgPalette"}
              onClick={() => {
                setPickerMode("bgPalette");
              }}
            >
              BG属性
            </ToolButton>
          </Stack>

          {pickerMode === "bgTile" ? (
            <Box
              display="grid"
              gridTemplateColumns="repeat(auto-fill, minmax(8rem, 1fr))"
              gap="0.875rem"
            >
              {visibleBackgroundTiles.map((tile, tileIndex) => (
                <ButtonBase
                  key={`screen-mode-bg-dialog-tile-${tileIndex}`}
                  className={SCREEN_BG_TILE_PICKER_PREVIEW_BUTTON_CLASS_NAME}
                  type="button"
                  aria-label={`BGタイルプレビュー ${tileIndex}`}
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
              ))}
            </Box>
          ) : (
            <Stack
              direction="row"
              flexWrap="wrap"
              alignItems="center"
              spacing="0.625rem"
              useFlexGap
            >
              {BG_PALETTE_OPTIONS.map((paletteIndex) => (
                <ToolButton
                  key={`screen-mode-dialog-bg-palette-${paletteIndex}`}
                  type="button"
                  active={activePaletteIndex === paletteIndex}
                  aria-label={`BG属性パレット ${paletteIndex}`}
                  aria-pressed={activePaletteIndex === paletteIndex}
                  onClick={() => {
                    onPaletteSelect(paletteIndex);
                    onClose();
                  }}
                >
                  {`Palette ${paletteIndex}`}
                </ToolButton>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};
