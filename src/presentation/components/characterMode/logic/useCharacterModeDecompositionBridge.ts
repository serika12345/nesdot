import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useEffect, useState } from "react";
import { useProjectState } from "../../../../application/state/projectStore";
import type { CharacterDecompositionRegion } from "../../../../domain/characters/characterDecomposition";
import { useCharacterModeDecompositionStore } from "./characterModeDecompositionStore";
import { useCharacterModeProjectStore } from "./characterModeProjectStore";
import { useCharacterModeStageStore } from "./characterModeStageStore";
import { createDecompositionCanvasRgba } from "./decomposition/decompositionCanvas";
import { trySetPointerCapture } from "./input/pointerCapture";
import { resolveCharacterStageScale } from "./model/characterEditorModel";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface CharacterModeDecompositionBridge {
  readonly handleDecompositionCanvasPointerDown: React.PointerEventHandler<HTMLCanvasElement>;
  readonly handleDecompositionCanvasRef: (
    element: HTMLCanvasElement | null,
  ) => void;
  readonly handleDecompositionRegionContextMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    region: CharacterDecompositionRegion,
  ) => void;
  readonly handleDecompositionRegionPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    region: CharacterDecompositionRegion,
  ) => void;
  readonly handleDecompositionWorkspacePointerEnd: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
  readonly handleDecompositionWorkspacePointerMove: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
}

// ---------------------------------------------------------------------------
// Pure helper — resolve a point on the decomposition stage from client coords
// ---------------------------------------------------------------------------

const resolveDecompositionPoint = (
  clientX: number,
  clientY: number,
  getStageRect: () => O.Option<DOMRect>,
  offsetX: number,
  offsetY: number,
  maxX: number,
  maxY: number,
): O.Option<{ x: number; y: number }> => {
  const { stageWidth, stageHeight, stageZoomLevel } =
    useCharacterModeStageStore.getState();
  const stageScale = resolveCharacterStageScale(
    stageWidth,
    stageHeight,
    stageZoomLevel,
  );

  return pipe(
    getStageRect(),
    O.map((stageRect) => ({
      x: Math.round((clientX - stageRect.left - offsetX) / stageScale),
      y: Math.round((clientY - stageRect.top - offsetY) / stageScale),
    })),
    O.map((point) => ({
      x: Math.min(Math.max(point.x, 0), maxX),
      y: Math.min(Math.max(point.y, 0), maxY),
    })),
  );
};

// ---------------------------------------------------------------------------
// Bridge hook
// ---------------------------------------------------------------------------

/**
 * 分解モードの Canvas2D 描画と DOM イベントハンドラを管理するブリッジフック。
 * focused store 群を参照しつつ、Canvas 要素の ref のみこのフック内に保持します。
 */
export const useCharacterModeDecompositionBridge = (
  getStageRect: () => O.Option<DOMRect>,
): CharacterModeDecompositionBridge => {
  // ---------------------------------------------------------------------------
  // Local DOM state
  // ---------------------------------------------------------------------------

  const [decompositionCanvasElement, setDecompositionCanvasElement] = useState<
    O.Option<HTMLCanvasElement>
  >(O.none);

  // ---------------------------------------------------------------------------
  // Reactive subscriptions (drive canvas rendering effect)
  // ---------------------------------------------------------------------------

  const decompositionCanvas = useCharacterModeDecompositionStore(
    (s) => s.decompositionCanvas,
  );
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);

  // ---------------------------------------------------------------------------
  // Effect — paint decomposition pixels onto DOM canvas
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (O.isNone(decompositionCanvasElement)) {
      return;
    }

    const contextOption = O.fromNullable(
      decompositionCanvasElement.value.getContext("2d"),
    );
    if (O.isNone(contextOption)) {
      return;
    }

    const sourceWidth = decompositionCanvas.width;
    const sourceHeight = decompositionCanvas.height;
    const rgbaValues = createDecompositionCanvasRgba(
      decompositionCanvas,
      spritePalettes,
    );
    const imageData = new ImageData(rgbaValues, sourceWidth, sourceHeight);

    contextOption.value.clearRect(0, 0, sourceWidth, sourceHeight);
    contextOption.value.putImageData(imageData, 0, 0);
  }, [decompositionCanvas, decompositionCanvasElement, spritePalettes]);

  // ---------------------------------------------------------------------------
  // Stable callbacks (use getState() — no reactive deps)
  // ---------------------------------------------------------------------------

  const handleDecompositionCanvasRef = useCallback(
    (element: HTMLCanvasElement | null) => {
      setDecompositionCanvasElement(O.fromNullable(element));
    },
    [],
  );

  const handleDecompositionCanvasPointerDown = useCallback<
    React.PointerEventHandler<HTMLCanvasElement>
  >(
    (event) => {
      if (event.button !== 0) {
        return;
      }

      const stageStore = useCharacterModeStageStore.getState();
      const decompositionStore = useCharacterModeDecompositionStore.getState();
      decompositionStore.closeDecompositionRegionContextMenu();

      const { stageWidth, stageHeight } = stageStore;
      const { decompositionTool } = decompositionStore;
      const projectSpriteSize = useProjectState.getState().spriteSize;

      const maxX =
        decompositionTool === "region" ? stageWidth - 8 : stageWidth - 1;
      const maxY =
        decompositionTool === "region"
          ? stageHeight - projectSpriteSize
          : stageHeight - 1;

      const pointOption = resolveDecompositionPoint(
        event.clientX,
        event.clientY,
        getStageRect,
        0,
        0,
        maxX,
        maxY,
      );

      if (O.isNone(pointOption)) {
        return;
      }

      event.preventDefault();

      if (decompositionTool === "region") {
        useCharacterModeDecompositionStore
          .getState()
          .handlePlaceDecompositionRegion(
            pointOption.value.x,
            pointOption.value.y,
          );
        return;
      }

      useCharacterModeDecompositionStore
        .getState()
        .handlePaintDecompositionPixel(
          pointOption.value.x,
          pointOption.value.y,
        );
      useCharacterModeDecompositionStore
        .getState()
        .setDecompositionDrawState(O.some({ pointerId: event.pointerId }));
      trySetPointerCapture(event.currentTarget, event.pointerId);
    },
    [getStageRect],
  );

  const handleDecompositionRegionContextMenu = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement>,
      region: CharacterDecompositionRegion,
    ) => {
      if (useCharacterModeProjectStore.getState().editorMode !== "decompose") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const decompositionStore = useCharacterModeDecompositionStore.getState();
      decompositionStore.setSelectedRegionId(O.some(region.id));
      decompositionStore.setDecompositionRegionContextMenuState(
        O.some({
          clientX: event.clientX,
          clientY: event.clientY,
          regionId: region.id,
        }),
      );
    },
    [],
  );

  const handleDecompositionRegionPointerDown = useCallback(
    (
      event: React.PointerEvent<HTMLButtonElement>,
      region: CharacterDecompositionRegion,
    ) => {
      const { decompositionTool } =
        useCharacterModeDecompositionStore.getState();

      if (decompositionTool !== "region" || event.button !== 0) {
        return;
      }

      const stageRectOption = getStageRect();
      if (O.isNone(stageRectOption)) {
        return;
      }

      const { stageWidth, stageHeight, stageZoomLevel } =
        useCharacterModeStageStore.getState();
      const stageScale = resolveCharacterStageScale(
        stageWidth,
        stageHeight,
        stageZoomLevel,
      );

      event.preventDefault();
      const decompositionStore = useCharacterModeDecompositionStore.getState();
      decompositionStore.closeDecompositionRegionContextMenu();
      decompositionStore.setSelectedRegionId(O.some(region.id));
      decompositionStore.setDecompositionRegionDragState(
        O.some({
          regionId: region.id,
          pointerId: event.pointerId,
          offsetX:
            event.clientX -
            (stageRectOption.value.left + region.x * stageScale),
          offsetY:
            event.clientY - (stageRectOption.value.top + region.y * stageScale),
        }),
      );
      trySetPointerCapture(event.currentTarget, event.pointerId);
    },
    [getStageRect],
  );

  const handleDecompositionWorkspacePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const projectStore = useCharacterModeProjectStore.getState();
      const decompositionStore = useCharacterModeDecompositionStore.getState();
      const stageStore = useCharacterModeStageStore.getState();

      if (
        projectStore.editorMode === "decompose" &&
        O.isSome(decompositionStore.decompositionDrawState)
      ) {
        if (
          decompositionStore.decompositionDrawState.value.pointerId !==
          event.pointerId
        ) {
          return false;
        }

        const { stageWidth, stageHeight } = stageStore;
        const pointOption = resolveDecompositionPoint(
          event.clientX,
          event.clientY,
          getStageRect,
          0,
          0,
          stageWidth - 1,
          stageHeight - 1,
        );
        if (O.isNone(pointOption)) {
          return false;
        }

        useCharacterModeDecompositionStore
          .getState()
          .handlePaintDecompositionPixel(
            pointOption.value.x,
            pointOption.value.y,
          );
        return true;
      }

      if (
        projectStore.editorMode === "decompose" &&
        O.isSome(decompositionStore.decompositionRegionDragState)
      ) {
        if (
          decompositionStore.decompositionRegionDragState.value.pointerId !==
          event.pointerId
        ) {
          return false;
        }

        const projectSpriteSize = useProjectState.getState().spriteSize;
        const { stageWidth, stageHeight } = stageStore;
        const pointOption = resolveDecompositionPoint(
          event.clientX,
          event.clientY,
          getStageRect,
          decompositionStore.decompositionRegionDragState.value.offsetX,
          decompositionStore.decompositionRegionDragState.value.offsetY,
          stageWidth - 8,
          stageHeight - projectSpriteSize,
        );
        if (O.isNone(pointOption)) {
          return false;
        }

        useCharacterModeDecompositionStore
          .getState()
          .handleMoveDecompositionRegion(
            decompositionStore.decompositionRegionDragState.value.regionId,
            pointOption.value.x,
            pointOption.value.y,
          );
        return true;
      }

      return false;
    },
    [getStageRect],
  );

  const handleDecompositionWorkspacePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const decompositionStore = useCharacterModeDecompositionStore.getState();

      if (O.isSome(decompositionStore.decompositionDrawState)) {
        if (
          decompositionStore.decompositionDrawState.value.pointerId !==
          event.pointerId
        ) {
          return false;
        }

        useCharacterModeDecompositionStore
          .getState()
          .setDecompositionDrawState(O.none);
        return true;
      }

      if (O.isSome(decompositionStore.decompositionRegionDragState)) {
        if (
          decompositionStore.decompositionRegionDragState.value.pointerId !==
          event.pointerId
        ) {
          return false;
        }

        useCharacterModeDecompositionStore
          .getState()
          .setDecompositionRegionDragState(O.none);
        return true;
      }

      return false;
    },
    [],
  );

  return {
    handleDecompositionCanvasPointerDown,
    handleDecompositionCanvasRef,
    handleDecompositionRegionContextMenu,
    handleDecompositionRegionPointerDown,
    handleDecompositionWorkspacePointerEnd,
    handleDecompositionWorkspacePointerMove,
  };
};
