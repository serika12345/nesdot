import React from "react";
import { Badge, Button, Switch } from "@radix-ui/themes";
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
    <Switch
      aria-label={inputLabel}
      checked={checked}
      onCheckedChange={onChange}
      color="teal"
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
    <Badge color="gray" size="2" variant="surface">
      {`${summary.zoomLevel}x`}
    </Badge>
    <Button
      color="gray"
      size="1"
      variant="outline"
      aria-label="画面ズーム縮小"
      onClick={zoomActions.handleZoomOut}
    >
      -
    </Button>
    <Button
      color="gray"
      size="1"
      variant="outline"
      aria-label="画面ズーム拡大"
      onClick={zoomActions.handleZoomIn}
    >
      +
    </Button>
    <Badge color="gray" size="2" variant="surface">
      {`${summary.spriteCount} sprites`}
    </Badge>
    <Badge color="teal" size="2" variant="surface">
      {`${summary.selectedSpriteCount} selected`}
    </Badge>
    <div className={styles.spacer} />
    <WorkspaceHeaderActionCluster>
      <Button
        color="teal"
        size="1"
        variant="solid"
        aria-label="BGタイル追加"
        onClick={backgroundEditingState.openTilePicker}
      >
        BGタイル追加
      </Button>
      <Button
        color="gray"
        size="1"
        variant="outline"
        aria-label="BGパレット変更"
        onClick={backgroundEditingState.openPalettePicker}
      >
        BGパレット変更
      </Button>
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
