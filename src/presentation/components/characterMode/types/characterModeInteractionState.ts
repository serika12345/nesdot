import { type FabricObject } from "fabric";

export interface LibraryDragState {
  spriteIndex: number;
  pointerId: number;
  clientX: number;
  clientY: number;
  isOverStage: boolean;
  stageX: number;
  stageY: number;
}

export interface ViewportPanState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startScrollLeft: number;
  startScrollTop: number;
}

export interface DecompositionDrawState {
  pointerId: number;
}

export interface DecompositionRegionDragState {
  regionId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

export interface SpriteContextMenuState {
  clientX: number;
  clientY: number;
  spriteEditorIndex: number;
}

export interface DecompositionRegionContextMenuState {
  clientX: number;
  clientY: number;
  regionId: string;
}

export interface FabricSpriteObjectEntry {
  index: number;
  object: FabricObject;
}
