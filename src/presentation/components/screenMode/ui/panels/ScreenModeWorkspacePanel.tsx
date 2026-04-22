import React from "react";
import { useScreenModeWorkspaceBackgroundEditingState } from "../../logic/screenModeWorkspaceBackgroundEditingState";
import {
  useScreenModeBackgroundTilePickerState,
  useScreenModeProjectState,
} from "../../logic/useScreenModeProjectState";
import { useScreenModeViewportState } from "../../logic/useScreenModeViewportState";
import { ScreenModeBackgroundTilePickerDialog } from "../dialogs/ScreenModeBackgroundTilePickerDialog";
import { WarningList } from "../primitives/ScreenModePrimitives";
import { ScreenModeGestureWorkspace } from "./ScreenModeGestureWorkspace";
import styles from "./ScreenModeWorkspacePanel.module.css";

/**
 * スクリーン配置モードのワークスペース全体を描画します。
 * ファイルメニュー状態連携と上部操作列のオーケストレーションを担当します。
 */
export const ScreenModeWorkspacePanel: React.FC<Record<string, never>> = () => {
  const projectState = useScreenModeProjectState();
  const backgroundTilePickerState = useScreenModeBackgroundTilePickerState();
  const viewportState = useScreenModeViewportState();
  const backgroundEditingState = useScreenModeWorkspaceBackgroundEditingState();

  return (
    <section
      className={styles.root}
      role="region"
      aria-label="スクリーン配置ジェスチャーワークスペース"
    >
      <ScreenModeGestureWorkspace
        backgroundEditingState={backgroundEditingState}
        projectState={projectState}
        viewportState={viewportState}
      />

      <ScreenModeBackgroundTilePickerDialog
        actions={{
          onApplyPaletteSelection:
            backgroundEditingState.handleBackgroundPaletteSelect,
          onClose: backgroundEditingState.closeTilePicker,
          onPaletteSelect:
            backgroundEditingState.handlePickerPaletteIndexChange,
          onTileSelect: backgroundEditingState.handleBackgroundTileSelect,
        }}
        dialog={{
          activePaletteIndex: backgroundEditingState.activePaletteIndex,
          isOpen: backgroundEditingState.isPickerDialogOpen,
          pendingPaletteIndex: backgroundEditingState.pickerPaletteIndex,
          pickerMode: backgroundEditingState.pickerDialogMode,
        }}
        preview={{
          backgroundPalettes: backgroundTilePickerState.backgroundPalettes,
          universalBackgroundColor:
            backgroundTilePickerState.universalBackgroundColor,
          visibleBackgroundTiles:
            backgroundTilePickerState.visibleBackgroundTiles,
        }}
      />

      {projectState.scanReport.ok === false ? (
        <WarningList>
          {projectState.scanReport.errors.map((error) => (
            <div key={error} className={styles.warningRow}>
              <span className={styles.warningLabel}>警告</span>
              <span className={styles.warningText}>{error}</span>
            </div>
          ))}
        </WarningList>
      ) : (
        <></>
      )}
    </section>
  );
};
