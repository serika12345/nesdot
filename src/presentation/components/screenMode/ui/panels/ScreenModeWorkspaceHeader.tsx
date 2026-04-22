import React from "react";
import {
  AppBadge,
  AppButton,
  AppSwitch,
} from "../../../common/ui/forms/AppControls";
import { type ScreenModeWorkspaceBackgroundEditingStateResult } from "../../logic/screenModeWorkspaceBackgroundEditingState";
import {
  WorkspaceHeaderActionCluster,
  ZoomControlsRow,
} from "../primitives/ScreenModePrimitives";
import styles from "./ScreenModeWorkspaceHeader.module.css";
import {
  type ScreenModeGestureWorkspaceDisplayState,
  type ScreenModeWorkspaceHeaderSummary,
  type ScreenModeWorkspaceZoomActions,
} from "./ScreenModeGestureWorkspaceTypes";

interface ScreenModeDisplaySwitchProps {
  checked: boolean;
  inputLabel: string;
  label: string;
  onChange: (checked: boolean) => void;
}

interface ScreenModeWorkspaceHeaderProps {
  backgroundEditingState: ScreenModeWorkspaceBackgroundEditingStateResult;
  displayState: ScreenModeGestureWorkspaceDisplayState;
  onDisplayStateChange: (
    nextState: ScreenModeGestureWorkspaceDisplayState,
  ) => void;
  summary: ScreenModeWorkspaceHeaderSummary;
  zoomActions: ScreenModeWorkspaceZoomActions;
}

const ScreenModeDisplaySwitch: React.FC<ScreenModeDisplaySwitchProps> = ({
  checked,
  inputLabel,
  label,
  onChange,
}) => (
  <label className={styles.switchLabel}>
    <span>{label}</span>
    <AppSwitch
      aria-label={inputLabel}
      checked={checked}
      onCheckedChange={onChange}
    />
  </label>
);

export const ScreenModeWorkspaceHeader: React.FC<
  ScreenModeWorkspaceHeaderProps
> = ({
  backgroundEditingState,
  displayState,
  onDisplayStateChange,
  summary,
  zoomActions,
}) => (
  <ZoomControlsRow>
    <AppBadge>{`${summary.zoomLevel}x`}</AppBadge>
    <AppButton
      size="small"
      variant="outline"
      aria-label="画面ズーム縮小"
      onClick={zoomActions.handleZoomOut}
    >
      -
    </AppButton>
    <AppButton
      size="small"
      variant="outline"
      aria-label="画面ズーム拡大"
      onClick={zoomActions.handleZoomIn}
    >
      +
    </AppButton>
    <AppBadge>{`${summary.spriteCount} sprites`}</AppBadge>
    <AppBadge tone="accent">{`${summary.selectedSpriteCount} selected`}</AppBadge>
    <div className={styles.spacer} />
    <WorkspaceHeaderActionCluster>
      <AppButton
        size="small"
        tone="accent"
        variant="solid"
        aria-label="BGタイル追加"
        onClick={backgroundEditingState.openTilePicker}
      >
        BGタイル追加
      </AppButton>
      <AppButton
        size="small"
        variant="outline"
        aria-label="BGパレット変更"
        onClick={backgroundEditingState.openPalettePicker}
      >
        BGパレット変更
      </AppButton>
      <ScreenModeDisplaySwitch
        checked={displayState.isSpriteOutlineVisible}
        inputLabel="スプライト外枠表示切り替え"
        label="外枠"
        onChange={(isSpriteOutlineVisible) =>
          onDisplayStateChange({
            ...displayState,
            isSpriteOutlineVisible,
          })
        }
      />
      <ScreenModeDisplaySwitch
        checked={displayState.isSpriteIndexVisible}
        inputLabel="スプライト番号表示切り替え"
        label="#表示"
        onChange={(isSpriteIndexVisible) =>
          onDisplayStateChange({
            ...displayState,
            isSpriteIndexVisible,
          })
        }
      />
    </WorkspaceHeaderActionCluster>
  </ZoomControlsRow>
);
