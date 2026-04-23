import { Button, Dialog, Flex } from "@radix-ui/themes";
import React from "react";
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
  const titleId = React.useId();

  const dialogContent =
    pickerMode === "bgTile" ? (
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
          <Button
            key={`screen-mode-dialog-bg-palette-${paletteIndex}`}
            color={pendingPaletteIndex === paletteIndex ? "teal" : "gray"}
            size="1"
            variant={pendingPaletteIndex === paletteIndex ? "solid" : "outline"}
            aria-label={`BGパレット ${paletteIndex}`}
            aria-pressed={pendingPaletteIndex === paletteIndex}
            onClick={() => {
              actions.onPaletteSelect(paletteIndex);
            }}
          >
            {`Palette ${paletteIndex}`}
          </Button>
        ))}
      </div>
    );

  if (typeof document === "undefined") {
    if (isOpen === false) {
      return <></>;
    }

    return (
      <div aria-labelledby={titleId} aria-modal="true" role="dialog">
        <h2 id={titleId}>{resolveDialogTitle(pickerMode)}</h2>
        {dialogContent}
        <div>
          <Button color="gray" variant="outline">
            閉じる
          </Button>
          {pickerMode === "bgPalette" ? (
            <Button color="teal" variant="solid">
              変更する
            </Button>
          ) : (
            <></>
          )}
        </div>
      </div>
    );
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (open === true) {
          return;
        }

        actions.onClose();
      }}
    >
      <Dialog.Content
        maxWidth={resolveDialogSize(pickerMode) === "large" ? "56rem" : "28rem"}
      >
        <Dialog.Title>{resolveDialogTitle(pickerMode)}</Dialog.Title>
        {dialogContent}
        <Flex gap="3" justify="end" mt="4" wrap="wrap">
          <Button color="gray" variant="outline" onClick={actions.onClose}>
            閉じる
          </Button>
          {pickerMode === "bgPalette" ? (
            <Button
              color="teal"
              variant="solid"
              onClick={actions.onApplyPaletteSelection}
            >
              変更する
            </Button>
          ) : (
            <></>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
