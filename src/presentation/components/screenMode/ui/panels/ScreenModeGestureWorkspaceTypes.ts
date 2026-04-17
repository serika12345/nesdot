import * as O from "fp-ts/Option";
import React from "react";

export interface ScreenModeGestureWorkspaceDisplayState {
  isSpriteIndexVisible: boolean;
  isSpriteOutlineVisible: boolean;
}

export interface ScreenModeGestureWorkspaceBackgroundEditing {
  overlay: React.ReactElement;
  onClick: () => void;
  onPointerDown: (position: { x: number; y: number }, button: number) => void;
  onPointerMove: (position: { x: number; y: number }, buttons: number) => void;
  onPointerUp: () => void;
}

export interface ScreenModeStageViewportUiState {
  backgroundEditing: O.Option<ScreenModeGestureWorkspaceBackgroundEditing>;
  displayState: ScreenModeGestureWorkspaceDisplayState;
  handleKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
}

export interface ScreenModeWorkspaceHeaderSummary {
  selectedSpriteCount: number;
  spriteCount: number;
  zoomLevel: number;
}

export interface ScreenModeWorkspaceZoomActions {
  handleZoomIn: () => void;
  handleZoomOut: () => void;
}
