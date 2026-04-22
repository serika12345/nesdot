import React from "react";
import { type PaletteIndex } from "../../../../../application/state/projectStore";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../domain/project/projectV2";
import { SurfaceCard } from "../../../common/ui/chrome/SurfaceCard";
import { AppButton } from "../../../common/ui/forms/AppControls";
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
            <AppButton
              key={`bg-tile-preview-${tileIndex}`}
              type="button"
              tone={
                libraryPanelState.selectedTileIndex === tileIndex
                  ? "accent"
                  : "neutral"
              }
              variant={
                libraryPanelState.selectedTileIndex === tileIndex
                  ? "solid"
                  : "outline"
              }
              fullWidth
              aria-label={`#${formatTileNumber(tileIndex)}`}
              aria-pressed={libraryPanelState.selectedTileIndex === tileIndex}
              onClick={() => {
                libraryPanelState.handleSelectTile(tileIndex);
              }}
            >
              <span className={styles.tileButtonContent}>
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
              </span>
            </AppButton>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
};
