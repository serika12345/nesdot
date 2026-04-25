import { Canvas as FabricCanvas, FabricImage, type CanvasEvents } from "fabric";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCharacterState } from "../../../../application/state/characterStore";
import { useProjectState } from "../../../../application/state/projectStore";
import { selectActiveSet } from "./characterModeSelectors";
import { useCharacterModeComposeStore } from "./characterModeComposeStore";
import { useCharacterModeProjectStore } from "./characterModeProjectStore";
import { useCharacterModeStageStore } from "./characterModeStageStore";
import {
  createComposeSpriteSource,
  findComposeObjectEntry,
  isMouseLikeCanvasEvent,
  isSameOptionalNumber,
} from "./compose/composeCanvasHelpers";
import { clamp } from "./geometry/characterModeBounds";
import { trySetPointerCapture } from "./input/pointerCapture";
import {
  ensureSelectedCharacterSpriteIndex,
  getCharacterLayerEntriesBackToFront,
  resolveCharacterStagePoint,
  resolveCharacterStageScale,
} from "./model/characterEditorModel";
import type {
  FabricSpriteObjectEntry,
  LibraryDragState,
} from "./types/characterModeInteractionState";
// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface CharacterModeComposeBridge {
  readonly handleComposeCanvasRef: (element: HTMLCanvasElement | null) => void;
  readonly handleComposeContextMenu: React.MouseEventHandler<HTMLElement>;
  readonly handleComposeWorkspacePointerEnd: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
  readonly handleComposeWorkspacePointerMove: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
  readonly handleLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
  readonly handleStageKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
}

// ---------------------------------------------------------------------------
// Pure helper — library drag state from DOM measurements
// ---------------------------------------------------------------------------

const resolveLibraryDragState = (
  spriteIndex: number,
  pointerId: number,
  clientX: number,
  clientY: number,
  getStageRect: () => O.Option<DOMRect>,
): LibraryDragState => {
  const { stageWidth, stageHeight, stageZoomLevel } =
    useCharacterModeStageStore.getState();
  const stageScale = resolveCharacterStageScale(
    stageWidth,
    stageHeight,
    stageZoomLevel,
  );
  const stageRectOption = getStageRect();
  const tileOption = O.fromNullable(
    useProjectState.getState().sprites[spriteIndex],
  );

  if (O.isNone(stageRectOption) || O.isNone(tileOption)) {
    return {
      spriteIndex,
      pointerId,
      clientX,
      clientY,
      isOverStage: false,
      stageX: 0,
      stageY: 0,
    };
  }

  const stageRect = stageRectOption.value;
  const isOverStage =
    clientX >= stageRect.left &&
    clientX <= stageRect.right &&
    clientY >= stageRect.top &&
    clientY <= stageRect.bottom;

  if (isOverStage === false) {
    return {
      spriteIndex,
      pointerId,
      clientX,
      clientY,
      isOverStage,
      stageX: 0,
      stageY: 0,
    };
  }

  const tile = tileOption.value;
  const nextPoint = resolveCharacterStagePoint({
    clientX,
    clientY,
    stageLeft: stageRect.left,
    stageTop: stageRect.top,
    stageScale,
    offsetX: (tile.width * stageScale) / 2,
    offsetY: (tile.height * stageScale) / 2,
    minX: 0,
    maxX: stageWidth - 1,
    minY: 0,
    maxY: stageHeight - 1,
  });

  return {
    spriteIndex,
    pointerId,
    clientX,
    clientY,
    isOverStage,
    stageX: nextPoint.x,
    stageY: nextPoint.y,
  };
};

// ---------------------------------------------------------------------------
// Bridge hook
// ---------------------------------------------------------------------------

/**
 * Fabric.js キャンバスのライフサイクルと合成モードのイベントハンドラを管理するブリッジフック。
 * focused store 群を参照しつつ、DOM 操作のみこのフック内に保持します。
 */
export const useCharacterModeComposeBridge = (
  focusStageElement: () => void,
  getStageRect: () => O.Option<DOMRect>,
): CharacterModeComposeBridge => {
  // ---------------------------------------------------------------------------
  // Local DOM state & refs
  // ---------------------------------------------------------------------------

  const [composeCanvasElement, setComposeCanvasElement] = useState<
    O.Option<HTMLCanvasElement>
  >(O.none);
  const [composeCanvasReadyTick, setComposeCanvasReadyTick] = useState(0);
  const composeFabricCanvasRef = useRef<O.Option<FabricCanvas>>(O.none);
  const composeFabricObjectEntriesRef = useRef<
    ReadonlyArray<FabricSpriteObjectEntry>
  >([]);

  // ---------------------------------------------------------------------------
  // Reactive subscriptions (drive effects)
  // ---------------------------------------------------------------------------

  const characterSets = useCharacterState((s) => s.characterSets);
  const selectedCharacterId = useCharacterState((s) => s.selectedCharacterId);
  const sprites = useProjectState((s) => s.sprites);
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);
  const stageWidth = useCharacterModeStageStore((s) => s.stageWidth);
  const stageHeight = useCharacterModeStageStore((s) => s.stageHeight);
  const stageZoomLevel = useCharacterModeStageStore((s) => s.stageZoomLevel);
  const editorMode = useCharacterModeProjectStore((s) => s.editorMode);
  const selectedSpriteEditorIndex = useCharacterModeComposeStore(
    (s) => s.selectedSpriteEditorIndex,
  );

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const activeSet = useMemo(
    () => selectActiveSet(characterSets, selectedCharacterId),
    [characterSets, selectedCharacterId],
  );

  const stageScale = useMemo(
    () => resolveCharacterStageScale(stageWidth, stageHeight, stageZoomLevel),
    [stageHeight, stageWidth, stageZoomLevel],
  );

  const validSelectedSpriteEditorIndex = useMemo(
    () =>
      pipe(
        activeSet,
        O.chain((cs) =>
          ensureSelectedCharacterSpriteIndex(
            selectedSpriteEditorIndex,
            cs.sprites.length,
          ),
        ),
      ),
    [activeSet, selectedSpriteEditorIndex],
  );

  // ---------------------------------------------------------------------------
  // Effect 1 — Fabric canvas initialisation (layout phase)
  // ---------------------------------------------------------------------------

  useLayoutEffect(() => {
    if (O.isNone(composeCanvasElement)) {
      return;
    }

    const composeCanvas = new FabricCanvas(composeCanvasElement.value, {
      defaultCursor: "default",
      enablePointerEvents: true,
      fireRightClick: true,
      fireMiddleClick: true,
      hoverCursor: "grab",
      imageSmoothingEnabled: false,
      moveCursor: "grabbing",
      preserveObjectStacking: true,
      selection: false,
      stopContextMenu: true,
    });
    composeCanvas.upperCanvasEl.setAttribute(
      "aria-label",
      "合成描画キャンバス操作レイヤー",
    );
    composeCanvas.lowerCanvasEl.setAttribute(
      "aria-label",
      "合成描画キャンバス表示レイヤー",
    );
    composeCanvas.wrapperEl.setAttribute("aria-label", "合成描画キャンバス");
    composeCanvas.lowerCanvasEl.style.setProperty(
      "image-rendering",
      "pixelated",
    );
    composeCanvas.upperCanvasEl.style.setProperty(
      "image-rendering",
      "pixelated",
    );
    composeFabricCanvasRef.current = O.some(composeCanvas);
    setComposeCanvasReadyTick((current) => current + 1);

    return () => {
      composeFabricObjectEntriesRef.current = [];
      composeFabricCanvasRef.current = O.none;
      void composeCanvas.dispose();
    };
  }, [composeCanvasElement]);

  // ---------------------------------------------------------------------------
  // Effect 2 — Render sprites on Fabric canvas
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (O.isNone(composeFabricCanvasRef.current)) {
      return;
    }

    const composeCanvas = composeFabricCanvasRef.current.value;
    const scaledWidth = stageWidth * stageScale;
    const scaledHeight = stageHeight * stageScale;
    const orderedEntries = pipe(
      activeSet,
      O.match(
        (): ReadonlyArray<{
          index: number;
          sprite: { spriteIndex: number; x: number; y: number; layer: number };
        }> => [],
        (characterSet) =>
          getCharacterLayerEntriesBackToFront(characterSet.sprites),
      ),
    );

    composeCanvas.clear();
    composeCanvas.setDimensions({
      width: scaledWidth,
      height: scaledHeight,
    });
    composeCanvas.lowerCanvasEl.style.setProperty(
      "image-rendering",
      "pixelated",
    );
    composeCanvas.upperCanvasEl.style.setProperty(
      "image-rendering",
      "pixelated",
    );

    const nextObjectEntries = orderedEntries.reduce<
      ReadonlyArray<FabricSpriteObjectEntry>
    >((entries, entry) => {
      const sourceOption = createComposeSpriteSource(
        entry.sprite.spriteIndex,
        sprites,
        spritePalettes,
      );
      if (O.isNone(sourceOption)) {
        return entries;
      }

      const nextObject = new FabricImage(sourceOption.value, {
        borderColor: "rgba(15, 118, 110, 0.92)",
        cornerColor: "rgba(15, 118, 110, 0.92)",
        cornerSize: 6,
        cornerStyle: "circle",
        evented: true,
        hasControls: false,
        imageSmoothing: false,
        left: entry.sprite.x * stageScale,
        lockRotation: true,
        objectCaching: false,
        originX: "left",
        originY: "top",
        padding: 0,
        scaleX: stageScale,
        scaleY: stageScale,
        selectable: true,
        top: entry.sprite.y * stageScale,
        transparentCorners: false,
      });

      composeCanvas.add(nextObject);
      return [...entries, { index: entry.index, object: nextObject }];
    }, []);

    composeFabricObjectEntriesRef.current = nextObjectEntries;

    pipe(
      validSelectedSpriteEditorIndex,
      O.chain((selectedIndex) =>
        O.fromNullable(
          nextObjectEntries.find((entry) => entry.index === selectedIndex),
        ),
      ),
      O.match(
        () => {
          composeCanvas.discardActiveObject();
        },
        (entry) => {
          composeCanvas.setActiveObject(entry.object);
        },
      ),
    );

    composeCanvas.requestRenderAll();
  }, [
    activeSet,
    composeCanvasReadyTick,
    spritePalettes,
    sprites,
    stageHeight,
    stageScale,
    stageWidth,
    validSelectedSpriteEditorIndex,
  ]);

  // ---------------------------------------------------------------------------
  // Effect 3 — Editor mode visibility toggle
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (O.isNone(composeFabricCanvasRef.current)) {
      return;
    }

    const composeCanvas = composeFabricCanvasRef.current.value;
    composeCanvas.wrapperEl.style.setProperty(
      "display",
      editorMode === "compose" ? "" : "none",
    );
    composeCanvas.wrapperEl.style.setProperty(
      "pointer-events",
      editorMode === "compose" ? "auto" : "none",
    );
  }, [editorMode]);

  // ---------------------------------------------------------------------------
  // Effect 4 — Fabric event listeners (getState() in callbacks for freshness)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (editorMode !== "compose") {
      return;
    }

    if (O.isNone(composeFabricCanvasRef.current)) {
      return;
    }

    const composeCanvas = composeFabricCanvasRef.current.value;

    const handleMouseDown = (event: CanvasEvents["mouse:down"]) => {
      const composeStore = useCharacterModeComposeStore.getState();
      const charState = useCharacterState.getState();
      const currentActiveSet = selectActiveSet(
        charState.characterSets,
        charState.selectedCharacterId,
      );
      const currentSelectedIndex = pipe(
        currentActiveSet,
        O.chain((cs) =>
          ensureSelectedCharacterSpriteIndex(
            composeStore.selectedSpriteEditorIndex,
            cs.sprites.length,
          ),
        ),
      );

      focusStageElement();
      composeStore.setSpriteContextMenuState(O.none);

      if (isMouseLikeCanvasEvent(event.e) === false) {
        return;
      }

      const pointerEvent = event.e;

      if (pointerEvent.button === 2) {
        const menuTargetIndex = pipe(
          findComposeObjectEntry(
            composeFabricObjectEntriesRef.current,
            event.target,
          ),
          O.map((entry) => entry.index),
          O.alt(() => currentSelectedIndex),
        );

        pipe(
          menuTargetIndex,
          O.map((spriteEditorIndex) => {
            if (
              isSameOptionalNumber(
                currentSelectedIndex,
                O.some(spriteEditorIndex),
              ) === false
            ) {
              useCharacterModeComposeStore
                .getState()
                .setSelectedSpriteEditorIndex(O.some(spriteEditorIndex));
            }
            focusStageElement();
            useCharacterModeComposeStore.getState().setSpriteContextMenuState(
              O.some({
                clientX: pointerEvent.clientX,
                clientY: pointerEvent.clientY,
                spriteEditorIndex,
              }),
            );
          }),
        );
        return;
      }

      if (pointerEvent.button !== 0) {
        return;
      }

      pipe(
        findComposeObjectEntry(
          composeFabricObjectEntriesRef.current,
          event.target,
        ),
        O.match(
          () => {
            if (isSameOptionalNumber(currentSelectedIndex, O.none) === false) {
              useCharacterModeComposeStore
                .getState()
                .setSelectedSpriteEditorIndex(O.none);
            }
          },
          (entry) => {
            if (
              isSameOptionalNumber(
                currentSelectedIndex,
                O.some(entry.index),
              ) === false
            ) {
              useCharacterModeComposeStore
                .getState()
                .setSelectedSpriteEditorIndex(O.some(entry.index));
            }
          },
        ),
      );
    };

    const handleObjectMoving = (event: CanvasEvents["object:moving"]) => {
      const {
        stageWidth: sw,
        stageHeight: sh,
        stageZoomLevel: szl,
      } = useCharacterModeStageStore.getState();
      const ss = resolveCharacterStageScale(sw, sh, szl);

      const currentLeft = event.target.left;
      const currentTop = event.target.top;

      if (typeof currentLeft !== "number" || typeof currentTop !== "number") {
        return;
      }

      const nextLeft = clamp(Math.round(currentLeft / ss), 0, sw - 1);
      const nextTop = clamp(Math.round(currentTop / ss), 0, sh - 1);

      event.target.set({
        left: nextLeft * ss,
        top: nextTop * ss,
      });
      event.target.setCoords();
    };

    const handleObjectModified = (event: CanvasEvents["object:modified"]) => {
      const charState = useCharacterState.getState();
      const currentActiveSet = selectActiveSet(
        charState.characterSets,
        charState.selectedCharacterId,
      );
      if (O.isNone(currentActiveSet)) {
        return;
      }

      const {
        stageWidth: sw,
        stageHeight: sh,
        stageZoomLevel: szl,
      } = useCharacterModeStageStore.getState();
      const ss = resolveCharacterStageScale(sw, sh, szl);

      const currentLeft = event.target.left;
      const currentTop = event.target.top;

      if (typeof currentLeft !== "number" || typeof currentTop !== "number") {
        return;
      }

      pipe(
        findComposeObjectEntry(
          composeFabricObjectEntriesRef.current,
          event.target,
        ),
        O.chain((entry) =>
          pipe(
            O.fromNullable(currentActiveSet.value.sprites[entry.index]),
            O.map((sprite) => ({ entry, sprite })),
          ),
        ),
        O.map(({ entry, sprite }) => {
          const nextX = clamp(Math.round(currentLeft / ss), 0, sw - 1);
          const nextY = clamp(Math.round(currentTop / ss), 0, sh - 1);

          if (nextX === sprite.x && nextY === sprite.y) {
            return;
          }

          charState.setSprite(currentActiveSet.value.id, entry.index, {
            ...sprite,
            x: nextX,
            y: nextY,
          });
        }),
      );
    };

    composeCanvas.on("mouse:down", handleMouseDown);
    composeCanvas.on("object:moving", handleObjectMoving);
    composeCanvas.on("object:modified", handleObjectModified);

    return () => {
      composeCanvas.off("mouse:down", handleMouseDown);
      composeCanvas.off("object:moving", handleObjectMoving);
      composeCanvas.off("object:modified", handleObjectModified);
    };
  }, [composeCanvasReadyTick, editorMode, focusStageElement]);

  // ---------------------------------------------------------------------------
  // Stable callbacks (use getState() — no reactive deps)
  // ---------------------------------------------------------------------------

  const handleComposeCanvasRef = useCallback(
    (element: HTMLCanvasElement | null) => {
      setComposeCanvasElement(O.fromNullable(element));
    },
    [],
  );

  const handleComposeContextMenu = useCallback<
    React.MouseEventHandler<HTMLElement>
  >((event) => {
    if (useCharacterModeProjectStore.getState().editorMode !== "compose") {
      return;
    }
    event.preventDefault();
  }, []);

  const handleStageKeyDown = useCallback<
    React.KeyboardEventHandler<HTMLDivElement>
  >((event) => {
    const composeStore = useCharacterModeComposeStore.getState();
    const projectStore = useCharacterModeProjectStore.getState();

    if (projectStore.editorMode !== "compose") {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      composeStore.closeSpriteContextMenu();
      return;
    }

    const charState = useCharacterState.getState();
    const currentActiveSet = selectActiveSet(
      charState.characterSets,
      charState.selectedCharacterId,
    );
    const hasSelection = pipe(
      currentActiveSet,
      O.chain((cs) =>
        ensureSelectedCharacterSpriteIndex(
          composeStore.selectedSpriteEditorIndex,
          cs.sprites.length,
        ),
      ),
      O.isSome,
    );

    if (hasSelection === false) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      useCharacterModeComposeStore.getState().handleNudgeSelectedSprite("left");
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      useCharacterModeComposeStore
        .getState()
        .handleNudgeSelectedSprite("right");
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      useCharacterModeComposeStore.getState().handleNudgeSelectedSprite("up");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      useCharacterModeComposeStore.getState().handleNudgeSelectedSprite("down");
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      useCharacterModeComposeStore.getState().handleDeleteSelectedSprite();
    }
  }, []);

  const handleLibraryPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, spriteIndex: number) => {
      const composeStore = useCharacterModeComposeStore.getState();
      const projectStore = useCharacterModeProjectStore.getState();
      const charState = useCharacterState.getState();
      const currentActiveSet = selectActiveSet(
        charState.characterSets,
        charState.selectedCharacterId,
      );

      if (
        event.button !== 0 ||
        O.isNone(currentActiveSet) ||
        projectStore.editorMode !== "compose"
      ) {
        return;
      }

      event.preventDefault();
      composeStore.setLibraryDragState(
        O.some(
          resolveLibraryDragState(
            spriteIndex,
            event.pointerId,
            event.clientX,
            event.clientY,
            getStageRect,
          ),
        ),
      );
      trySetPointerCapture(event.currentTarget, event.pointerId);
    },
    [getStageRect],
  );

  const handleComposeWorkspacePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const { libraryDragState } = useCharacterModeComposeStore.getState();

      if (O.isNone(libraryDragState)) {
        return false;
      }

      if (libraryDragState.value.pointerId !== event.pointerId) {
        return false;
      }

      useCharacterModeComposeStore
        .getState()
        .setLibraryDragState(
          O.some(
            resolveLibraryDragState(
              libraryDragState.value.spriteIndex,
              libraryDragState.value.pointerId,
              event.clientX,
              event.clientY,
              getStageRect,
            ),
          ),
        );
      return true;
    },
    [getStageRect],
  );

  const handleComposeWorkspacePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      const { libraryDragState } = useCharacterModeComposeStore.getState();

      if (O.isNone(libraryDragState)) {
        return false;
      }

      if (libraryDragState.value.pointerId !== event.pointerId) {
        return false;
      }

      const completedDrag = resolveLibraryDragState(
        libraryDragState.value.spriteIndex,
        libraryDragState.value.pointerId,
        event.clientX,
        event.clientY,
        getStageRect,
      );

      if (completedDrag.isOverStage === true) {
        useCharacterModeComposeStore
          .getState()
          .handleDropSpriteOnStage(
            completedDrag.spriteIndex,
            completedDrag.stageX,
            completedDrag.stageY,
          );
      }

      useCharacterModeComposeStore.getState().setLibraryDragState(O.none);
      return true;
    },
    [getStageRect],
  );

  return {
    handleComposeCanvasRef,
    handleComposeContextMenu,
    handleComposeWorkspacePointerEnd,
    handleComposeWorkspacePointerMove,
    handleLibraryPointerDown,
    handleStageKeyDown,
  };
};
