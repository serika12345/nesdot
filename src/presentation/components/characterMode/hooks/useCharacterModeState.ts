import { Canvas as FabricCanvas, FabricImage, type CanvasEvents } from "fabric";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCharacterState } from "../../../../application/state/characterStore";
import {
  PaletteIndex,
  ProjectSpriteSize,
  useProjectState,
  type SpriteTile,
} from "../../../../application/state/projectStore";
import {
  analyzeCharacterDecomposition,
  applyCharacterDecomposition,
  CharacterDecompositionPixel,
  CharacterDecompositionRegion,
} from "../../../../domain/characters/characterDecomposition";
import {
  buildCharacterPreviewHexGrid,
  CharacterSet,
  CharacterSprite,
} from "../../../../domain/characters/characterSet";
import { nesIndexToCssHex } from "../../../../domain/nes/palette";
import { createEmptySpriteTile } from "../../../../domain/project/project";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import useExportImage from "../../../../infrastructure/browser/useExportImage";
import { type DecompositionTool } from "../CharacterModeLayoutPrimitives";
import {
  createComposeSpriteSource,
  findComposeObjectEntry,
  isMouseLikeCanvasEvent,
  isSameOptionalNumber,
} from "../compose/composeCanvasHelpers";
import {
  createDecompositionCanvas,
  paintDecompositionPixel,
  resizeDecompositionCanvas,
  TRANSPARENT_DECOMPOSITION_PIXEL,
} from "../decomposition/decompositionCanvas";
import {
  clampDecompositionRegion,
  clampDecompositionRegions,
} from "../decomposition/decompositionRegionRules";
import { clamp, isInRange, toNumber } from "../geometry/characterModeBounds";
import { trySetPointerCapture } from "../input/pointerCapture";
import {
  ensureSelectedCharacterSpriteIndex,
  getCharacterLayerEntriesBackToFront,
  getNextCharacterSpriteLayer,
  nudgeCharacterSprite,
  resolveCharacterStagePoint,
  resolveCharacterStageScale,
  resolveSelectionAfterSpriteRemoval,
  resolveVisibleSpriteContextMenu,
  shiftCharacterSpriteLayer,
} from "../model/characterEditorModel";
import { isProjectSpriteSizeLocked } from "../project/projectSpriteSizeLock";
import {
  type CharacterEditorMode,
} from "../view/characterEditorMode";
import {
  type DecompositionDrawState,
  type DecompositionRegionDragState,
  type FabricSpriteObjectEntry,
  type LibraryDragState,
  type SpriteContextMenuState,
  type ViewportPanState,
} from "../types/characterModeInteractionState";

export const STAGE_CONTEXT_MENU_WIDTH = 180;
export const STAGE_CONTEXT_MENU_HEIGHT = 280;
const PREVIEW_TRANSPARENT_HEX = "#00000000";

export const CHARACTER_MODE_STAGE_LIMITS = {
  initialWidth: 16,
  initialHeight: 16,
  minWidth: 16,
  maxWidth: 1024,
  minHeight: 16,
  maxHeight: 960,
  minZoomLevel: 1,
  maxZoomLevel: 6,
  defaultZoomLevel: 2,
};

export const LIBRARY_PREVIEW_SCALE = 3;
export const INSPECTOR_PREVIEW_SCALE = 4;
export const DECOMPOSITION_COLOR_SLOTS: ReadonlyArray<1 | 2 | 3> = [1, 2, 3];

type CharacterPreviewState =
  | { kind: "none" }
  | { kind: "error"; message: string }
  | { kind: "ready"; characterSet: CharacterSet; grid: string[][] };

/**
 * キャラクター編集画面の内部 state を組み立てます。
 * 画面全体で共有する状態と操作を provider 専用にまとめています。
 */
export const useCharacterModeInternalState = () => {
  const [newName, setNewName] = useState("New Character");
  const [editorMode, setEditorMode] = useState<CharacterEditorMode>("compose");
  const [stageWidth, setStageWidth] = useState(
    CHARACTER_MODE_STAGE_LIMITS.initialWidth,
  );
  const [stageHeight, setStageHeight] = useState(
    CHARACTER_MODE_STAGE_LIMITS.initialHeight,
  );
  const [stageZoomLevel, setStageZoomLevel] = useState(
    CHARACTER_MODE_STAGE_LIMITS.defaultZoomLevel,
  );
  const [libraryDragState, setLibraryDragState] = useState<
    O.Option<LibraryDragState>
  >(O.none);
  const [viewportPanState, setViewportPanState] = useState<
    O.Option<ViewportPanState>
  >(O.none);
  const [selectedSpriteEditorIndex, setSelectedSpriteEditorIndex] = useState<
    O.Option<number>
  >(O.none);
  const [spriteContextMenuState, setSpriteContextMenu] = useState<
    O.Option<SpriteContextMenuState>
  >(O.none);
  const [decompositionTool, setDecompositionTool] =
    useState<DecompositionTool>("pen");
  const [decompositionPaletteIndex, setDecompositionPaletteIndex] =
    useState<PaletteIndex>(0);
  const [decompositionColorIndex, setDecompositionColorIndex] = useState<
    1 | 2 | 3
  >(1);
  const [decompositionCanvas, setDecompositionCanvas] = useState(
    createDecompositionCanvas(
      CHARACTER_MODE_STAGE_LIMITS.initialWidth,
      CHARACTER_MODE_STAGE_LIMITS.initialHeight,
    ),
  );
  const [decompositionRegions, setDecompositionRegions] = useState<
    CharacterDecompositionRegion[]
  >([]);
  const [decompositionDrawState, setDecompositionDrawState] = useState<
    O.Option<DecompositionDrawState>
  >(O.none);
  const [decompositionRegionDragState, setDecompositionRegionDragState] =
    useState<O.Option<DecompositionRegionDragState>>(O.none);
  const [selectedRegionId, setSelectedRegionId] = useState<O.Option<string>>(
    O.none,
  );
  const [composeCanvasElement, setComposeCanvasElement] =
    useState<O.Option<HTMLCanvasElement>>(O.none);
  const [decompositionCanvasElement, setDecompositionCanvasElement] =
    useState<O.Option<HTMLCanvasElement>>(O.none);

  const stageElementRef = useRef<O.Option<HTMLDivElement>>(O.none);
  const viewportElementRef = useRef<O.Option<HTMLDivElement>>(O.none);
  const composeFabricCanvasRef = useRef<O.Option<FabricCanvas>>(O.none);
  const composeFabricObjectEntriesRef = useRef<
    ReadonlyArray<FabricSpriteObjectEntry>
  >([]);

  const characterSets = useCharacterState((state) => state.characterSets);
  const selectedCharacterId = useCharacterState(
    (state) => state.selectedCharacterId,
  );
  const createSet = useCharacterState((state) => state.createSet);
  const selectSet = useCharacterState((state) => state.selectSet);
  const renameSet = useCharacterState((state) => state.renameSet);
  const addSprite = useCharacterState((state) => state.addSprite);
  const setSprite = useCharacterState((state) => state.setSprite);
  const removeSprite = useCharacterState((state) => state.removeSprite);
  const deleteSet = useCharacterState((state) => state.deleteSet);

  const projectSpriteSize = useProjectState((state) => state.spriteSize);
  const sprites = useProjectState((state) => state.sprites);
  const screen = useProjectState((state) => state.screen);
  const spritePalettes = useProjectState((state) => state.nes.spritePalettes);
  const { exportPng, exportSvgSimple, exportCharacterJson } = useExportImage();

  const activeSet = useMemo(
    () =>
      pipe(
        selectedCharacterId,
        O.chain((id) =>
          O.fromNullable(
            characterSets.find((characterSet) => characterSet.id === id),
          ),
        ),
      ),
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

  const projectSpriteSizeLocked = useMemo(
    () =>
      isProjectSpriteSizeLocked(sprites, screen.sprites.length, characterSets),
    [characterSets, screen.sprites.length, sprites],
  );

  const decompositionAnalysis = useMemo(
    () =>
      analyzeCharacterDecomposition({
        canvas: decompositionCanvas,
        regions: decompositionRegions,
        spriteSize: projectSpriteSize,
        sprites,
      }),
    [decompositionCanvas, decompositionRegions, projectSpriteSize, sprites],
  );

  const selectedRegionAnalysis = useMemo(
    () =>
      pipe(
        selectedRegionId,
        O.chain((regionId) =>
          O.fromNullable(
            decompositionAnalysis.regions.find(
              (regionAnalysis) => regionAnalysis.region.id === regionId,
            ),
          ),
        ),
      ),
    [decompositionAnalysis.regions, selectedRegionId],
  );

  const previewState: CharacterPreviewState = useMemo(
    () =>
      pipe(
        activeSet,
        O.match(
          (): CharacterPreviewState => ({ kind: "none" }),
          (characterSet): CharacterPreviewState => {
            const preview = buildCharacterPreviewHexGrid(characterSet, {
              sprites,
              palettes: spritePalettes,
              transparentHex: PREVIEW_TRANSPARENT_HEX,
            });

            if (E.isLeft(preview)) {
              return { kind: "error", message: preview.left };
            }

            return {
              kind: "ready",
              characterSet,
              grid: preview.right,
            };
          },
        ),
      ),
    [activeSet, sprites, spritePalettes],
  );

  const projectActions = useMemo(
    () =>
      pipe(
        activeSet,
        O.match(
          () => [],
          (characterSet) => [
            {
              label: "PNGエクスポート",
              onSelect: () => {
                if (previewState.kind !== "ready") {
                  return;
                }

                void exportPng(previewState.grid, `${characterSet.name}.png`);
              },
            },
            {
              label: "SVGエクスポート",
              onSelect: () => {
                if (previewState.kind !== "ready") {
                  return;
                }

                void exportSvgSimple(
                  previewState.grid,
                  8,
                  `${characterSet.name}.svg`,
                );
              },
            },
            {
              label: "キャラクターJSON書き出し",
              onSelect: () =>
                void exportCharacterJson(
                  {
                    characterSets: [characterSet],
                    selectedCharacterId: characterSet.id,
                  },
                  `${characterSet.name}.json`,
                ),
            },
          ],
        ),
      ),
    [activeSet, exportCharacterJson, exportPng, exportSvgSimple, previewState],
  );

  const activeSetName = pipe(
    activeSet,
    O.match(
      () => "",
      (characterSet) => characterSet.name,
    ),
  );

  const activeSetSpriteCount = pipe(
    activeSet,
    O.match(
      () => 0,
      (characterSet) => characterSet.sprites.length,
    ),
  );

  const selectedSpriteStageMetadata = pipe(
    selectedSprite,
    O.match(
      () => ({
        index: "",
        x: "",
        y: "",
        layer: "",
      }),
      ({ index, sprite }) => ({
        index: `${index}`,
        x: `${sprite.x}`,
        y: `${sprite.y}`,
        layer: `${sprite.layer}`,
      }),
    ),
  );

  const decompositionValidRegionCount = decompositionAnalysis.regions.filter(
    (region) => region.issues.length === 0,
  ).length;
  const decompositionInvalidRegionCount =
    decompositionAnalysis.regions.length - decompositionValidRegionCount;

  const decompositionCanvasCursor = (() => {
    if (decompositionTool === "region") {
      return "copy";
    }

    if (decompositionTool === "eraser") {
      return "cell";
    }

    return "crosshair";
  })();

  const handleStageRef = useCallback((element: HTMLDivElement | null) => {
    stageElementRef.current = O.fromNullable(element);
  }, []);

  const handleViewportRef = useCallback((element: HTMLDivElement | null) => {
    viewportElementRef.current = O.fromNullable(element);
  }, []);

  const handleComposeCanvasRef = useCallback(
    (element: HTMLCanvasElement | null) => {
      setComposeCanvasElement(O.fromNullable(element));
    },
    [],
  );

  const handleDecompositionCanvasRef = useCallback(
    (element: HTMLCanvasElement | null) => {
      setDecompositionCanvasElement(O.fromNullable(element));
    },
    [],
  );

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

    const context = contextOption.value;
    const scaledWidth = stageWidth * stageScale;
    const scaledHeight = stageHeight * stageScale;
    const rgbaValues = decompositionCanvas.pixels.flatMap((pixelRow) =>
      Array.from({ length: stageScale }, () =>
        pixelRow.flatMap((pixel) => {
          if (pixel.kind === "transparent") {
            return Array.from({ length: stageScale }, () => [
              0, 0, 0, 0,
            ]).flat();
          }

          const hex = nesIndexToCssHex(
            spritePalettes[pixel.paletteIndex][pixel.colorIndex],
          );
          const r = Number.parseInt(hex.slice(1, 3), 16);
          const g = Number.parseInt(hex.slice(3, 5), 16);
          const b = Number.parseInt(hex.slice(5, 7), 16);

          return Array.from({ length: stageScale }, () => [
            r,
            g,
            b,
            255,
          ]).flat();
        }),
      ).flat(),
    );
    const imageData = new ImageData(
      Uint8ClampedArray.from(rgbaValues),
      scaledWidth,
      scaledHeight,
    );

    context.clearRect(0, 0, scaledWidth, scaledHeight);
    context.putImageData(imageData, 0, 0);
  }, [
    decompositionCanvas,
    decompositionCanvasElement,
    spritePalettes,
    stageHeight,
    stageScale,
    stageWidth,
  ]);

  const getStageRect = (): O.Option<DOMRect> =>
    pipe(
      stageElementRef.current,
      O.map((stage) => stage.getBoundingClientRect()),
    );

  const getViewportElement = (): O.Option<HTMLDivElement> =>
    viewportElementRef.current;

  const resolveDecompositionStagePoint = (
    clientX: number,
    clientY: number,
    offsetX = 0,
    offsetY = 0,
    maxX = stageWidth - 1,
    maxY = stageHeight - 1,
  ): O.Option<{ x: number; y: number }> =>
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
    );

  const updateStageZoomLevel = (
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

      if (O.isNone(anchor)) {
        return clampedZoomLevel;
      }

      pipe(
        getViewportElement(),
        O.map((viewportElement) => {
          const viewport = viewportElement;
          const rect = viewport.getBoundingClientRect();
          const relativeX = anchor.value.clientX - rect.left;
          const relativeY = anchor.value.clientY - rect.top;
          const currentStageX = viewport.scrollLeft + relativeX;
          const currentStageY = viewport.scrollTop + relativeY;
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
            viewport.scrollTo({
              left: (currentStageX / currentScale) * nextScale - relativeX,
              top: (currentStageY / currentScale) * nextScale - relativeY,
            });
          });
        }),
      );

      return clampedZoomLevel;
    });
  };

  const createLibraryDragState = (
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
  };

  const getSpriteTile = (spriteIndex: number): O.Option<SpriteTile> =>
    O.fromNullable(sprites[spriteIndex]);

  const handleCreateSet = () => {
    createSet({ name: newName });
    updateSelectedSpriteEditorIndex(O.none);
    setSelectedRegionId(O.none);
    setLibraryDragState(O.none);
  };

  const handleSelectSet = (value: string) => {
    selectSet(value === "" ? O.none : O.some(value));
    updateSelectedSpriteEditorIndex(O.none);
    setSelectedRegionId(O.none);
    setLibraryDragState(O.none);
  };

  const handleDeleteSet = (setId: string) => {
    deleteSet(setId);
    updateSelectedSpriteEditorIndex(O.none);
    setSelectedRegionId(O.none);
    setLibraryDragState(O.none);
  };

  const handleProjectSpriteSizeChange = (nextSpriteSize: ProjectSpriteSize) => {
    if (
      projectSpriteSizeLocked === true ||
      projectSpriteSize === nextSpriteSize
    ) {
      return;
    }

    const currentState = useProjectState.getState();
    const nextSprites = currentState.sprites.map((sprite) =>
      createEmptySpriteTile(nextSpriteSize, sprite.paletteIndex),
    );
    const nextScreen = {
      ...currentState.screen,
      sprites: [],
    };
    const nextNes = mergeScreenIntoNesOam(
      {
        ...currentState.nes,
        ppuControl: {
          ...currentState.nes.ppuControl,
          spriteSize: nextSpriteSize,
        },
      },
      nextScreen,
    );

    useProjectState.setState({
      spriteSize: nextSpriteSize,
      sprites: nextSprites,
      screen: nextScreen,
      nes: nextNes,
    });
    updateSelectedSpriteEditorIndex(O.none);
    setDecompositionRegions([]);
    setSelectedRegionId(O.none);
  };

  const handleZoomOut = () => {
    updateStageZoomLevel(stageZoomLevel - 1, O.none);
  };

  const handleZoomIn = () => {
    updateStageZoomLevel(stageZoomLevel + 1, O.none);
  };

  const clampSpritesToStage = (
    setId: string,
    currentSprites: CharacterSprite[],
    nextWidth: number,
    nextHeight: number,
  ) => {
    currentSprites.forEach((sprite, index) => {
      const nextX = clamp(sprite.x, 0, nextWidth - 1);
      const nextY = clamp(sprite.y, 0, nextHeight - 1);

      if (nextX === sprite.x && nextY === sprite.y) {
        return;
      }

      setSprite(setId, index, {
        ...sprite,
        x: nextX,
        y: nextY,
      });
    });
  };

  const handleStageWidthChange = (rawValue: string) => {
    const parsed = toNumber(rawValue);

    if (O.isNone(parsed)) {
      return;
    }

    const nextWidth = clamp(
      parsed.value,
      CHARACTER_MODE_STAGE_LIMITS.minWidth,
      CHARACTER_MODE_STAGE_LIMITS.maxWidth,
    );
    setStageWidth(nextWidth);
    setDecompositionCanvas((current) =>
      resizeDecompositionCanvas(current, nextWidth, stageHeight),
    );
    setDecompositionRegions((current) =>
      clampDecompositionRegions(
        current,
        nextWidth,
        stageHeight,
        projectSpriteSize,
      ),
    );
    pipe(
      activeSet,
      O.map((characterSet) =>
        clampSpritesToStage(
          characterSet.id,
          characterSet.sprites,
          nextWidth,
          stageHeight,
        ),
      ),
    );
  };

  const handleStageHeightChange = (rawValue: string) => {
    const parsed = toNumber(rawValue);

    if (O.isNone(parsed)) {
      return;
    }

    const nextHeight = clamp(
      parsed.value,
      CHARACTER_MODE_STAGE_LIMITS.minHeight,
      CHARACTER_MODE_STAGE_LIMITS.maxHeight,
    );
    setStageHeight(nextHeight);
    setDecompositionCanvas((current) =>
      resizeDecompositionCanvas(current, stageWidth, nextHeight),
    );
    setDecompositionRegions((current) =>
      clampDecompositionRegions(
        current,
        stageWidth,
        nextHeight,
        projectSpriteSize,
      ),
    );
    pipe(
      activeSet,
      O.map((characterSet) =>
        clampSpritesToStage(
          characterSet.id,
          characterSet.sprites,
          stageWidth,
          nextHeight,
        ),
      ),
    );
  };

  const handleViewportWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey === false) {
      return;
    }

    event.preventDefault();
    updateStageZoomLevel(
      event.deltaY < 0 ? stageZoomLevel + 1 : stageZoomLevel - 1,
      O.some({ clientX: event.clientX, clientY: event.clientY }),
    );
  };

  const handleViewportPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
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
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (O.isNone(viewportPanState)) {
      return;
    }

    if (viewportPanState.value.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - viewportPanState.value.startClientX;
    const deltaY = event.clientY - viewportPanState.value.startClientY;
    const viewport = event.currentTarget;
    viewport.scrollTo({
      left: viewportPanState.value.startScrollLeft - deltaX,
      top: viewportPanState.value.startScrollTop - deltaY,
    });
  };

  const handleViewportPointerEnd = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (O.isNone(viewportPanState)) {
      return;
    }

    if (viewportPanState.value.pointerId !== event.pointerId) {
      return;
    }

    setViewportPanState(O.none);
  };

  const handleWorkspacePointerDownCapture = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      typeof Element !== "undefined" &&
      event.target instanceof Element &&
      event.target.closest("[data-sprite-context-menu-root='true']") instanceof
        Element
    ) {
      return;
    }

    setSpriteContextMenu(O.none);
  };

  const handleComposeContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (editorMode !== "compose") {
      return;
    }

    event.preventDefault();
  };

  const focusStageElement = () => {
    pipe(
      stageElementRef.current,
      O.map((stageElement) => stageElement.focus()),
    );
  };

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
    Object.assign(composeFabricCanvasRef, {
      current: O.some(composeCanvas),
    });

    return () => {
      Object.assign(composeFabricObjectEntriesRef, {
        current: [],
      });
      Object.assign(composeFabricCanvasRef, {
        current: O.none,
      });
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

    Object.assign(composeFabricObjectEntriesRef, {
      current: nextObjectEntries,
    });

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
    stageHeight,
    stageScale,
    stageWidth,
    spritePalettes,
    sprites,
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
      const focusStage = () => {
        pipe(
          stageElementRef.current,
          O.map((stageElement) => stageElement.focus()),
        );
      };
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
        focusStage();
        setSpriteContextMenu(
          O.some({
            clientX,
            clientY,
            spriteEditorIndex,
          }),
        );
      };

      focusStage();
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
    setSprite,
    stageHeight,
    stageScale,
    stageWidth,
    updateSelectedSpriteEditorIndex,
    validSelectedSpriteEditorIndex,
  ]);

  const withSpriteIndex = (
    spriteEditorIndex: O.Option<number>,
    onSelect: (entry: {
      setId: string;
      spriteCount: number;
      index: number;
      sprite: CharacterSprite;
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
                setId: characterSet.id,
                spriteCount: characterSet.sprites.length,
                index,
                sprite,
              })),
            ),
          ),
        ),
      ),
      O.map(onSelect),
    );
  };

  const withSelectedSprite = (
    onSelect: (entry: {
      setId: string;
      spriteCount: number;
      index: number;
      sprite: CharacterSprite;
    }) => void,
  ) => withSpriteIndex(validSelectedSpriteEditorIndex, onSelect);

  const updateSpriteAtIndex = (
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
  };

  const handleRemoveCharacterSprite = (
    setId: string,
    index: number,
    currentSpriteCount: number,
  ) => {
    removeSprite(setId, index);
    updateSelectedSpriteEditorIndex((current) =>
      resolveSelectionAfterSpriteRemoval(
        current,
        index,
        currentSpriteCount - 1,
      ),
    );
  };

  const handleDeleteSelectedSprite = () => {
    setSpriteContextMenu(O.none);
    withSelectedSprite((entry) =>
      handleRemoveCharacterSprite(entry.setId, entry.index, entry.spriteCount),
    );
  };

  const handleNudgeSelectedSprite = (
    direction: "left" | "right" | "up" | "down",
  ) => {
    setSpriteContextMenu(O.none);
    updateSpriteAtIndex(validSelectedSpriteEditorIndex, (sprite) =>
      nudgeCharacterSprite(sprite, direction, stageWidth - 1, stageHeight - 1),
    );
  };

  const handleDeleteContextMenuSprite = (spriteEditorIndex: number) => {
    setSpriteContextMenu(O.none);
    withSpriteIndex(O.some(spriteEditorIndex), (entry) =>
      handleRemoveCharacterSprite(entry.setId, entry.index, entry.spriteCount),
    );
  };

  const handleShiftContextMenuSpriteLayer = (
    spriteEditorIndex: number,
    amount: number,
  ) => {
    setSpriteContextMenu(O.none);
    updateSpriteAtIndex(O.some(spriteEditorIndex), (sprite) =>
      shiftCharacterSpriteLayer(sprite, amount),
    );
  };

  const handleStageKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
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
  };

  const handleDecompositionCanvasPointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (event.button !== 0) {
      return;
    }

    const pointOption =
      decompositionTool === "region"
        ? resolveDecompositionStagePoint(
            event.clientX,
            event.clientY,
            0,
            0,
            stageWidth - 8,
            stageHeight - projectSpriteSize,
          )
        : resolveDecompositionStagePoint(event.clientX, event.clientY);
    if (O.isNone(pointOption)) {
      return;
    }

    event.preventDefault();

    if (decompositionTool === "region") {
      const nextRegion = clampDecompositionRegion(
        {
          id: ["region", `${Date.now()}`, `${Math.random()}`].join("-"),
          x: pointOption.value.x,
          y: pointOption.value.y,
        },
        stageWidth,
        stageHeight,
        projectSpriteSize,
      );
      setDecompositionRegions((current) => [...current, nextRegion]);
      setSelectedRegionId(O.some(nextRegion.id));
      return;
    }

    const nextPixel: CharacterDecompositionPixel =
      decompositionTool === "eraser"
        ? TRANSPARENT_DECOMPOSITION_PIXEL
        : {
            kind: "color",
            paletteIndex: decompositionPaletteIndex,
            colorIndex: decompositionColorIndex,
          };
    setDecompositionCanvas((current) =>
      paintDecompositionPixel(
        current,
        pointOption.value.x,
        pointOption.value.y,
        nextPixel,
      ),
    );
    setDecompositionDrawState(O.some({ pointerId: event.pointerId }));
    trySetPointerCapture(event.currentTarget, event.pointerId);
  };

  const handleDecompositionRegionPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    region: CharacterDecompositionRegion,
  ) => {
    if (decompositionTool !== "region" || event.button !== 0) {
      return;
    }

    const stageRectOption = getStageRect();
    if (O.isNone(stageRectOption)) {
      return;
    }

    event.preventDefault();
    setSelectedRegionId(O.some(region.id));
    setDecompositionRegionDragState(
      O.some({
        regionId: region.id,
        pointerId: event.pointerId,
        offsetX:
          event.clientX - (stageRectOption.value.left + region.x * stageScale),
        offsetY:
          event.clientY - (stageRectOption.value.top + region.y * stageScale),
      }),
    );
    trySetPointerCapture(event.currentTarget, event.pointerId);
  };

  const handleRemoveSelectedRegion = () => {
    pipe(
      selectedRegionId,
      O.map((regionId) => {
        setDecompositionRegions((current) =>
          current.filter((region) => region.id !== regionId),
        );
        setSelectedRegionId(O.none);
      }),
    );
  };

  const handleApplyDecomposition = () => {
    pipe(
      activeSet,
      O.map((characterSet) => {
        const result = applyCharacterDecomposition({
          canvas: decompositionCanvas,
          regions: decompositionRegions,
          spriteSize: projectSpriteSize,
          sprites,
        });

        if (E.isLeft(result)) {
          return;
        }

        const nextScreen = {
          ...screen,
          sprites: screen.sprites.map((screenSprite) => {
            const nextTileOption = O.fromNullable(
              result.right.sprites[screenSprite.spriteIndex],
            );
            if (O.isNone(nextTileOption)) {
              return screenSprite;
            }

            return {
              ...screenSprite,
              ...nextTileOption.value,
            };
          }),
        };
        const currentProjectState = useProjectState.getState();
        useProjectState.setState({
          sprites: result.right.sprites,
          screen: nextScreen,
          nes: mergeScreenIntoNesOam(currentProjectState.nes, nextScreen),
        });

        useCharacterState.setState((state) => ({
          characterSets: state.characterSets.map((currentCharacterSet) =>
            currentCharacterSet.id === characterSet.id
              ? {
                  ...currentCharacterSet,
                  sprites: result.right.characterSprites,
                }
              : currentCharacterSet,
          ),
        }));
      }),
    );
  };

  const handleLibraryPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => {
    if (event.button !== 0 || O.isNone(activeSet) || editorMode !== "compose") {
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
  };

  const activeSetId = pipe(
    activeSet,
    O.match(
      () => "",
      (characterSet) => characterSet.id,
    ),
  );

  const isStageDropActive = pipe(
    libraryDragState,
    O.match(
      () => false,
      (drag) => drag.isOverStage,
    ),
  );

  const handleWorkspacePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (O.isSome(libraryDragState)) {
      if (libraryDragState.value.pointerId !== event.pointerId) {
        return;
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
      return;
    }

    if (editorMode === "decompose" && O.isSome(decompositionDrawState)) {
      if (decompositionDrawState.value.pointerId !== event.pointerId) {
        return;
      }

      const pointOption = resolveDecompositionStagePoint(
        event.clientX,
        event.clientY,
      );
      if (O.isNone(pointOption)) {
        return;
      }

      const nextPixel: CharacterDecompositionPixel =
        decompositionTool === "eraser"
          ? TRANSPARENT_DECOMPOSITION_PIXEL
          : {
              kind: "color",
              paletteIndex: decompositionPaletteIndex,
              colorIndex: decompositionColorIndex,
            };
      setDecompositionCanvas((current) =>
        paintDecompositionPixel(
          current,
          pointOption.value.x,
          pointOption.value.y,
          nextPixel,
        ),
      );
      return;
    }

    if (editorMode === "decompose" && O.isSome(decompositionRegionDragState)) {
      if (decompositionRegionDragState.value.pointerId !== event.pointerId) {
        return;
      }

      const pointOption = resolveDecompositionStagePoint(
        event.clientX,
        event.clientY,
        decompositionRegionDragState.value.offsetX,
        decompositionRegionDragState.value.offsetY,
        stageWidth - 8,
        stageHeight - projectSpriteSize,
      );
      if (O.isNone(pointOption)) {
        return;
      }

      setDecompositionRegions((current) =>
        current.map((region) =>
          region.id === decompositionRegionDragState.value.regionId
            ? {
                ...region,
                x: pointOption.value.x,
                y: pointOption.value.y,
              }
            : region,
        ),
      );
    }
  };

  const handleWorkspacePointerEnd = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (O.isSome(libraryDragState)) {
      if (libraryDragState.value.pointerId !== event.pointerId) {
        return;
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
      return;
    }

    if (O.isSome(decompositionDrawState)) {
      if (decompositionDrawState.value.pointerId !== event.pointerId) {
        return;
      }

      setDecompositionDrawState(O.none);
      return;
    }

    if (O.isSome(decompositionRegionDragState)) {
      if (decompositionRegionDragState.value.pointerId !== event.pointerId) {
        return;
      }

      setDecompositionRegionDragState(O.none);
    }
  };

  const closeSpriteContextMenu = () => {
    setSpriteContextMenu(O.none);
  };

  const isSpriteDragging = (spriteIndex: number): boolean =>
    pipe(
      libraryDragState,
      O.match(
        () => false,
        (drag) => drag.spriteIndex === spriteIndex,
      ),
    );

  const handleSetNameChange = (name: string) => {
    pipe(
      activeSet,
      O.map((characterSet) => renameSet(characterSet.id, name)),
    );
  };

  const handleNewNameChange = (value: string) => {
    setNewName(value);
  };

  const handleEditorModeChange = (mode: CharacterEditorMode) => {
    setSpriteContextMenu(O.none);
    setEditorMode(mode);
  };

  const handleSelectRegion = (regionId: string) => {
    setSelectedRegionId(O.some(regionId));
  };

  const handleDecompositionPaletteSelect = (value: string | number) => {
    const parsed = Number(String(value));
    if (parsed === 0 || parsed === 1 || parsed === 2 || parsed === 3) {
      setDecompositionPaletteIndex(parsed);
    }
  };

  const handleDecompositionToolChange = (tool: DecompositionTool) => {
    setDecompositionTool(tool);
  };

  const handleDecompositionColorSlotSelect = (slotIndex: 1 | 2 | 3) => {
    setDecompositionColorIndex(slotIndex);
    setDecompositionTool("pen");
  };

  return {
    activeSet,
    activeSetId,
    activeSetName,
    activeSetSpriteCount,
    characterSets,
    decompositionAnalysis,
    decompositionCanvasCursor,
    decompositionColorIndex,
    decompositionInvalidRegionCount,
    decompositionPaletteIndex,
    decompositionRegions,
    decompositionTool,
    decompositionValidRegionCount,
    editorMode,
    handleApplyDecomposition,
    handleComposeCanvasRef,
    handleComposeContextMenu,
    handleCreateSet,
    handleDecompositionCanvasPointerDown,
    handleDecompositionCanvasRef,
    handleDecompositionColorSlotSelect,
    handleDecompositionPaletteSelect,
    handleDecompositionRegionPointerDown,
    handleDecompositionToolChange,
    handleDeleteSet,
    handleEditorModeChange,
    handleLibraryPointerDown,
    handleNewNameChange,
    handleProjectSpriteSizeChange,
    handleRemoveSelectedRegion,
    handleSelectRegion,
    handleSelectSet,
    handleSetNameChange,
    handleStageHeightChange,
    handleStageKeyDown,
    handleStageRef,
    handleStageWidthChange,
    handleViewportPointerDown,
    handleViewportPointerEnd,
    handleViewportPointerMove,
    handleViewportRef,
    handleViewportWheel,
    handleWorkspacePointerDownCapture,
    handleWorkspacePointerEnd,
    handleWorkspacePointerMove,
    handleZoomIn,
    handleZoomOut,
    isSpriteDragging,
    isStageDropActive,
    libraryDragState,
    newName,
    projectActions,
    projectSpriteSize,
    projectSpriteSizeLocked,
    getSpriteTile,
    selectedCharacterId,
    selectedRegionAnalysis,
    selectedRegionId,
    selectedSpriteStageMetadata,
    spriteContextMenu,
    closeSpriteContextMenu,
    spritePalettes,
    sprites,
    focusStageElement,
    handleDeleteContextMenuSprite,
    handleShiftContextMenuSpriteLayer,
    stageHeight,
    stageScale,
    stageWidth,
    stageZoomLevel,
    viewportPanState,
  };
};

export type CharacterModeState = ReturnType<
  typeof useCharacterModeInternalState
>;
