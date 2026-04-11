import * as O from "fp-ts/Option";
import { type PointerEvent, type WheelEvent, useRef, useState } from "react";

const SCREEN_MIN_ZOOM_LEVEL = 1;
const SCREEN_MAX_ZOOM_LEVEL = 8;
const SCREEN_DEFAULT_ZOOM_LEVEL = 2;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const trySetPointerCapture = (target: HTMLElement, pointerId: number): void => {
  try {
    target.setPointerCapture(pointerId);
  } catch {
    // Synthetic pointer events used in tests may not have a capturable pointer.
  }
};

interface ViewportAnchor {
  clientX: number;
  clientY: number;
}

export interface ViewportPanState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startScrollLeft: number;
  startScrollTop: number;
}

export interface ScreenModeViewportStateResult {
  screenZoomLevel: number;
  viewportPanState: O.Option<ViewportPanState>;
  setViewportRef: (element: HTMLDivElement | null) => void;
  handleZoomOut: () => void;
  handleZoomIn: () => void;
  handleViewportWheel: (event: WheelEvent<HTMLDivElement>) => void;
  handleViewportPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handleViewportPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  handleViewportPointerEnd: (event: PointerEvent<HTMLDivElement>) => void;
}

/**
 * `screenMode` のプレビュー表示域に閉じたズームとパンを扱います。
 */
export const useScreenModeViewportState = (): ScreenModeViewportStateResult => {
  const [screenZoomLevel, setScreenZoomLevel] = useState(
    SCREEN_DEFAULT_ZOOM_LEVEL,
  );
  const [viewportPanState, setViewportPanState] = useState<
    O.Option<ViewportPanState>
  >(O.none);
  const viewportElementRef = useRef<O.Option<HTMLDivElement>>(O.none);

  const setViewportRef = (element: HTMLDivElement | null): void => {
    viewportElementRef.current = O.fromNullable(element);
  };

  const updateScreenZoomLevel = (
    nextZoomLevel: number,
    anchor: O.Option<ViewportAnchor> = O.none,
  ): void => {
    setScreenZoomLevel((currentZoomLevel) => {
      const clampedZoomLevel = clamp(
        nextZoomLevel,
        SCREEN_MIN_ZOOM_LEVEL,
        SCREEN_MAX_ZOOM_LEVEL,
      );

      if (clampedZoomLevel === currentZoomLevel) {
        return currentZoomLevel;
      }

      if (O.isSome(anchor) && O.isSome(viewportElementRef.current)) {
        const viewport = viewportElementRef.current.value;
        const rect = viewport.getBoundingClientRect();
        const relativeX = anchor.value.clientX - rect.left;
        const relativeY = anchor.value.clientY - rect.top;
        const currentCanvasX = viewport.scrollLeft + relativeX;
        const currentCanvasY = viewport.scrollTop + relativeY;

        window.requestAnimationFrame(() => {
          viewport.scrollTo({
            left:
              (currentCanvasX / currentZoomLevel) * clampedZoomLevel -
              relativeX,
            top:
              (currentCanvasY / currentZoomLevel) * clampedZoomLevel -
              relativeY,
          });
        });
      }

      return clampedZoomLevel;
    });
  };

  const handleZoomOut = (): void => {
    updateScreenZoomLevel(screenZoomLevel - 1, O.none);
  };

  const handleZoomIn = (): void => {
    updateScreenZoomLevel(screenZoomLevel + 1, O.none);
  };

  const handleViewportWheel = (event: WheelEvent<HTMLDivElement>): void => {
    if (event.ctrlKey === false) {
      return;
    }

    event.preventDefault();
    updateScreenZoomLevel(
      event.deltaY < 0 ? screenZoomLevel + 1 : screenZoomLevel - 1,
      O.some({ clientX: event.clientX, clientY: event.clientY }),
    );
  };

  const handleViewportPointerDown = (
    event: PointerEvent<HTMLDivElement>,
  ): void => {
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
  };

  const handleViewportPointerMove = (
    event: PointerEvent<HTMLDivElement>,
  ): void => {
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
  };

  const handleViewportPointerEnd = (
    event: PointerEvent<HTMLDivElement>,
  ): void => {
    if (O.isNone(viewportPanState)) {
      return;
    }

    if (viewportPanState.value.pointerId !== event.pointerId) {
      return;
    }

    setViewportPanState(O.none);
  };

  return {
    screenZoomLevel,
    viewportPanState,
    setViewportRef,
    handleZoomOut,
    handleZoomIn,
    handleViewportWheel,
    handleViewportPointerDown,
    handleViewportPointerMove,
    handleViewportPointerEnd,
  };
};
