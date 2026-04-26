import React from "react";
import { Button } from "@radix-ui/themes";
import { type PaletteIndex } from "../../../../../application/state/projectStore";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../domain/project/projectV2";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import { BackgroundTilePreview } from "../../../common/ui/preview/BackgroundTilePreview";
import styles from "./BgModePanels.module.css";

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

interface BgModeLibraryTileButtonState {
  activePaletteIndex: PaletteIndex;
  backgroundPalettes: ReadonlyArray<NesSubPalette>;
  isSelected: boolean;
  tile: BackgroundTile;
  tileIndex: number;
  universalBackgroundColor: NesColorIndex;
}

interface BgModeLibraryTileButtonProps {
  handleSelectTile: (tileIndex: number) => void;
  tileButtonState: BgModeLibraryTileButtonState;
}

const areSameBgModeLibraryTileButtonProps = (
  previous: BgModeLibraryTileButtonProps,
  next: BgModeLibraryTileButtonProps,
): boolean =>
  previous.handleSelectTile === next.handleSelectTile &&
  previous.tileButtonState.activePaletteIndex ===
    next.tileButtonState.activePaletteIndex &&
  previous.tileButtonState.backgroundPalettes ===
    next.tileButtonState.backgroundPalettes &&
  previous.tileButtonState.isSelected === next.tileButtonState.isSelected &&
  previous.tileButtonState.tile === next.tileButtonState.tile &&
  previous.tileButtonState.tileIndex === next.tileButtonState.tileIndex &&
  previous.tileButtonState.universalBackgroundColor ===
    next.tileButtonState.universalBackgroundColor;

const BgModeLibraryTileButtonComponent: React.FC<
  BgModeLibraryTileButtonProps
> = ({ handleSelectTile, tileButtonState }) => (
  <Button
    className={styles.tileButton}
    type="button"
    color={tileButtonState.isSelected ? "teal" : "gray"}
    size="1"
    variant={tileButtonState.isSelected ? "solid" : "surface"}
    style={{
      width: "100%",
      alignItems: "stretch",
      justifyContent: "flex-start",
      minHeight: "6rem",
      padding: "0.75rem",
      whiteSpace: "normal",
    }}
    aria-label={`#${formatTileNumber(tileButtonState.tileIndex)}`}
    aria-pressed={tileButtonState.isSelected}
    onClick={() => {
      handleSelectTile(tileButtonState.tileIndex);
    }}
  >
    <span className={styles.tileButtonContent}>
      <BackgroundTilePreview
        scale={6}
        tile={tileButtonState.tile}
        palette={resolveActivePalette(
          tileButtonState.backgroundPalettes,
          tileButtonState.activePaletteIndex,
        )}
        universalBackgroundColor={tileButtonState.universalBackgroundColor}
      />
      <span>{`#${formatTileNumber(tileButtonState.tileIndex)}`}</span>
    </span>
  </Button>
);

const BgModeLibraryTileButton = React.memo(
  BgModeLibraryTileButtonComponent,
  areSameBgModeLibraryTileButtonProps,
);

/**
 * BG タイル一覧の panel です。
 * 選択状態と preview 表示だけを扱います。
 */
export const BgModeLibraryPanel: React.FC<BgModeLibraryPanelProps> = ({
  libraryPanelState,
}) => {
  return (
    <SurfaceCard
      className={`${styles.panel} ${styles.libraryPanel}`}
      role="region"
      aria-label="BGタイル一覧"
    >
      <div className={styles.headingWrap}>
        <h2 className={styles.heading}>BG編集</h2>
      </div>

      <div className={styles.scrollArea}>
        <div className={styles.tileGrid}>
          {libraryPanelState.tiles.map((tile, tileIndex) => (
            <BgModeLibraryTileButton
              key={`bg-tile-preview-${tileIndex}`}
              handleSelectTile={libraryPanelState.handleSelectTile}
              tileButtonState={{
                activePaletteIndex: libraryPanelState.activePaletteIndex,
                backgroundPalettes: libraryPanelState.backgroundPalettes,
                isSelected: libraryPanelState.selectedTileIndex === tileIndex,
                tile,
                tileIndex,
                universalBackgroundColor:
                  libraryPanelState.universalBackgroundColor,
              }}
            />
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
};
