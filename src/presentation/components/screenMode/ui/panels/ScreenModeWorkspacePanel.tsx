import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
    <Stack
      component={Paper}
      variant="outlined"
      flex={1}
      minHeight={0}
      role="region"
      aria-label="スクリーン配置ジェスチャーワークスペース"
      spacing="0.875rem"
      p="1.125rem"
      useFlexGap
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
            <Stack
              key={error}
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={1}
            >
              <Typography variant="body2" color="text.secondary">
                警告
              </Typography>
              <Typography variant="body2">{error}</Typography>
            </Stack>
          ))}
        </WarningList>
      ) : (
        <></>
      )}
    </Stack>
  );
};
