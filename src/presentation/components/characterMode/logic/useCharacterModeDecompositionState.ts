import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCharacterState } from "../../../../application/state/characterStore";
import {
  useProjectState,
  type PaletteIndex,
  type ProjectSpriteSize,
  type ProjectState,
} from "../../../../application/state/projectStore";
import {
  analyzeCharacterDecomposition,
  applyCharacterDecomposition,
  type CharacterDecompositionAnalysis,
  type CharacterDecompositionPixel,
  type CharacterDecompositionRegion,
  type CharacterDecompositionRegionAnalysis,
} from "../../../../domain/characters/characterDecomposition";
import { type CharacterSet } from "../../../../domain/characters/characterSet";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import { type DecompositionTool } from "../ui/primitives/CharacterModePrimitives";
import { CHARACTER_MODE_STAGE_LIMITS } from "./characterModeConstants";
import {
  createDecompositionCanvas,
  createDecompositionCanvasRgba,
  paintDecompositionPixel,
  resizeDecompositionCanvas,
  TRANSPARENT_DECOMPOSITION_PIXEL,
} from "./decomposition/decompositionCanvas";
import {
  clampDecompositionRegion,
  clampDecompositionRegions,
} from "./decomposition/decompositionRegionRules";
import { trySetPointerCapture } from "./input/pointerCapture";
import {
  type DecompositionDrawState,
  type DecompositionRegionContextMenuState,
  type DecompositionRegionDragState,
} from "./types/characterModeInteractionState";
import { type CharacterEditorMode } from "./view/characterEditorMode";

interface UseCharacterModeDecompositionStateArgs {
  activeSet: O.Option<CharacterSet>;
  editorMode: CharacterEditorMode;
  getStageRect: () => O.Option<DOMRect>;
  projectSpriteSize: ProjectSpriteSize;
  screen: ProjectState["screen"];
  spritePalettes: ProjectState["nes"]["spritePalettes"];
  sprites: ProjectState["sprites"];
  stageHeight: number;
  stageScale: number;
  stageWidth: number;
}

interface CharacterModeDecompositionStateResult {
  clearRegionsAndSelection: () => void;
  clearSelectedRegion: () => void;
  closeDecompositionRegionContextMenu: () => void;
  decompositionAnalysis: CharacterDecompositionAnalysis;
  decompositionCanvasCursor: string;
  decompositionColorIndex: 1 | 2 | 3;
  decompositionInvalidRegionCount: number;
  decompositionPaletteIndex: PaletteIndex;
  decompositionRegionContextMenu: O.Option<DecompositionRegionContextMenuState>;
  decompositionRegions: ReadonlyArray<CharacterDecompositionRegion>;
  decompositionTool: DecompositionTool;
  decompositionValidRegionCount: number;
  handleApplyDecomposition: () => boolean;
  handleDecompositionCanvasPointerDown: React.PointerEventHandler<HTMLCanvasElement>;
  handleDecompositionCanvasRef: (element: HTMLCanvasElement | null) => void;
  handleDecompositionColorSlotSelect: (slotIndex: 1 | 2 | 3) => void;
  handleDecompositionPaletteSelect: (value: string | number) => void;
  handleDecompositionRegionContextMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    region: CharacterDecompositionRegion,
  ) => void;
  handleDecompositionRegionPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    region: CharacterDecompositionRegion,
  ) => void;
  handleDecompositionToolChange: (tool: DecompositionTool) => void;
  handleDeleteContextMenuRegion: (regionId: string) => void;
  handleRemoveSelectedRegion: () => void;
  handleSelectRegion: (regionId: string) => void;
  handleWorkspacePointerEnd: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
  handleWorkspacePointerMove: (
    event: React.PointerEvent<HTMLDivElement>,
  ) => boolean;
  resizeToStage: (nextWidth: number, nextHeight: number) => void;
  selectedRegionAnalysis: O.Option<CharacterDecompositionRegionAnalysis>;
  selectedRegionId: O.Option<string>;
}

export const useCharacterModeDecompositionState = ({
  activeSet,
  editorMode,
  getStageRect,
  projectSpriteSize,
  screen,
  spritePalettes,
  sprites,
  stageHeight,
  stageScale,
  stageWidth,
}: UseCharacterModeDecompositionStateArgs): CharacterModeDecompositionStateResult => {
  const [
    decompositionRegionContextMenuState,
    setDecompositionRegionContextMenu,
  ] = useState<O.Option<DecompositionRegionContextMenuState>>(O.none);
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
  const [decompositionCanvasElement, setDecompositionCanvasElement] = useState<
    O.Option<HTMLCanvasElement>
  >(O.none);

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

  const resolveDecompositionStagePoint = useCallback(
    (
      clientX: number,
      clientY: number,
      offsetX = 0,
      offsetY = 0,
      maxX = stageWidth - 1,
      maxY = stageHeight - 1,
    ): O.Option<{ x: number; y: number }> =>
      pipe(
        getStageRect(),
        O.map((stageRect) => ({
          x: Math.round((clientX - stageRect.left - offsetX) / stageScale),
          y: Math.round((clientY - stageRect.top - offsetY) / stageScale),
        })),
        O.map((point) => ({
          x: Math.min(Math.max(point.x, 0), maxX),
          y: Math.min(Math.max(point.y, 0), maxY),
        })),
      ),
    [getStageRect, stageHeight, stageScale, stageWidth],
  );

  const decompositionAnalysis = useMemo<CharacterDecompositionAnalysis>(
    () =>
      editorMode !== "decompose"
        ? {
            spriteSize: projectSpriteSize,
            regions: [],
            reusableSpriteCount: 0,
            requiredNewSpriteCount: 0,
            availableEmptySlotCount: 0,
            canApply: false,
          }
        : analyzeCharacterDecomposition({
            canvas: decompositionCanvas,
            regions: decompositionRegions,
            spriteSize: projectSpriteSize,
            sprites,
          }),
    [
      decompositionCanvas,
      decompositionRegions,
      editorMode,
      projectSpriteSize,
      sprites,
    ],
  );

  const decompositionRegionContextMenu = useMemo(
    () =>
      editorMode !== "decompose"
        ? O.none
        : pipe(
            decompositionRegionContextMenuState,
            O.chain((menuState) =>
              pipe(
                O.fromNullable(
                  decompositionAnalysis.regions.find(
                    (regionAnalysis) =>
                      regionAnalysis.region.id === menuState.regionId,
                  ),
                ),
                O.map(() => menuState),
              ),
            ),
          ),
    [
      decompositionAnalysis.regions,
      decompositionRegionContextMenuState,
      editorMode,
    ],
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

      setDecompositionRegionContextMenu(O.none);

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
    },
    [
      decompositionColorIndex,
      decompositionPaletteIndex,
      decompositionTool,
      projectSpriteSize,
      resolveDecompositionStagePoint,
      stageHeight,
      stageWidth,
    ],
  );

  const handleDecompositionRegionContextMenu = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement>,
      region: CharacterDecompositionRegion,
    ) => {
      if (editorMode !== "decompose") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setSelectedRegionId(O.some(region.id));
      setDecompositionRegionContextMenu(
        O.some({
          clientX: event.clientX,
          clientY: event.clientY,
          regionId: region.id,
        }),
      );
    },
    [editorMode],
  );

  const handleDecompositionRegionPointerDown = useCallback(
    (
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
      setDecompositionRegionContextMenu(O.none);
      setSelectedRegionId(O.some(region.id));
      setDecompositionRegionDragState(
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
    [decompositionTool, getStageRect, stageScale],
  );

  const removeDecompositionRegionById = useCallback((regionId: string) => {
    setDecompositionRegions((current) =>
      current.filter((region) => region.id !== regionId),
    );
    setSelectedRegionId((current) =>
      pipe(
        current,
        O.match(
          () => O.none,
          (selectedId) =>
            selectedId === regionId ? O.none : O.some(selectedId),
        ),
      ),
    );
    setDecompositionRegionContextMenu(O.none);
  }, []);

  const handleRemoveSelectedRegion = useCallback(() => {
    pipe(
      selectedRegionId,
      O.map((regionId) => removeDecompositionRegionById(regionId)),
    );
  }, [removeDecompositionRegionById, selectedRegionId]);

  const handleDeleteContextMenuRegion = useCallback(
    (regionId: string) => {
      removeDecompositionRegionById(regionId);
    },
    [removeDecompositionRegionById],
  );

  const handleApplyDecomposition = useCallback(
    (): boolean =>
      pipe(
        activeSet,
        O.match(
          () => false,
          (characterSet) => {
            const result = applyCharacterDecomposition({
              canvas: decompositionCanvas,
              regions: decompositionRegions,
              spriteSize: projectSpriteSize,
              sprites,
            });

            if (E.isLeft(result)) {
              return false;
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

            return true;
          },
        ),
      ),
    [
      activeSet,
      decompositionCanvas,
      decompositionRegions,
      projectSpriteSize,
      screen,
      sprites,
    ],
  );

  const handleWorkspacePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      if (editorMode === "decompose" && O.isSome(decompositionDrawState)) {
        if (decompositionDrawState.value.pointerId !== event.pointerId) {
          return false;
        }

        const pointOption = resolveDecompositionStagePoint(
          event.clientX,
          event.clientY,
        );
        if (O.isNone(pointOption)) {
          return false;
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
        return true;
      }

      if (
        editorMode === "decompose" &&
        O.isSome(decompositionRegionDragState)
      ) {
        if (decompositionRegionDragState.value.pointerId !== event.pointerId) {
          return false;
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
          return false;
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
        return true;
      }

      return false;
    },
    [
      decompositionColorIndex,
      decompositionDrawState,
      decompositionPaletteIndex,
      decompositionRegionDragState,
      decompositionTool,
      editorMode,
      projectSpriteSize,
      resolveDecompositionStagePoint,
      stageHeight,
      stageWidth,
    ],
  );

  const handleWorkspacePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): boolean => {
      if (O.isSome(decompositionDrawState)) {
        if (decompositionDrawState.value.pointerId !== event.pointerId) {
          return false;
        }

        setDecompositionDrawState(O.none);
        return true;
      }

      if (O.isSome(decompositionRegionDragState)) {
        if (decompositionRegionDragState.value.pointerId !== event.pointerId) {
          return false;
        }

        setDecompositionRegionDragState(O.none);
        return true;
      }

      return false;
    },
    [decompositionDrawState, decompositionRegionDragState],
  );

  const closeDecompositionRegionContextMenu = useCallback(() => {
    setDecompositionRegionContextMenu(O.none);
  }, []);

  const clearSelectedRegion = useCallback(() => {
    setSelectedRegionId(O.none);
  }, []);

  const clearRegionsAndSelection = useCallback(() => {
    setDecompositionRegions([]);
    setSelectedRegionId(O.none);
  }, []);

  const handleSelectRegion = useCallback((regionId: string) => {
    setSelectedRegionId(O.some(regionId));
  }, []);

  const handleDecompositionPaletteSelect = useCallback(
    (value: string | number) => {
      const parsed = Number(String(value));
      if (parsed === 0 || parsed === 1 || parsed === 2 || parsed === 3) {
        setDecompositionPaletteIndex(parsed);
      }
    },
    [],
  );

  const handleDecompositionToolChange = useCallback(
    (tool: DecompositionTool) => {
      setDecompositionTool(tool);
    },
    [],
  );

  const handleDecompositionColorSlotSelect = useCallback(
    (slotIndex: 1 | 2 | 3) => {
      setDecompositionColorIndex(slotIndex);
      setDecompositionTool("pen");
    },
    [],
  );

  const resizeToStage = useCallback(
    (nextWidth: number, nextHeight: number) => {
      setDecompositionCanvas((current) =>
        resizeDecompositionCanvas(current, nextWidth, nextHeight),
      );
      setDecompositionRegions((current) =>
        clampDecompositionRegions(
          current,
          nextWidth,
          nextHeight,
          projectSpriteSize,
        ),
      );
    },
    [projectSpriteSize],
  );

  return {
    clearRegionsAndSelection,
    clearSelectedRegion,
    closeDecompositionRegionContextMenu,
    decompositionAnalysis,
    decompositionCanvasCursor,
    decompositionColorIndex,
    decompositionInvalidRegionCount,
    decompositionPaletteIndex,
    decompositionRegionContextMenu,
    decompositionRegions,
    decompositionTool,
    decompositionValidRegionCount,
    handleApplyDecomposition,
    handleDecompositionCanvasPointerDown,
    handleDecompositionCanvasRef,
    handleDecompositionColorSlotSelect,
    handleDecompositionPaletteSelect,
    handleDecompositionRegionContextMenu,
    handleDecompositionRegionPointerDown,
    handleDecompositionToolChange,
    handleDeleteContextMenuRegion,
    handleRemoveSelectedRegion,
    handleSelectRegion,
    handleWorkspacePointerEnd,
    handleWorkspacePointerMove,
    resizeToStage,
    selectedRegionAnalysis,
    selectedRegionId,
  };
};
