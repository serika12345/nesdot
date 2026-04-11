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
import { type ProjectState } from "../../../../../application/state/projectStore";
import {
  type CharacterSet,
  type CharacterSprite,
} from "../../../../../domain/characters/characterSet";
import {
  createComposeSpriteSource,
  findComposeObjectEntry,
  isMouseLikeCanvasEvent,
  isSameOptionalNumber,
} from "../compose/composeCanvasHelpers";
import { clamp, isInRange } from "../geometry/characterModeBounds";
import { trySetPointerCapture } from "../input/pointerCapture";
import {
  ensureSelectedCharacterSpriteIndex,
  getCharacterLayerEntriesBackToFront,
  getNextCharacterSpriteLayer,
  nudgeCharacterSprite,
  resolveCharacterStagePoint,
  resolveSelectionAfterSpriteRemoval,
  resolveVisibleSpriteContextMenu,
  shiftCharacterSpriteLayer,
} from "../model/characterEditorModel";
import {
  type FabricSpriteObjectEntry,
  type LibraryDragState,
  type SpriteContextMenuState,
} from "../types/characterModeInteractionState";
import { type CharacterEditorMode } from "../view/characterEditorMode";
import { type CharacterModeSelectedSpriteStageMetadata } from "./characterModeStateTypes";

interface UseCharacterModeComposeStateArgs {
  activeSet: O.Option<CharacterSet>;
  addSprite: (id: string, sprite: CharacterSprite) => void;
  editorMode: CharacterEditorMode;
  focusStageElement: () => void;
  getStageRect: () => O.Option<DOMRect>;
  removeSprite: (id: string, index: number) => void;
  setSprite: (id: string, index: number, sprite: CharacterSprite) => void;
  spritePalettes: ProjectState["nes"]["spritePalettes"];
  sprites: ProjectState["sprites"];
  stageHeight: number;
  stageScale: number;
  stageWidth: number;
}

export interface CharacterModeComposeStateResult {
  clearSelectionAndDrag: () => void;
  clampSpritesToStage: (nextWidth: number, nextHeight: number) => void;
  closeSpriteContextMenu: () => void;
  getSpriteTile: (
    spriteIndex: number,
  ) => O.Option<ProjectState["sprites"][number]>;
  handleComposeCanvasRef: (element: HTMLCanvasElement | null) => void;
  handleComposeContextMenu: React.MouseEventHandler<HTMLElement>;
  handleDeleteContextMenuSprite: (spriteEditorIndex: number) => void;
  handleLibraryPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => void;
  handleShiftContextMenuSpriteLayer: (
    spriteEditorIndex: number,
    amount: number,
  ) => void;
  handleStageKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
  handleWorkspacePointerEnd: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
  handleWorkspacePointerMove: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
  isLibraryDraggable: boolean;
  isSpriteDragging: (spriteIndex: number) => boolean;
  isStageDropActive: boolean;
  libraryDragState: O.Option<LibraryDragState>;
  selectedSpriteStageMetadata: CharacterModeSelectedSpriteStageMetadata;
  spriteContextMenu: O.Option<SpriteContextMenuState>;
}

export const useCharacterModeComposeState = ({
  activeSet,
  addSprite,
  editorMode,
  focusStageElement,
  getStageRect,
  removeSprite,
  setSprite,
  spritePalettes,
  sprites,
  stageHeight,
  stageScale,
  stageWidth,
}: UseCharacterModeComposeStateArgs): CharacterModeComposeStateResult => {
  const [libraryDragState, setLibraryDragState] = useState<
    O.Option<LibraryDragState>
  >(O.none);
  const [selectedSpriteEditorIndex, setSelectedSpriteEditorIndex] = useState<
    O.Option<number>
  >(O.none);
  const [spriteContextMenuState, setSpriteContextMenu] = useState<
    O.Option<SpriteContextMenuState>
  >(O.none);
  const [composeCanvasElement, setComposeCanvasElement] = useState<
    O.Option<HTMLCanvasElement>
  >(O.none);
  const [composeCanvasReadyTick, setComposeCanvasReadyTick] = useState(0);

  const composeFabricCanvasRef = useRef<O.Option<FabricCanvas>>(O.none);
  const composeFabricObjectEntriesRef = useRef<
    ReadonlyArray<FabricSpriteObjectEntry>
  >([]);

  const validSelectedSpriteEditorIndex = useMemo(
    () =>
      pipe(
        activeSet,
        O.chain((characterSet) =>
          ensureSelectedCharacterSpriteIndex(
            selectedSpriteEditorIndex,
            characterSet.sprites.length,
          ),
        ),
      ),
    [activeSet, selectedSpriteEditorIndex],
  );

  const selectedSprite = useMemo(
    () =>
      pipe(
        activeSet,
        O.chain((characterSet) =>
          pipe(
            validSelectedSpriteEditorIndex,
            O.chain((index) =>
              pipe(
                O.fromNullable(characterSet.sprites[index]),
                O.map((sprite) => ({ index, sprite })),
              ),
            ),
          ),
        ),
      ),
    [activeSet, validSelectedSpriteEditorIndex],
  );

  const spriteContextMenu = useMemo(
    () =>
      resolveVisibleSpriteContextMenu(
        editorMode === "compose",
        O.isSome(selectedSprite),
        spriteContextMenuState,
      ),
    [editorMode, selectedSprite, spriteContextMenuState],
  );

  const updateSelectedSpriteEditorIndex = useCallback(
    (nextSelection: React.SetStateAction<O.Option<number>>) => {
      setSpriteContextMenu(O.none);
      setSelectedSpriteEditorIndex(nextSelection);
    },
    [],
  );

  const selectedSpriteStageMetadata = pipe(
    selectedSprite,
    O.match(
      (): CharacterModeSelectedSpriteStageMetadata => ({
        index: "",
        layer: "",
        x: "",
        y: "",
      }),
      ({ index, sprite }) => ({
        index: `${index}`,
        layer: `${sprite.layer}`,
        x: `${sprite.x}`,
        y: `${sprite.y}`,
      }),
    ),
  );

  const createLibraryDragState = useCallback(
    (
      spriteIndex: number,
      pointerId: number,
      clientX: number,
      clientY: number,
    ): LibraryDragState => {
      const stageRectOption = getStageRect();
      const tileOption = O.fromNullable(sprites[spriteIndex]);

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
    },
    [getStageRect, sprites, stageHeight, stageScale, stageWidth],
  );

  const getSpriteTile = useCallback(
    (spriteIndex: number) => O.fromNullable(sprites[spriteIndex]),
    [sprites],
  );

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
      "合成描画キャンバス",
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
          sprite: CharacterSprite;
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
    composeCanvas.wrapperEl.setAttribute("data-stage-width", `${stageWidth}`);
    composeCanvas.wrapperEl.setAttribute("data-stage-height", `${stageHeight}`);
    composeCanvas.upperCanvasEl.setAttribute(
      "data-stage-width",
      `${stageWidth}`,
    );
    composeCanvas.upperCanvasEl.setAttribute(
      "data-stage-height",
      `${stageHeight}`,
    );
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

  useEffect(() => {
    if (editorMode !== "compose") {
      return;
    }

    if (O.isNone(composeFabricCanvasRef.current)) {
      return;
    }

    const composeCanvas = composeFabricCanvasRef.current.value;

    const handleMouseDown = (event: CanvasEvents["mouse:down"]) => {
      const selectIndex = (nextIndex: O.Option<number>) => {
        if (isSameOptionalNumber(validSelectedSpriteEditorIndex, nextIndex)) {
          return;
        }

        updateSelectedSpriteEditorIndex(nextIndex);
      };
      const openContextMenuAt = (
        clientX: number,
        clientY: number,
        spriteEditorIndex: number,
      ) => {
        focusStageElement();
        setSpriteContextMenu(
          O.some({
            clientX,
            clientY,
            spriteEditorIndex,
          }),
        );
      };

      focusStageElement();
      setSpriteContextMenu(O.none);

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
          O.alt(() => validSelectedSpriteEditorIndex),
        );

        pipe(
          menuTargetIndex,
          O.map((spriteEditorIndex) => {
            selectIndex(O.some(spriteEditorIndex));
            openContextMenuAt(
              pointerEvent.clientX,
              pointerEvent.clientY,
              spriteEditorIndex,
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
          () => selectIndex(O.none),
          (entry) => selectIndex(O.some(entry.index)),
        ),
      );
    };

    const handleObjectMoving = (event: CanvasEvents["object:moving"]) => {
      const currentLeft = event.target.left;
      const currentTop = event.target.top;

      if (typeof currentLeft !== "number" || typeof currentTop !== "number") {
        return;
      }

      const nextLeft = clamp(
        Math.round(currentLeft / stageScale),
        0,
        stageWidth - 1,
      );
      const nextTop = clamp(
        Math.round(currentTop / stageScale),
        0,
        stageHeight - 1,
      );

      event.target.set({
        left: nextLeft * stageScale,
        top: nextTop * stageScale,
      });
      event.target.setCoords();
    };

    const handleObjectModified = (event: CanvasEvents["object:modified"]) => {
      if (O.isNone(activeSet)) {
        return;
      }

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
            O.fromNullable(activeSet.value.sprites[entry.index]),
            O.map((sprite) => ({ entry, sprite })),
          ),
        ),
        O.map(({ entry, sprite }) => {
          const nextX = clamp(
            Math.round(currentLeft / stageScale),
            0,
            stageWidth - 1,
          );
          const nextY = clamp(
            Math.round(currentTop / stageScale),
            0,
            stageHeight - 1,
          );

          if (nextX === sprite.x && nextY === sprite.y) {
            return;
          }

          setSprite(activeSet.value.id, entry.index, {
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
  }, [
    activeSet,
    editorMode,
    focusStageElement,
    setSprite,
    stageHeight,
    stageScale,
    stageWidth,
    updateSelectedSpriteEditorIndex,
    validSelectedSpriteEditorIndex,
  ]);

  const withSpriteIndex = useCallback(
    (
      spriteEditorIndex: O.Option<number>,
      onSelect: (entry: {
        index: number;
        setId: string;
        sprite: CharacterSprite;
        spriteCount: number;
      }) => void,
    ) => {
      pipe(
        activeSet,
        O.chain((characterSet) =>
          pipe(
            spriteEditorIndex,
            O.chain((index) =>
              pipe(
                O.fromNullable(characterSet.sprites[index]),
                O.map((sprite) => ({
                  index,
                  setId: characterSet.id,
                  sprite,
                  spriteCount: characterSet.sprites.length,
                })),
              ),
            ),
          ),
        ),
        O.map(onSelect),
      );
    },
    [activeSet],
  );

  const withSelectedSprite = useCallback(
    (
      onSelect: (entry: {
        index: number;
        setId: string;
        sprite: CharacterSprite;
        spriteCount: number;
      }) => void,
    ) => {
      withSpriteIndex(validSelectedSpriteEditorIndex, onSelect);
    },
    [validSelectedSpriteEditorIndex, withSpriteIndex],
  );

  const updateSpriteAtIndex = useCallback(
    (
      spriteEditorIndex: O.Option<number>,
      transform: (sprite: CharacterSprite) => CharacterSprite,
    ) => {
      withSpriteIndex(spriteEditorIndex, (entry) => {
        const nextSprite = transform(entry.sprite);
        const isValid =
          isInRange(nextSprite.spriteIndex, 0, 63) &&
          isInRange(nextSprite.x, 0, stageWidth - 1) &&
          isInRange(nextSprite.y, 0, stageHeight - 1) &&
          isInRange(nextSprite.layer, 0, 63);

        if (isValid === false) {
          return;
        }

        setSprite(entry.setId, entry.index, nextSprite);
      });
    },
    [setSprite, stageHeight, stageWidth, withSpriteIndex],
  );

  const handleRemoveCharacterSprite = useCallback(
    (setId: string, index: number, currentSpriteCount: number) => {
      removeSprite(setId, index);
      updateSelectedSpriteEditorIndex((current) =>
        resolveSelectionAfterSpriteRemoval(
          current,
          index,
          currentSpriteCount - 1,
        ),
      );
    },
    [removeSprite, updateSelectedSpriteEditorIndex],
  );

  const handleDeleteSelectedSprite = useCallback(() => {
    setSpriteContextMenu(O.none);
    withSelectedSprite((entry) =>
      handleRemoveCharacterSprite(entry.setId, entry.index, entry.spriteCount),
    );
  }, [handleRemoveCharacterSprite, withSelectedSprite]);

  const handleNudgeSelectedSprite = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      setSpriteContextMenu(O.none);
      updateSpriteAtIndex(validSelectedSpriteEditorIndex, (sprite) =>
        nudgeCharacterSprite(
          sprite,
          direction,
          stageWidth - 1,
          stageHeight - 1,
        ),
      );
    },
    [
      stageHeight,
      stageWidth,
      updateSpriteAtIndex,
      validSelectedSpriteEditorIndex,
    ],
  );

  const handleDeleteContextMenuSprite = useCallback(
    (spriteEditorIndex: number) => {
      setSpriteContextMenu(O.none);
      withSpriteIndex(O.some(spriteEditorIndex), (entry) =>
        handleRemoveCharacterSprite(
          entry.setId,
          entry.index,
          entry.spriteCount,
        ),
      );
    },
    [handleRemoveCharacterSprite, withSpriteIndex],
  );

  const handleShiftContextMenuSpriteLayer = useCallback(
    (spriteEditorIndex: number, amount: number) => {
      setSpriteContextMenu(O.none);
      updateSpriteAtIndex(O.some(spriteEditorIndex), (sprite) =>
        shiftCharacterSpriteLayer(sprite, amount),
      );
    },
    [updateSpriteAtIndex],
  );

  const handleStageKeyDown = useCallback<
    React.KeyboardEventHandler<HTMLDivElement>
  >(
    (event) => {
      if (editorMode !== "compose") {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setSpriteContextMenu(O.none);
        return;
      }

      if (O.isNone(selectedSprite)) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleNudgeSelectedSprite("left");
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNudgeSelectedSprite("right");
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        handleNudgeSelectedSprite("up");
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        handleNudgeSelectedSprite("down");
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        handleDeleteSelectedSprite();
      }
    },
    [
      editorMode,
      handleDeleteSelectedSprite,
      handleNudgeSelectedSprite,
      selectedSprite,
    ],
  );

  const handleComposeCanvasRef = useCallback(
    (element: HTMLCanvasElement | null) => {
      setComposeCanvasElement(O.fromNullable(element));
    },
    [],
  );

  const handleComposeContextMenu = useCallback<
    React.MouseEventHandler<HTMLElement>
  >(
    (event) => {
      if (editorMode !== "compose") {
        return;
      }

      event.preventDefault();
    },
    [editorMode],
  );

  const handleLibraryPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, spriteIndex: number) => {
      if (
        event.button !== 0 ||
        O.isNone(activeSet) ||
        editorMode !== "compose"
      ) {
        return;
      }

      event.preventDefault();
      setLibraryDragState(
        O.some(
          createLibraryDragState(
            spriteIndex,
            event.pointerId,
            event.clientX,
            event.clientY,
          ),
        ),
      );
      trySetPointerCapture(event.currentTarget, event.pointerId);
    },
    [activeSet, createLibraryDragState, editorMode],
  );

  const handleWorkspacePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      if (O.isNone(libraryDragState)) {
        return false;
      }

      if (libraryDragState.value.pointerId !== event.pointerId) {
        return false;
      }

      setLibraryDragState(
        O.some(
          createLibraryDragState(
            libraryDragState.value.spriteIndex,
            libraryDragState.value.pointerId,
            event.clientX,
            event.clientY,
          ),
        ),
      );
      return true;
    },
    [createLibraryDragState, libraryDragState],
  );

  const handleWorkspacePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      if (O.isNone(libraryDragState)) {
        return false;
      }

      if (libraryDragState.value.pointerId !== event.pointerId) {
        return false;
      }

      const completedDrag = createLibraryDragState(
        libraryDragState.value.spriteIndex,
        libraryDragState.value.pointerId,
        event.clientX,
        event.clientY,
      );

      pipe(
        activeSet,
        O.map((characterSet) => {
          if (completedDrag.isOverStage === false) {
            return;
          }

          addSprite(characterSet.id, {
            spriteIndex: completedDrag.spriteIndex,
            x: completedDrag.stageX,
            y: completedDrag.stageY,
            layer: getNextCharacterSpriteLayer(characterSet.sprites),
          });
          updateSelectedSpriteEditorIndex(O.some(characterSet.sprites.length));
        }),
      );
      setLibraryDragState(O.none);
      return true;
    },
    [
      activeSet,
      addSprite,
      createLibraryDragState,
      libraryDragState,
      updateSelectedSpriteEditorIndex,
    ],
  );

  const closeSpriteContextMenu = useCallback(() => {
    setSpriteContextMenu(O.none);
  }, []);

  const clearSelectionAndDrag = useCallback(() => {
    updateSelectedSpriteEditorIndex(O.none);
    setLibraryDragState(O.none);
  }, [updateSelectedSpriteEditorIndex]);

  const isSpriteDragging = useCallback(
    (spriteIndex: number): boolean =>
      pipe(
        libraryDragState,
        O.match(
          () => false,
          (drag) => drag.spriteIndex === spriteIndex,
        ),
      ),
    [libraryDragState],
  );

  const isStageDropActive = pipe(
    libraryDragState,
    O.match(
      () => false,
      (drag) => drag.isOverStage,
    ),
  );

  const clampSpritesToStage = useCallback(
    (nextWidth: number, nextHeight: number) => {
      pipe(
        activeSet,
        O.map((characterSet) => {
          characterSet.sprites.forEach((sprite, index) => {
            const nextX = clamp(sprite.x, 0, nextWidth - 1);
            const nextY = clamp(sprite.y, 0, nextHeight - 1);

            if (nextX === sprite.x && nextY === sprite.y) {
              return;
            }

            setSprite(characterSet.id, index, {
              ...sprite,
              x: nextX,
              y: nextY,
            });
          });
        }),
      );
    },
    [activeSet, setSprite],
  );

  return {
    clearSelectionAndDrag,
    clampSpritesToStage,
    closeSpriteContextMenu,
    getSpriteTile,
    handleComposeCanvasRef,
    handleComposeContextMenu,
    handleDeleteContextMenuSprite,
    handleLibraryPointerDown,
    handleShiftContextMenuSpriteLayer,
    handleStageKeyDown,
    handleWorkspacePointerEnd,
    handleWorkspacePointerMove,
    isLibraryDraggable: editorMode === "compose" && O.isSome(activeSet),
    isSpriteDragging,
    isStageDropActive,
    libraryDragState,
    selectedSpriteStageMetadata,
    spriteContextMenu,
  };
};
