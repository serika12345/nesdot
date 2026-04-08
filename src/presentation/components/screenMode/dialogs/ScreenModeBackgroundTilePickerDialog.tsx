import {
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import * as E from "fp-ts/Either";
import React from "react";
import { useProjectState } from "../../../../application/state/projectStore";
import { decodeBackgroundTileAtIndex } from "../../../../domain/nes/backgroundEditing";
import {
  PROJECT_BACKGROUND_TILE_COUNT,
  createEmptyBackgroundTile,
} from "../../../../domain/project/projectV2";
import { ToolButton } from "../../../App.styles";
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

const PreviewGrid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(8rem, 1fr))",
  gap: "0.875rem",
});

const PreviewButton = styled(ButtonBase)({
  width: "100%",
  borderRadius: "1rem",
  border: "0.0625rem solid rgba(148, 163, 184, 0.18)",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92))",
  boxShadow: "0 0.625rem 1.25rem rgba(15, 23, 42, 0.08)",
  padding: "0.875rem",
  textAlign: "left",
});

const PreviewButtonLayout = styled(Stack)({
  width: "100%",
  alignItems: "flex-start",
  gap: "0.625rem",
});

const DialogToolbar = styled(Stack)({
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "0.625rem",
});

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
          <DialogToolbar>
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
          </DialogToolbar>

          {pickerMode === "bgTile" ? (
            <PreviewGrid>
              {visibleBackgroundTiles.map((tile, tileIndex) => (
                <PreviewButton
                  key={`screen-mode-bg-dialog-tile-${tileIndex}`}
                  type="button"
                  aria-label={`BGタイルプレビュー ${tileIndex}`}
                  onClick={() => {
                    onTileSelect(tileIndex);
                  }}
                >
                  <PreviewButtonLayout>
                    <BackgroundTilePreview
                      scale={8}
                      tile={tile}
                      palette={nes.backgroundPalettes[activePaletteIndex]}
                      universalBackgroundColor={nes.universalBackgroundColor}
                    />
                    <strong>{`#${String(tileIndex).padStart(3, "0")}`}</strong>
                  </PreviewButtonLayout>
                </PreviewButton>
              ))}
            </PreviewGrid>
          ) : (
            <DialogToolbar>
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
            </DialogToolbar>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};
