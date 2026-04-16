import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import React from "react";
import { type ScreenModeWorkspaceBackgroundEditingStateResult } from "../../../logic/screenModeWorkspaceBackgroundEditingState";
import {
  WorkspaceHeaderActionCluster,
  ZoomControlsRow,
} from "../../primitives/ScreenModePrimitives";
import {
  type ScreenModeGestureWorkspaceDisplayState,
  type ScreenModeWorkspaceHeaderSummary,
  type ScreenModeWorkspaceZoomActions,
} from "./types";

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
  <Stack component="label" direction="row" alignItems="center" spacing={0.5}>
    <Typography component="span" variant="body2">
      {label}
    </Typography>
    <Switch
      size="small"
      color="primary"
      checked={checked}
      slotProps={{
        input: {
          "aria-label": inputLabel,
        },
      }}
      onChange={(_event, nextChecked) => onChange(nextChecked)}
    />
  </Stack>
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
    <Chip size="small" variant="outlined" label={`${summary.zoomLevel}x`} />
    <Button
      type="button"
      size="small"
      variant="outlined"
      aria-label="画面ズーム縮小"
      onClick={zoomActions.handleZoomOut}
    >
      -
    </Button>
    <Button
      type="button"
      size="small"
      variant="outlined"
      aria-label="画面ズーム拡大"
      onClick={zoomActions.handleZoomIn}
    >
      +
    </Button>
    <Chip
      size="small"
      variant="outlined"
      label={`${summary.spriteCount} sprites`}
    />
    <Chip
      size="small"
      color="primary"
      label={`${summary.selectedSpriteCount} selected`}
    />
    <Box flex="1 1 auto" minWidth="0.75rem" />
    <WorkspaceHeaderActionCluster>
      <Button
        type="button"
        size="small"
        variant="contained"
        aria-label="BGタイル追加"
        onClick={backgroundEditingState.openTilePicker}
      >
        BGタイル追加
      </Button>
      <Button
        type="button"
        size="small"
        variant="outlined"
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
