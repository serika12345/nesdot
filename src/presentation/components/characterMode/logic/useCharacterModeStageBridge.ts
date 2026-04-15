import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useRef } from "react";
import { CHARACTER_MODE_STAGE_LIMITS } from "./characterModeConstants";
import { useCharacterModeStore } from "./characterModeStore";
import { clamp } from "./geometry/characterModeBounds";
import { trySetPointerCapture } from "./input/pointerCapture";
import {
  resolveCharacterStagePoint,
  resolveCharacterStageScale,
} from "./model/characterEditorModel";

interface ResolveStagePointArgs {
  readonly clientX: number;
  readonly clientY: number;
  readonly maxX?: number;
  readonly maxY?: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
}

export interface CharacterModeStageBridge {
  readonly focusStageElement: () => void;
  readonly getStageRect: () => O.Option<DOMRect>;
  readonly handleStageRef: (element: HTMLDivElement | null) => void;
  readonly handleViewportPointerDown: React.PointerEventHandler<HTMLDivElement>;
  readonly handleViewportPointerEnd: React.PointerEventHandler<HTMLDivElement>;
  readonly handleViewportPointerMove: React.PointerEventHandler<HTMLDivElement>;
  readonly handleViewportRef: (element: HTMLDivElement | null) => void;
  readonly handleViewportWheel: React.WheelEventHandler<HTMLDivElement>;
  readonly resolveStagePoint: (
    args: ResolveStagePointArgs,
  ) => O.Option<{ x: number; y: number }>;
}

/**
 * DOM ref とビューポートイベントを保持し、zustand store のアクションを呼び出すブリッジフック。
 * stage / viewport 要素の ref, focus, rect 読み取り, パン操作, ホイールズームを担当します。
 */
export const useCharacterModeStageBridge = (): CharacterModeStageBridge => {
  const stageElementRef = useRef<O.Option<HTMLDivElement>>(O.none);
  const viewportElementRef = useRef<O.Option<HTMLDivElement>>(O.none);

  const handleStageRef = useCallback((element: HTMLDivElement | null) => {
    stageElementRef.current = O.fromNullable(element);
  }, []);

  const handleViewportRef = useCallback((element: HTMLDivElement | null) => {
    viewportElementRef.current = O.fromNullable(element);
  }, []);

  const focusStageElement = useCallback(() => {
    pipe(
      stageElementRef.current,
      O.map((stageElement) => stageElement.focus()),
    );
  }, []);

  const getStageRect = useCallback(
    (): O.Option<DOMRect> =>
      pipe(
        stageElementRef.current,
        O.map((stage) => stage.getBoundingClientRect()),
      ),
    [],
  );

  const resolveStagePoint = useCallback(
    (args: ResolveStagePointArgs): O.Option<{ x: number; y: number }> => {
      const { stageWidth, stageHeight, stageZoomLevel } =
        useCharacterModeStore.getState();
      const stageScale = resolveCharacterStageScale(
        stageWidth,
        stageHeight,
        stageZoomLevel,
      );

      return pipe(
        getStageRect(),
        O.map((stageRect) =>
          resolveCharacterStagePoint({
            clientX: args.clientX,
            clientY: args.clientY,
            stageLeft: stageRect.left,
            stageTop: stageRect.top,
            stageScale,
            offsetX: args.offsetX ?? 0,
            offsetY: args.offsetY ?? 0,
            minX: 0,
            maxX: args.maxX ?? stageWidth - 1,
            minY: 0,
            maxY: args.maxY ?? stageHeight - 1,
          }),
        ),
      );
    },
    [getStageRect],
  );

  const handleViewportPointerDown = useCallback<
    React.PointerEventHandler<HTMLDivElement>
  >((event) => {
    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
    useCharacterModeStore.getState().setViewportPanState(
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
  >((event) => {
    const { viewportPanState } = useCharacterModeStore.getState();

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
  }, []);

  const handleViewportPointerEnd = useCallback<
    React.PointerEventHandler<HTMLDivElement>
  >((event) => {
    const { viewportPanState } = useCharacterModeStore.getState();

    if (O.isNone(viewportPanState)) {
      return;
    }

    if (viewportPanState.value.pointerId !== event.pointerId) {
      return;
    }

    useCharacterModeStore.getState().setViewportPanState(O.none);
  }, []);

  const handleViewportWheel = useCallback<
    React.WheelEventHandler<HTMLDivElement>
  >((event) => {
    if (event.ctrlKey === false) {
      return;
    }

    event.preventDefault();

    const { stageWidth, stageHeight, stageZoomLevel } =
      useCharacterModeStore.getState();
    const nextZoomLevel =
      event.deltaY < 0 ? stageZoomLevel + 1 : stageZoomLevel - 1;
    const clampedZoomLevel = clamp(
      nextZoomLevel,
      CHARACTER_MODE_STAGE_LIMITS.minZoomLevel,
      CHARACTER_MODE_STAGE_LIMITS.maxZoomLevel,
    );

    if (clampedZoomLevel === stageZoomLevel) {
      return;
    }

    useCharacterModeStore.getState().setStageZoomLevel(clampedZoomLevel);

    pipe(
      viewportElementRef.current,
      O.map((viewportElement) => {
        const rect = viewportElement.getBoundingClientRect();
        const relativeX = event.clientX - rect.left;
        const relativeY = event.clientY - rect.top;
        const currentStageX = viewportElement.scrollLeft + relativeX;
        const currentStageY = viewportElement.scrollTop + relativeY;
        const currentScale = resolveCharacterStageScale(
          stageWidth,
          stageHeight,
          stageZoomLevel,
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
  }, []);

  return {
    focusStageElement,
    getStageRect,
    handleStageRef,
    handleViewportPointerDown,
    handleViewportPointerEnd,
    handleViewportPointerMove,
    handleViewportRef,
    handleViewportWheel,
    resolveStagePoint,
  };
};
