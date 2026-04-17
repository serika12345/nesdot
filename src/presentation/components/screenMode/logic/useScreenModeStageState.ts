import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React from "react";
import { type ScreenModeProjectStateResult } from "./useScreenModeProjectState";
import {
  applyValidatedScreen,
  resolveBoundedDelta,
  resolveHitSpriteIndex,
  resolveMarqueeRect,
  resolveMarqueeSelection,
  resolveMoveEntries,
  type ScreenModeGestureContextMenuState,
  type ScreenModeMarqueeRect,
  type StageMarqueeState,
  type StageMoveDragState,
  type StagePoint,
  toggleSelectionIndex,
} from "./screenModeGestureShared";

type ScreenModeStageStateDependencies = Pick<
  ScreenModeProjectStateResult,
  "scan" | "screen" | "setScreenAndSyncNes"
> & {
  screenZoomLevel: number;
};

type StageNudgeDirection = "left" | "right" | "up" | "down";

export interface ScreenModeStagePresentationState {
  handleContextMenu: React.MouseEventHandler<HTMLDivElement>;
  handlePointerDown: React.PointerEventHandler<HTMLDivElement>;
  handlePointerEnd: React.PointerEventHandler<HTMLDivElement>;
  handlePointerMove: React.PointerEventHandler<HTMLDivElement>;
  isDragging: boolean;
  marqueeRect: O.Option<ScreenModeMarqueeRect>;
  selectedSpriteCount: number;
  selectedSpriteIndices: ReadonlySet<number>;
  setStageRef: (element: HTMLDivElement | null) => void;
  spriteLayout: string;
}

export interface ScreenModeStageStateResult {
  closeContextMenu: () => void;
  contextMenu: O.Option<ScreenModeGestureContextMenuState>;
  handleNudgeSelection: (direction: StageNudgeDirection) => void;
  replaceSelection: (nextSelection: ReadonlySet<number>) => void;
  resolveStagePointFromClient: (
    clientX: number,
    clientY: number,
  ) => O.Option<StagePoint>;
  stageState: ScreenModeStagePresentationState;
}

export const useScreenModeStageState = ({
  scan,
  screen,
  screenZoomLevel,
  setScreenAndSyncNes,
}: ScreenModeStageStateDependencies): ScreenModeStageStateResult => {
  const [contextMenu, setContextMenu] = React.useState<
    O.Option<ScreenModeGestureContextMenuState>
  >(O.none);
  const [selectedSpriteIndices, setSelectedSpriteIndices] = React.useState<
    ReadonlySet<number>
  >(() => new Set());
  const [stageMoveDragState, setStageMoveDragState] = React.useState<
    O.Option<StageMoveDragState>
  >(O.none);
  const [stageMarqueeState, setStageMarqueeState] = React.useState<
    O.Option<StageMarqueeState>
  >(O.none);
  const stageElementRef = React.useRef<O.Option<HTMLDivElement>>(O.none);

  const setStageRef = React.useCallback((element: HTMLDivElement | null) => {
    stageElementRef.current = O.fromNullable(element);
  }, []);

  const replaceSelection = React.useCallback(
    (nextSelection: ReadonlySet<number>): void => {
      setSelectedSpriteIndices(new Set(nextSelection));
    },
    [],
  );

  const closeContextMenu = React.useCallback((): void => {
    setContextMenu(O.none);
  }, []);

  const openSelectionContextMenu = React.useCallback(
    (clientX: number, clientY: number): void => {
      setContextMenu(
        O.some({
          clientX,
          clientY,
          targetSpriteIndex: O.none,
        }),
      );
    },
    [],
  );

  const openTargetContextMenu = React.useCallback(
    (clientX: number, clientY: number, targetIndex: number): void => {
      setContextMenu(
        O.some({
          clientX,
          clientY,
          targetSpriteIndex: O.some(targetIndex),
        }),
      );
    },
    [],
  );

  const gestureStageSpriteLayout = React.useMemo(
    () =>
      screen.sprites
        .map((sprite, index) => `${index}:${sprite.x},${sprite.y}`)
        .join("|"),
    [screen.sprites],
  );

  const marqueeRect = React.useMemo(
    () => pipe(stageMarqueeState, O.map(resolveMarqueeRect)),
    [stageMarqueeState],
  );

  React.useEffect(() => {
    const selected = Array.from(selectedSpriteIndices);
    const normalized = selected.filter(
      (index) => index >= 0 && index < screen.sprites.length,
    );

    if (normalized.length !== selected.length) {
      setSelectedSpriteIndices(new Set(normalized));
    }
  }, [screen.sprites.length, selectedSpriteIndices]);

  const resolveStagePointFromClient = React.useCallback(
    (clientX: number, clientY: number): O.Option<StagePoint> =>
      pipe(
        stageElementRef.current,
        O.chain((stageElement) => {
          const rect = stageElement.getBoundingClientRect();
          const relativeX = clientX - rect.left;
          const relativeY = clientY - rect.top;
          const isWithinStage =
            relativeX >= 0 &&
            relativeY >= 0 &&
            relativeX < rect.width &&
            relativeY < rect.height;

          if (isWithinStage === false) {
            return O.none;
          }

          return O.some({
            x: Math.floor(relativeX / screenZoomLevel),
            y: Math.floor(relativeY / screenZoomLevel),
          });
        }),
      ),
    [screenZoomLevel],
  );

  const applyMoveEntriesDelta = React.useCallback(
    (
      entries: ReadonlyArray<StageMoveDragState["entries"][number]>,
      deltaX: number,
      deltaY: number,
      silent: boolean,
    ): boolean => {
      if (entries.length === 0) {
        return false;
      }

      const boundedDelta = resolveBoundedDelta(screen, entries, deltaX, deltaY);
      const nextSprites = screen.sprites.map((sprite, index) => {
        const entry = entries.find((candidate) => candidate.index === index);

        if (typeof entry === "undefined") {
          return sprite;
        }

        return {
          ...sprite,
          x: entry.startX + boundedDelta.x,
          y: entry.startY + boundedDelta.y,
        };
      });

      const changed = nextSprites.some((sprite, index) => {
        const previous = screen.sprites[index];

        return (
          typeof previous !== "undefined" &&
          (sprite.x !== previous.x || sprite.y !== previous.y)
        );
      });

      if (changed === false) {
        return false;
      }

      return applyValidatedScreen({
        nextScreen: {
          ...screen,
          sprites: nextSprites,
        },
        scan,
        setScreenAndSyncNes,
        silent,
        violationMessage: "移動に失敗しました。制約違反:",
      });
    },
    [scan, screen, setScreenAndSyncNes],
  );

  const handleNudgeSelection = React.useCallback(
    (direction: StageNudgeDirection): void => {
      const entries = resolveMoveEntries(screen.sprites, selectedSpriteIndices);

      if (direction === "left") {
        applyMoveEntriesDelta(entries, -1, 0, false);
        return;
      }

      if (direction === "right") {
        applyMoveEntriesDelta(entries, 1, 0, false);
        return;
      }

      if (direction === "up") {
        applyMoveEntriesDelta(entries, 0, -1, false);
        return;
      }

      applyMoveEntriesDelta(entries, 0, 1, false);
    },
    [applyMoveEntriesDelta, screen.sprites, selectedSpriteIndices],
  );

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button === 1) {
        return;
      }

      const stagePoint = resolveStagePointFromClient(
        event.clientX,
        event.clientY,
      );
      if (O.isNone(stagePoint)) {
        return;
      }

      event.currentTarget.focus();

      if (event.button === 2) {
        event.preventDefault();

        const hitIndexOption = resolveHitSpriteIndex(
          screen.sprites,
          stagePoint.value,
        );

        if (O.isSome(hitIndexOption)) {
          const targetIndex = hitIndexOption.value;
          const nextSelection = selectedSpriteIndices.has(targetIndex)
            ? selectedSpriteIndices
            : new Set([targetIndex]);

          if (selectedSpriteIndices.has(targetIndex) === false) {
            replaceSelection(nextSelection);
          }

          openTargetContextMenu(event.clientX, event.clientY, targetIndex);
          return;
        }

        if (selectedSpriteIndices.size > 0) {
          openSelectionContextMenu(event.clientX, event.clientY);
          return;
        }

        closeContextMenu();
        return;
      }

      closeContextMenu();
      const hitIndexOption = resolveHitSpriteIndex(
        screen.sprites,
        stagePoint.value,
      );

      if (event.shiftKey === true) {
        if (O.isSome(hitIndexOption)) {
          setSelectedSpriteIndices((previous) =>
            toggleSelectionIndex(previous, hitIndexOption.value),
          );
          return;
        }

        setStageMarqueeState(
          O.some({
            pointerId: event.pointerId,
            startX: stagePoint.value.x,
            startY: stagePoint.value.y,
            currentX: stagePoint.value.x,
            currentY: stagePoint.value.y,
            additive: true,
          }),
        );
        return;
      }

      if (O.isSome(hitIndexOption)) {
        const hitIndex = hitIndexOption.value;
        const nextSelection = selectedSpriteIndices.has(hitIndex)
          ? selectedSpriteIndices
          : new Set([hitIndex]);

        if (selectedSpriteIndices.has(hitIndex) === false) {
          replaceSelection(nextSelection);
        }

        const entries = resolveMoveEntries(screen.sprites, nextSelection);
        if (entries.length === 0) {
          return;
        }

        setStageMoveDragState(
          O.some({
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            entries,
          }),
        );
        return;
      }

      replaceSelection(new Set<number>());
      setStageMarqueeState(
        O.some({
          pointerId: event.pointerId,
          startX: stagePoint.value.x,
          startY: stagePoint.value.y,
          currentX: stagePoint.value.x,
          currentY: stagePoint.value.y,
          additive: false,
        }),
      );
    },
    [
      closeContextMenu,
      openSelectionContextMenu,
      openTargetContextMenu,
      replaceSelection,
      resolveStagePointFromClient,
      screen.sprites,
      selectedSpriteIndices,
    ],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pipe(
        stageMoveDragState,
        O.filter((dragState) => dragState.pointerId === event.pointerId),
        O.map((dragState) => {
          const rawDeltaX = Math.round(
            (event.clientX - dragState.startClientX) / screenZoomLevel,
          );
          const rawDeltaY = Math.round(
            (event.clientY - dragState.startClientY) / screenZoomLevel,
          );
          applyMoveEntriesDelta(dragState.entries, rawDeltaX, rawDeltaY, true);
        }),
      );

      pipe(
        stageMarqueeState,
        O.filter((dragState) => dragState.pointerId === event.pointerId),
        O.map((dragState) => {
          const pointOption = resolveStagePointFromClient(
            event.clientX,
            event.clientY,
          );

          if (O.isNone(pointOption)) {
            return;
          }

          setStageMarqueeState(
            O.some({
              ...dragState,
              currentX: pointOption.value.x,
              currentY: pointOption.value.y,
            }),
          );
        }),
      );
    },
    [
      applyMoveEntriesDelta,
      resolveStagePointFromClient,
      screenZoomLevel,
      stageMarqueeState,
      stageMoveDragState,
    ],
  );

  const handlePointerEnd = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pipe(
        stageMoveDragState,
        O.filter((dragState) => dragState.pointerId === event.pointerId),
        O.map(() => {
          setStageMoveDragState(O.none);
        }),
      );

      pipe(
        stageMarqueeState,
        O.filter((dragState) => dragState.pointerId === event.pointerId),
        O.map((dragState) => {
          const selectionFromMarquee = resolveMarqueeSelection(
            screen.sprites,
            dragState,
          );

          if (dragState.additive === true) {
            replaceSelection(
              new Set([...selectedSpriteIndices, ...selectionFromMarquee]),
            );
          }

          if (dragState.additive === false) {
            replaceSelection(selectionFromMarquee);
          }

          setStageMarqueeState(O.none);
        }),
      );
    },
    [
      replaceSelection,
      screen.sprites,
      selectedSpriteIndices,
      stageMarqueeState,
      stageMoveDragState,
    ],
  );

  const handleContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    [],
  );

  return {
    closeContextMenu,
    contextMenu,
    handleNudgeSelection,
    replaceSelection,
    resolveStagePointFromClient,
    stageState: {
      handleContextMenu,
      handlePointerDown,
      handlePointerEnd,
      handlePointerMove,
      isDragging: O.isSome(stageMoveDragState),
      marqueeRect,
      selectedSpriteCount: selectedSpriteIndices.size,
      selectedSpriteIndices,
      setStageRef,
      spriteLayout: gestureStageSpriteLayout,
    },
  };
};
