import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useMemo, useRef, useState } from "react";
import { clamp } from "../geometry/characterModeBounds";
import { trySetPointerCapture } from "../input/pointerCapture";
import {
  resolveCharacterStagePoint,
  resolveCharacterStageScale,
} from "../model/characterEditorModel";
import { type ViewportPanState } from "../types/characterModeInteractionState";
import { CHARACTER_MODE_STAGE_LIMITS } from "./characterModeConstants";

interface ResolveStagePointArgs {
  clientX: number;
  clientY: number;
  maxX?: number;
  maxY?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface CharacterModeStageStateResult {
  focusStageElement: () => void;
  getStageRect: () => O.Option<DOMRect>;
  handleStageRef: (element: HTMLDivElement | null) => void;
  handleViewportPointerDown: React.PointerEventHandler<HTMLDivElement>;
  handleViewportPointerEnd: React.PointerEventHandler<HTMLDivElement>;
  handleViewportPointerMove: React.PointerEventHandler<HTMLDivElement>;
  handleViewportRef: (element: HTMLDivElement | null) => void;
  handleViewportWheel: React.WheelEventHandler<HTMLDivElement>;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  resolveStagePoint: (
    args: ResolveStagePointArgs,
  ) => O.Option<{ x: number; y: number }>;
  setStageHeightValue: (nextHeight: number) => void;
  setStageWidthValue: (nextWidth: number) => void;
  stageHeight: number;
  stageScale: number;
  stageWidth: number;
  stageZoomLevel: number;
  viewportPanState: O.Option<ViewportPanState>;
}

export const useCharacterModeStageState = (): CharacterModeStageStateResult => {
  const [stageWidth, setStageWidth] = useState(
    CHARACTER_MODE_STAGE_LIMITS.initialWidth,
  );
  const [stageHeight, setStageHeight] = useState(
    CHARACTER_MODE_STAGE_LIMITS.initialHeight,
  );
  const [stageZoomLevel, setStageZoomLevel] = useState(
    CHARACTER_MODE_STAGE_LIMITS.defaultZoomLevel,
  );
  const [viewportPanState, setViewportPanState] = useState<
    O.Option<ViewportPanState>
  >(O.none);

  const stageElementRef = useRef<O.Option<HTMLDivElement>>(O.none);
  const viewportElementRef = useRef<O.Option<HTMLDivElement>>(O.none);

  const stageScale = useMemo(
    () => resolveCharacterStageScale(stageWidth, stageHeight, stageZoomLevel),
    [stageHeight, stageWidth, stageZoomLevel],
  );

  const handleStageRef = useCallback((element: HTMLDivElement | null) => {
    stageElementRef.current = O.fromNullable(element);
  }, []);

  const focusStageElement = useCallback(() => {
    pipe(
      stageElementRef.current,
      O.map((stageElement) => stageElement.focus()),
    );
  }, []);

  const handleViewportRef = useCallback((element: HTMLDivElement | null) => {
    viewportElementRef.current = O.fromNullable(element);
  }, []);

  const getStageRect = useCallback(
    (): O.Option<DOMRect> =>
      pipe(
        stageElementRef.current,
        O.map((stage) => stage.getBoundingClientRect()),
      ),
    [],
  );

  const getViewportElement = useCallback(
    (): O.Option<HTMLDivElement> => viewportElementRef.current,
    [],
  );

  const resolveStagePoint = useCallback(
    ({
      clientX,
      clientY,
      maxX = stageWidth - 1,
      maxY = stageHeight - 1,
      offsetX = 0,
      offsetY = 0,
    }: ResolveStagePointArgs): O.Option<{ x: number; y: number }> =>
      pipe(
        getStageRect(),
        O.map((stageRect) =>
          resolveCharacterStagePoint({
            clientX,
            clientY,
            stageLeft: stageRect.left,
            stageTop: stageRect.top,
            stageScale,
            offsetX,
            offsetY,
            minX: 0,
            maxX,
            minY: 0,
            maxY,
          }),
        ),
      ),
    [getStageRect, stageHeight, stageScale, stageWidth],
  );

  const updateStageZoomLevel = useCallback(
    (
      nextZoomLevel: number,
      anchor: O.Option<{ clientX: number; clientY: number }> = O.none,
    ) => {
      setStageZoomLevel((current) => {
        const clampedZoomLevel = clamp(
          nextZoomLevel,
          CHARACTER_MODE_STAGE_LIMITS.minZoomLevel,
          CHARACTER_MODE_STAGE_LIMITS.maxZoomLevel,
        );

        if (clampedZoomLevel === current) {
          return current;
        }

        if (O.isSome(anchor)) {
          pipe(
            getViewportElement(),
            O.map((viewportElement) => {
              const rect = viewportElement.getBoundingClientRect();
              const relativeX = anchor.value.clientX - rect.left;
              const relativeY = anchor.value.clientY - rect.top;
              const currentStageX = viewportElement.scrollLeft + relativeX;
              const currentStageY = viewportElement.scrollTop + relativeY;
              const currentScale = resolveCharacterStageScale(
                stageWidth,
                stageHeight,
                current,
              );
              const nextScale = resolveCharacterStageScale(
                stageWidth,
                stageHeight,
                clampedZoomLevel,
              );

              window.requestAnimationFrame(() => {
                viewportElement.scrollTo({
                  left: (currentStageX / currentScale) * nextScale - relativeX,
                  top: (currentStageY / currentScale) * nextScale - relativeY,
                });
              });
            }),
          );
        }

        return clampedZoomLevel;
      });
    },
    [getViewportElement, stageHeight, stageWidth],
  );

  const handleZoomOut = useCallback(() => {
    updateStageZoomLevel(stageZoomLevel - 1, O.none);
  }, [stageZoomLevel, updateStageZoomLevel]);

  const handleZoomIn = useCallback(() => {
    updateStageZoomLevel(stageZoomLevel + 1, O.none);
  }, [stageZoomLevel, updateStageZoomLevel]);

  const handleViewportWheel = useCallback<
    React.WheelEventHandler<HTMLDivElement>
  >(
    (event) => {
      if (event.ctrlKey === false) {
        return;
      }

      event.preventDefault();
      updateStageZoomLevel(
        event.deltaY < 0 ? stageZoomLevel + 1 : stageZoomLevel - 1,
        O.some({ clientX: event.clientX, clientY: event.clientY }),
      );
    },
    [stageZoomLevel, updateStageZoomLevel],
  );

  const handleViewportPointerDown = useCallback<
    React.PointerEventHandler<HTMLDivElement>
  >((event) => {
    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
    setViewportPanState(
      O.some({
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startScrollLeft: event.currentTarget.scrollLeft,
        startScrollTop: event.currentTarget.scrollTop,
      }),
    );
    trySetPointerCapture(event.currentTarget, event.pointerId);
  }, []);

  const handleViewportPointerMove = useCallback<
    React.PointerEventHandler<HTMLDivElement>
  >(
    (event) => {
      if (O.isNone(viewportPanState)) {
        return;
      }

      if (viewportPanState.value.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - viewportPanState.value.startClientX;
      const deltaY = event.clientY - viewportPanState.value.startClientY;
      event.currentTarget.scrollTo({
        left: viewportPanState.value.startScrollLeft - deltaX,
        top: viewportPanState.value.startScrollTop - deltaY,
      });
    },
    [viewportPanState],
  );

  const handleViewportPointerEnd = useCallback<
    React.PointerEventHandler<HTMLDivElement>
  >(
    (event) => {
      if (O.isNone(viewportPanState)) {
        return;
      }

      if (viewportPanState.value.pointerId !== event.pointerId) {
        return;
      }

      setViewportPanState(O.none);
    },
    [viewportPanState],
  );

  return {
    focusStageElement,
    getStageRect,
    handleStageRef,
    handleViewportPointerDown,
    handleViewportPointerEnd,
    handleViewportPointerMove,
    handleViewportRef,
    handleViewportWheel,
    handleZoomIn,
    handleZoomOut,
    resolveStagePoint,
    setStageHeightValue: setStageHeight,
    setStageWidthValue: setStageWidth,
    stageHeight,
    stageScale,
    stageWidth,
    stageZoomLevel,
    viewportPanState,
  };
};
