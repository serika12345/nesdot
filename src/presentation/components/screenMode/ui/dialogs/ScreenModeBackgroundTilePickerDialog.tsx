import React from "react";
import { AppButton, AppDialog } from "../../../common/ui/forms/AppControls";
import {
  type NesBackgroundPalettes,
  type NesColorIndex,
} from "../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../domain/project/projectV2";
import { BackgroundTilePreview } from "../../../common/ui/preview/BackgroundTilePreview";
import styles from "./ScreenModeBackgroundTilePickerDialog.module.css";

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

const resolveDialogSize = (pickerMode: BgPickerMode): "large" | "small" => {
  if (pickerMode === "bgTile") {
    return "large";
  }

  return "small";
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
    <AppDialog
      actions={
        <>
          <AppButton variant="outline" onClick={actions.onClose}>
            閉じる
          </AppButton>
          {pickerMode === "bgPalette" ? (
            <AppButton
              tone="accent"
              variant="solid"
              onClick={actions.onApplyPaletteSelection}
            >
              変更する
            </AppButton>
          ) : (
            <></>
          )}
        </>
      }
      open={isOpen}
      size={resolveDialogSize(pickerMode)}
      title={resolveDialogTitle(pickerMode)}
      onClose={actions.onClose}
    >
      {pickerMode === "bgTile" ? (
        <div className={styles.tileGrid}>
          {preview.visibleBackgroundTiles.map((tile, tileIndex) => (
            <button
              key={`screen-mode-bg-dialog-tile-${tileIndex}`}
              className={styles.tileButton}
              type="button"
              aria-label={`BGタイルプレビュー ${tileIndex}`}
              onClick={() => {
                actions.onTileSelect(tileIndex);
              }}
            >
              <span className={styles.tileButtonContent}>
                <BackgroundTilePreview
                  scale={8}
                  tile={tile}
                  palette={preview.backgroundPalettes[activePaletteIndex]}
                  universalBackgroundColor={preview.universalBackgroundColor}
                />
                <strong className={styles.tileLabel}>
                  {`#${String(tileIndex).padStart(3, "0")}`}
                </strong>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.paletteRow}>
          {BG_PALETTE_OPTIONS.map((paletteIndex) => (
            <AppButton
              key={`screen-mode-dialog-bg-palette-${paletteIndex}`}
              size="small"
              variant={
                pendingPaletteIndex === paletteIndex ? "solid" : "outline"
              }
              tone={pendingPaletteIndex === paletteIndex ? "accent" : "neutral"}
              aria-label={`BGパレット ${paletteIndex}`}
              aria-pressed={pendingPaletteIndex === paletteIndex}
              onClick={() => {
                actions.onPaletteSelect(paletteIndex);
              }}
            >
              {`Palette ${paletteIndex}`}
            </AppButton>
          ))}
        </div>
      )}
    </AppDialog>
  );
};
