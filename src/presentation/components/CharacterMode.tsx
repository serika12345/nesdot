import { type CSSObject } from "@emotion/react";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useMemo, useRef, useState } from "react";
import { useCharacterState } from "../../application/state/characterStore";
import { useProjectState } from "../../application/state/projectStore";
import {
  buildCharacterPreviewHexGrid,
  CharacterSet,
  CharacterSprite,
} from "../../domain/characters/characterSet";
import { renderSpriteTileToHexArray } from "../../domain/nes/rendering";
import useExportImage from "../../infrastructure/browser/useExportImage";
import {
  Badge,
  CanvasViewport,
  DetailList,
  DetailRow,
  Field,
  FieldGrid,
  FieldLabel,
  HelperText,
  NumberInput,
  Panel,
  PanelHeader,
  PanelHeaderRow,
  PanelTitle,
  ScrollArea,
  SelectInput,
  ToolButton,
} from "../App.styles";
import {
  ensureSelectedCharacterSpriteIndex,
  getCharacterLayerEntries,
  getNextCharacterSpriteLayer,
  resolveCharacterStagePoint,
  resolveSelectionAfterSpriteRemoval,
} from "./characterEditorModel";
import { ProjectActions } from "./ProjectActions";

const PREVIEW_TRANSPARENT_HEX = "#00000000";
const STAGE_WIDTH = 256;
const STAGE_HEIGHT = 240;
const STAGE_MIN_WIDTH = 64;
const STAGE_MAX_WIDTH = 1024;
const STAGE_MIN_HEIGHT = 64;
const STAGE_MAX_HEIGHT = 960;
const STAGE_MIN_SCALE = 1;
const STAGE_MAX_SCALE = 6;
const STAGE_DEFAULT_SCALE = 2;
const LIBRARY_PREVIEW_SCALE = 3;
const INSPECTOR_PREVIEW_SCALE = 4;

interface DragState {
  spriteEditorIndex: number;
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

interface LibraryDragState {
  spriteIndex: number;
  pointerId: number;
  clientX: number;
  clientY: number;
  isOverStage: boolean;
  stageX: number;
  stageY: number;
}

interface ViewportPanState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startScrollLeft: number;
  startScrollTop: number;
}

type CharacterPreviewState =
  | { kind: "none" }
  | { kind: "error"; message: string }
  | { kind: "ready"; characterSet: CharacterSet; grid: string[][] };

const editorCardStyles: CSSObject = {
  position: "relative",
  zIndex: 1,
  minHeight: 0,
  display: "grid",
  gap: 14,
  padding: 16,
  borderRadius: 22,
  background: "rgba(248, 250, 252, 0.84)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.72)",
};

const sidebarStyles: CSSObject = {
  minHeight: 0,
  display: "grid",
  gap: 16,
};

const isInRange = (value: number, min: number, max: number): boolean =>
  value >= min && value <= max;

const toNumber = (value: string): O.Option<number> => {
  if (value === "") {
    return O.none;
  }

  const parsed = Number(value);
  if (Number.isInteger(parsed) === false) {
    return O.none;
  }

  return O.some(parsed);
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const trySetPointerCapture = (
  target: HTMLElement,
  pointerId: number,
): void => {
  try {
    target.setPointerCapture(pointerId);
  } catch {
    // Synthetic pointer events used in tests may not have a capturable pointer.
  }
};

export const CharacterMode: React.FC = () => {
  const [newName, setNewName] = useState("New Character");
  const [stageWidth, setStageWidth] = useState(STAGE_WIDTH);
  const [stageHeight, setStageHeight] = useState(STAGE_HEIGHT);
  const [stageScale, setStageScale] = useState(STAGE_DEFAULT_SCALE);
  const [dragState, setDragState] = useState<O.Option<DragState>>(O.none);
  const [libraryDragState, setLibraryDragState] = useState<
    O.Option<LibraryDragState>
  >(O.none);
  const [viewportPanState, setViewportPanState] = useState<
    O.Option<ViewportPanState>
  >(O.none);
  const [selectedSpriteEditorIndex, setSelectedSpriteEditorIndex] = useState<
    O.Option<number>
  >(O.none);
  const stageElementRef = useRef<O.Option<HTMLDivElement>>(O.none);
  const viewportElementRef = useRef<O.Option<HTMLDivElement>>(O.none);

  const characterSets = useCharacterState((s) => s.characterSets);
  const selectedCharacterId = useCharacterState((s) => s.selectedCharacterId);
  const createSet = useCharacterState((s) => s.createSet);
  const selectSet = useCharacterState((s) => s.selectSet);
  const renameSet = useCharacterState((s) => s.renameSet);
  const addSprite = useCharacterState((s) => s.addSprite);
  const setSprite = useCharacterState((s) => s.setSprite);
  const removeSprite = useCharacterState((s) => s.removeSprite);
  const deleteSet = useCharacterState((s) => s.deleteSet);

  const sprites = useProjectState((s) => s.sprites);
  const spritePalettes = useProjectState((s) => s.nes.spritePalettes);
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

  const layerEntries = useMemo(
    () =>
      pipe(
        activeSet,
        O.match(
          () => [],
          (characterSet) => getCharacterLayerEntries(characterSet.sprites),
        ),
      ),
    [activeSet],
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

  const previewSizeLabel = (() => {
    if (previewState.kind !== "ready") {
      return "0×0";
    }

    const firstRow = previewState.grid[0];
    const width = firstRow?.length ?? 0;
    return `${width}×${previewState.grid.length}`;
  })();

  const stageHelperMessage = pipe(
    activeSet,
    O.match(
      () => "左のセット欄でキャラクターセットを作成してください。",
      (characterSet) =>
        characterSet.sprites.length === 0
          ? "左のスプライトライブラリからステージ中央へドラッグして配置を始めます。"
          : "",
    ),
  );

  const stageStatusMessage =
    previewState.kind === "error"
      ? `プレビュー生成に失敗しました: ${previewState.message}`
      : "中央のステージで位置をドラッグ調整できます。Ctrl+ホイールで拡大縮小し、中ボタンドラッグで領域移動できます。";

  const getStageRect = (): O.Option<DOMRect> =>
    pipe(
      stageElementRef.current,
      O.map((stage) => stage.getBoundingClientRect()),
    );

  const getViewportElement = (): O.Option<HTMLDivElement> =>
    viewportElementRef.current;

  const updateStageScale = (
    nextScale: number,
    anchor: O.Option<{ clientX: number; clientY: number }> = O.none,
  ) => {
    setStageScale((current) => {
      const clampedScale = clamp(nextScale, STAGE_MIN_SCALE, STAGE_MAX_SCALE);

      if (clampedScale === current) {
        return current;
      }

      if (O.isNone(anchor)) {
        return clampedScale;
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

          window.requestAnimationFrame(() => {
            viewport.scrollTo({
              left: (currentStageX / current) * clampedScale - relativeX,
              top: (currentStageY / current) * clampedScale - relativeY,
            });
          });
        }),
      );

      return clampedScale;
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

  const renderSpritePixels = (spriteIndex: number, scale: number) => {
    const tileOption = O.fromNullable(sprites[spriteIndex]);
    if (O.isNone(tileOption)) {
      return (
        <div
          css={{
            width: 8 * scale,
            height: 16 * scale,
            borderRadius: 8,
            background:
              "linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.02))",
            border: "1px dashed rgba(148, 163, 184, 0.34)",
          }}
        />
      );
    }

    const tile = tileOption.value;
    const hexPixels = renderSpriteTileToHexArray(tile, spritePalettes);

    return (
      <div
        css={{
          display: "grid",
          gridTemplateColumns: `repeat(${tile.width}, ${scale}px)`,
          width: tile.width * scale,
          height: tile.height * scale,
        }}
      >
        {tile.pixels.map((pixelRow, rowIndex) =>
          pixelRow.map((colorIndex, columnIndex) => {
            const hexRowOption = O.fromNullable(hexPixels[rowIndex]);
            const hexOption = pipe(
              hexRowOption,
              O.chain((row) => O.fromNullable(row[columnIndex])),
            );
            const colorHex = pipe(
              hexOption,
              O.getOrElse(() => PREVIEW_TRANSPARENT_HEX),
            );
            const isTransparent = colorIndex === 0;
            return (
              <div
                key={`pixel-${spriteIndex}-${rowIndex}-${columnIndex}`}
                css={{
                  width: scale,
                  height: scale,
                  backgroundColor: isTransparent ? "transparent" : colorHex,
                }}
              />
            );
          }),
        )}
      </div>
    );
  };

  const handleCreateSet = () => {
    createSet({ name: newName });
    setSelectedSpriteEditorIndex(O.none);
    setDragState(O.none);
    setLibraryDragState(O.none);
  };

  const handleSelectSet = (value: string) => {
    selectSet(value === "" ? O.none : O.some(value));
    setSelectedSpriteEditorIndex(O.none);
    setDragState(O.none);
    setLibraryDragState(O.none);
  };

  const handleDeleteSet = (setId: string) => {
    deleteSet(setId);
    setSelectedSpriteEditorIndex(O.none);
    setDragState(O.none);
    setLibraryDragState(O.none);
  };

  const handleZoomOut = () => {
    updateStageScale(stageScale - 1, O.none);
  };

  const handleZoomIn = () => {
    updateStageScale(stageScale + 1, O.none);
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

    const nextWidth = clamp(parsed.value, STAGE_MIN_WIDTH, STAGE_MAX_WIDTH);
    setStageWidth(nextWidth);
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

    const nextHeight = clamp(parsed.value, STAGE_MIN_HEIGHT, STAGE_MAX_HEIGHT);
    setStageHeight(nextHeight);
    pipe(
      activeSet,
      O.map((characterSet) =>
        clampSpritesToStage(characterSet.id, characterSet.sprites, stageWidth, nextHeight),
      ),
    );
  };

  const handleViewportWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey === false) {
      return;
    }

    event.preventDefault();
    updateStageScale(
      event.deltaY < 0 ? stageScale + 1 : stageScale - 1,
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

  const handleUpdateSprite = (
    setId: string,
    index: number,
    current: CharacterSprite,
    field: "spriteIndex" | "x" | "y" | "layer",
    rawValue: string,
  ) => {
    const parsed = toNumber(rawValue);
    if (O.isNone(parsed)) {
      return;
    }

    const nextValue = parsed.value;
    const nextSprite: CharacterSprite = {
      spriteIndex: field === "spriteIndex" ? nextValue : current.spriteIndex,
      x: field === "x" ? nextValue : current.x,
      y: field === "y" ? nextValue : current.y,
      layer: field === "layer" ? nextValue : current.layer,
    };

    const isValid =
      isInRange(nextSprite.spriteIndex, 0, 63) &&
      isInRange(nextSprite.x, 0, stageWidth - 1) &&
      isInRange(nextSprite.y, 0, stageHeight - 1) &&
      isInRange(nextSprite.layer, 0, 63);

    if (isValid === false) {
      return;
    }

    setSprite(setId, index, nextSprite);
  };

  const handleUpdateSelectedSprite = (
    field: "spriteIndex" | "x" | "y" | "layer",
    rawValue: string,
  ) => {
    pipe(
      activeSet,
      O.chain((characterSet) =>
        pipe(
          selectedSprite,
          O.map((entry) => ({
            characterSetId: characterSet.id,
            index: entry.index,
            sprite: entry.sprite,
          })),
        ),
      ),
      O.map((entry) =>
        handleUpdateSprite(
          entry.characterSetId,
          entry.index,
          entry.sprite,
          field,
          rawValue,
        ),
      ),
    );
  };

  const handleRemoveCharacterSprite = (
    setId: string,
    index: number,
    currentSpriteCount: number,
  ) => {
    removeSprite(setId, index);
    setSelectedSpriteEditorIndex((current) =>
      resolveSelectionAfterSpriteRemoval(
        current,
        index,
        currentSpriteCount - 1,
      ),
    );
    setDragState(O.none);
  };

  const handleLibraryPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    spriteIndex: number,
  ) => {
    if (event.button !== 0 || O.isNone(activeSet)) {
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

  const handleSpritePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    spriteEditorIndex: number,
    sprite: CharacterSprite,
  ) => {
    if (event.button !== 0) {
      return;
    }

    const stageRectOption = getStageRect();
    if (O.isNone(stageRectOption)) {
      return;
    }

    const stageRect = stageRectOption.value;
    setSelectedSpriteEditorIndex(O.some(spriteEditorIndex));
    setDragState(
      O.some({
        spriteEditorIndex,
        pointerId: event.pointerId,
        offsetX: event.clientX - (stageRect.left + sprite.x * stageScale),
        offsetY: event.clientY - (stageRect.top + sprite.y * stageScale),
      }),
    );
  };

  const handleStagePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (O.isNone(dragState) || O.isNone(activeSet)) {
      return;
    }

    const currentDrag = dragState.value;
    if (currentDrag.pointerId !== event.pointerId) {
      return;
    }

    const stageRectOption = getStageRect();
    if (O.isNone(stageRectOption)) {
      return;
    }

    const spriteOption = O.fromNullable(
      activeSet.value.sprites[currentDrag.spriteEditorIndex],
    );
    if (O.isNone(spriteOption)) {
      return;
    }

    const nextPoint = resolveCharacterStagePoint({
      clientX: event.clientX,
      clientY: event.clientY,
      stageLeft: stageRectOption.value.left,
      stageTop: stageRectOption.value.top,
      stageScale,
      offsetX: currentDrag.offsetX,
      offsetY: currentDrag.offsetY,
      minX: 0,
      maxX: stageWidth - 1,
      minY: 0,
      maxY: stageHeight - 1,
    });
    const currentSprite = spriteOption.value;

    if (nextPoint.x === currentSprite.x && nextPoint.y === currentSprite.y) {
      return;
    }

    setSprite(activeSet.value.id, currentDrag.spriteEditorIndex, {
      ...currentSprite,
      x: nextPoint.x,
      y: nextPoint.y,
    });
  };

  const handleStagePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (O.isNone(dragState)) {
      return;
    }

    if (dragState.value.pointerId !== event.pointerId) {
      return;
    }

    setDragState(O.none);
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
    if (O.isNone(libraryDragState)) {
      return;
    }

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
  };

  const handleWorkspacePointerEnd = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (O.isNone(libraryDragState)) {
      return;
    }

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
        setSelectedSpriteEditorIndex(O.some(characterSet.sprites.length));
      }),
    );
    setLibraryDragState(O.none);
  };

  return (
    <Panel css={{ gridTemplateRows: "auto minmax(0, 1fr)" }}>
      <PanelHeader>
        <PanelHeaderRow>
          <PanelTitle>キャラクター編集</PanelTitle>
          <ProjectActions
            actions={pipe(
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
                      void exportPng(
                        previewState.grid,
                        `${characterSet.name}.png`,
                      );
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
            )}
          />
        </PanelHeaderRow>
      </PanelHeader>

      <div
        onPointerMoveCapture={handleWorkspacePointerMove}
        onPointerUpCapture={handleWorkspacePointerEnd}
        onPointerCancelCapture={handleWorkspacePointerEnd}
        css={{
          minHeight: 0,
          display: "grid",
          gridTemplateRows: "auto minmax(0, 1fr) auto",
          gap: 16,
        }}
      >
        <FieldGrid
          css={{
            gridTemplateColumns: "minmax(0, 1.2fr) auto minmax(0, 1fr)",
            alignItems: "end",
            "@media (max-width: 1200px)": {
              gridTemplateColumns: "minmax(0, 1fr) auto",
            },
            "@media (max-width: 760px)": {
              gridTemplateColumns: "minmax(0, 1fr)",
            },
          }}
        >
          <Field>
            <FieldLabel>新規セット名</FieldLabel>
            <NumberInput
              as="input"
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
          </Field>
          <ToolButton type="button" tone="primary" onClick={handleCreateSet}>
            セットを作成
          </ToolButton>
          <Field>
            <FieldLabel>編集中のセット</FieldLabel>
            <div css={{ position: "relative" }}>
              <SelectInput
                aria-label="編集中のセット"
                css={{ paddingRight: 56 }}
                value={pipe(
                  selectedCharacterId,
                  O.match(
                    () => "",
                    (value) => value,
                  ),
                )}
                onChange={(event) => handleSelectSet(event.target.value)}
              >
                {characterSets.length === 0 && (
                  <option value="">キャラクターセットがありません</option>
                )}
                {characterSets.map((characterSet) => (
                  <option key={characterSet.id} value={characterSet.id}>
                    {`${characterSet.name} (${characterSet.sprites.length} sprites)`}
                  </option>
                ))}
              </SelectInput>
              <span
                aria-hidden="true"
                css={{
                  position: "absolute",
                  right: 18,
                  top: "50%",
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "7px solid #334155",
                  transform: "translateY(-35%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </Field>
        </FieldGrid>

        <div
          css={{
            minHeight: 0,
            display: "grid",
            gridTemplateColumns:
              "minmax(240px, 280px) minmax(0, 1fr) minmax(260px, 320px)",
            gap: 16,
            "@media (max-width: 1500px)": {
              gridTemplateColumns: "minmax(220px, 260px) minmax(0, 1fr)",
              gridTemplateRows: "minmax(440px, 1fr) auto",
            },
            "@media (max-width: 980px)": {
              gridTemplateColumns: "minmax(0, 1fr)",
              gridTemplateRows: "auto minmax(440px, 1fr) auto",
            },
          }}
        >
          <div css={sidebarStyles}>
            <div css={editorCardStyles}>
              <Field>
                <FieldLabel>セット名</FieldLabel>
                <NumberInput
                  as="input"
                  type="text"
                  value={activeSetName}
                  disabled={O.isNone(activeSet)}
                  onChange={(event) =>
                    pipe(
                      activeSet,
                      O.map((characterSet) =>
                        renameSet(characterSet.id, event.target.value),
                      ),
                    )
                  }
                />
              </Field>

              <DetailList>
                <DetailRow>
                  <FieldLabel>構成スプライト</FieldLabel>
                  <Badge tone="accent">{activeSetSpriteCount} sprites</Badge>
                </DetailRow>
                <DetailRow>
                  <FieldLabel>プレビューサイズ</FieldLabel>
                  <Badge tone="neutral">{previewSizeLabel}</Badge>
                </DetailRow>
              </DetailList>

              <ToolButton
                type="button"
                tone="danger"
                disabled={O.isNone(activeSet)}
                onClick={() => {
                  if (activeSetId === "") {
                    return;
                  }
                  handleDeleteSet(activeSetId);
                }}
              >
                セットを削除
              </ToolButton>
            </div>

            <div
              css={{
                ...editorCardStyles,
                gridTemplateRows: "auto auto minmax(0, 1fr)",
              }}
            >
              <PanelHeaderRow>
                <FieldLabel>スプライトライブラリ</FieldLabel>
                <Badge tone="neutral">{sprites.length} slots</Badge>
              </PanelHeaderRow>

              <HelperText>
                一覧からステージへドラッグして追加します。配置後は中央で直接動かせます。
              </HelperText>

              <ScrollArea css={{ minHeight: 0, paddingRight: 0 }}>
                <div
                  css={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                  }}
                >
                  {sprites.map((spriteTile, spriteIndex) => {
                    const isDragging = pipe(
                      libraryDragState,
                      O.match(
                        () => false,
                        (drag) => drag.spriteIndex === spriteIndex,
                      ),
                    );

                    return (
                      <button
                        key={`library-sprite-${spriteIndex}`}
                        type="button"
                        draggable={false}
                        aria-label={`ライブラリスプライト ${spriteIndex}`}
                        onDragStart={(event) => event.preventDefault()}
                        onPointerDown={(event) =>
                          handleLibraryPointerDown(event, spriteIndex)
                        }
                        css={{
                          appearance: "none",
                          display: "grid",
                          gap: 10,
                          justifyItems: "center",
                          minHeight: 118,
                          padding: 12,
                          borderRadius: 18,
                          border: isDragging
                            ? "1px solid rgba(15, 118, 110, 0.42)"
                            : "1px solid rgba(148, 163, 184, 0.2)",
                          background: isDragging
                            ? "rgba(240, 253, 250, 0.96)"
                            : "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.94))",
                          color: "var(--ink-strong)",
                          cursor: O.isSome(activeSet) ? "grab" : "default",
                          userSelect: "none",
                          touchAction: "none",
                          transition:
                            "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
                          boxShadow: isDragging
                            ? "0 16px 30px rgba(15, 118, 110, 0.16)"
                            : "0 10px 18px rgba(15, 23, 42, 0.08)",
                        }}
                      >
                        <span
                          css={{
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--ink-soft)",
                          }}
                        >
                          {`Sprite ${spriteIndex}`}
                        </span>
                        <div
                          css={{
                            width: 88,
                            minHeight: 64,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 14,
                            background:
                              "linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(148, 163, 184, 0.08))",
                          }}
                        >
                          {renderSpritePixels(
                            spriteIndex,
                            LIBRARY_PREVIEW_SCALE,
                          )}
                        </div>
                        <Badge tone="accent">{`${spriteTile.width}×${spriteTile.height}`}</Badge>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div
            css={{
              ...editorCardStyles,
              gridTemplateRows: "auto minmax(0, 1fr)",
            }}
          >
            <div
              css={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 12,
                alignItems: "center",
                "@media (max-width: 700px)": {
                  gridTemplateColumns: "minmax(0, 1fr)",
                },
              }}
            >
              <div css={{ display: "grid", gap: 8 }}>
                <PanelHeaderRow>
                  <FieldLabel>プレビューキャンバス</FieldLabel>
                  <Badge tone="accent">{activeSetSpriteCount} items</Badge>
                </PanelHeaderRow>
                <HelperText>
                  サイズ指定に対応したプレビューです。Ctrl+ホイールで拡大縮小し、中ボタンドラッグで表示領域を移動できます。
                </HelperText>
              </div>

              <div
                css={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(96px, 120px)) auto minmax(120px, 1fr) auto auto",
                  gap: 10,
                  alignItems: "center",
                  "@media (max-width: 700px)": {
                    gridTemplateColumns: "repeat(3, auto)",
                    justifyContent: "start",
                  },
                }}
              >
                <NumberInput
                  aria-label="プレビューキャンバス幅"
                  type="number"
                  min={STAGE_MIN_WIDTH}
                  max={STAGE_MAX_WIDTH}
                  step={8}
                  value={stageWidth}
                  onChange={(event) => handleStageWidthChange(event.target.value)}
                />
                <NumberInput
                  aria-label="プレビューキャンバス高さ"
                  type="number"
                  min={STAGE_MIN_HEIGHT}
                  max={STAGE_MAX_HEIGHT}
                  step={8}
                  value={stageHeight}
                  onChange={(event) =>
                    handleStageHeightChange(event.target.value)
                  }
                />
                <Badge tone="neutral">{`${stageScale}x`}</Badge>
                <NumberInput
                  aria-label="ステージズーム"
                  type="range"
                  min={STAGE_MIN_SCALE}
                  max={STAGE_MAX_SCALE}
                  step={1}
                  value={stageScale}
                  onChange={(event) =>
                    updateStageScale(
                      clamp(Number(event.target.value), STAGE_MIN_SCALE, STAGE_MAX_SCALE),
                      O.none,
                    )
                  }
                />
                <ToolButton type="button" onClick={handleZoomOut}>
                  -
                </ToolButton>
                <ToolButton type="button" onClick={handleZoomIn}>
                  +
                </ToolButton>
              </div>
            </div>

            <CanvasViewport
              ref={(element: HTMLDivElement | null) => {
                viewportElementRef.current = O.fromNullable(element);
              }}
              aria-label="プレビューキャンバスビュー"
              onWheel={handleViewportWheel}
              onPointerDown={handleViewportPointerDown}
              onPointerMove={handleViewportPointerMove}
              onPointerUp={handleViewportPointerEnd}
              onPointerCancel={handleViewportPointerEnd}
              onMouseDown={(event) => {
                if (event.button === 1) {
                  event.preventDefault();
                }
              }}
              css={{
                minHeight: 0,
                display: "grid",
                placeItems: "center",
                padding: 24,
                borderRadius: 0,
                overscrollBehavior: "contain",
                cursor: O.isSome(viewportPanState) ? "grabbing" : "default",
              }}
            >
              <div
                css={{
                  minWidth: "100%",
                  minHeight: "100%",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <div
                  ref={(element) => {
                    stageElementRef.current = O.fromNullable(element);
                  }}
                  aria-label="キャラクターステージ"
                  onPointerMove={handleStagePointerMove}
                  onPointerUp={handleStagePointerEnd}
                  onPointerCancel={handleStagePointerEnd}
                  onPointerLeave={handleStagePointerEnd}
                  css={{
                    position: "relative",
                    width: stageWidth * stageScale,
                    height: stageHeight * stageScale,
                    minWidth: stageWidth * stageScale,
                    minHeight: stageHeight * stageScale,
                    overflow: "hidden",
                    border: isStageDropActive
                      ? "1px solid rgba(45, 212, 191, 0.72)"
                      : "1px solid rgba(148, 163, 184, 0.22)",
                    background:
                      "linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.98))",
                    boxShadow:
                      "0 28px 60px rgba(15, 23, 42, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.92)",
                    transform: isStageDropActive ? "scale(1.01)" : "none",
                    transition:
                      "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      backgroundImage: [
                        "linear-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px)",
                        "linear-gradient(90deg, rgba(148, 163, 184, 0.15) 1px, transparent 1px)",
                      ].join(", "),
                      backgroundSize: `${stageScale * 8}px ${stageScale * 8}px`,
                      opacity: 0.8,
                      pointerEvents: "none",
                    },
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      backgroundImage: [
                        "linear-gradient(rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.12))",
                        "linear-gradient(90deg, rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.12))",
                      ].join(", "),
                      backgroundSize: `1px ${stageHeight * stageScale}px, ${stageWidth * stageScale}px 1px`,
                      backgroundPosition: `${Math.floor((stageWidth * stageScale) / 2)}px 0, 0 ${Math.floor((stageHeight * stageScale) / 2)}px`,
                      backgroundRepeat: "no-repeat",
                      pointerEvents: "none",
                    },
                  }}
                >
                  {pipe(
                    activeSet,
                    O.match(
                      () => [],
                      (characterSet) => characterSet.sprites,
                    ),
                  ).map((sprite, spriteEditorIndex) => {
                    const isSelected = pipe(
                      validSelectedSpriteEditorIndex,
                      O.match(
                        () => false,
                        (value) => value === spriteEditorIndex,
                      ),
                    );

                    return (
                      <div
                        key={`stage-sprite-${spriteEditorIndex}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`配置スプライト ${spriteEditorIndex}`}
                        onPointerDown={(event) =>
                          handleSpritePointerDown(
                            event,
                            spriteEditorIndex,
                            sprite,
                          )
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedSpriteEditorIndex(
                              O.some(spriteEditorIndex),
                            );
                          }
                        }}
                        css={{
                          position: "absolute",
                          left: sprite.x * stageScale,
                          top: sprite.y * stageScale,
                          zIndex: sprite.layer + 1,
                          cursor: "grab",
                          outline: isSelected
                            ? "2px solid rgba(15, 118, 110, 0.9)"
                            : "1px solid rgba(148, 163, 184, 0.32)",
                          borderRadius: 8,
                          boxShadow: isSelected
                            ? "0 0 0 6px rgba(15, 118, 110, 0.14)"
                            : "0 8px 14px rgba(15, 23, 42, 0.12)",
                          background: "rgba(255, 255, 255, 0.84)",
                          padding: 2,
                        }}
                      >
                        {renderSpritePixels(sprite.spriteIndex, stageScale)}
                      </div>
                    );
                  })}

                  {pipe(
                    libraryDragState,
                    O.match(
                      () => <></>,
                      (drag) => {
                        if (drag.isOverStage === false) {
                          return <></>;
                        }

                        return (
                          <div
                            key={`library-preview-${drag.spriteIndex}`}
                            css={{
                              position: "absolute",
                              left: drag.stageX * stageScale,
                              top: drag.stageY * stageScale,
                              opacity: 0.6,
                              pointerEvents: "none",
                              outline: "2px dashed rgba(15, 118, 110, 0.72)",
                              borderRadius: 8,
                              boxShadow: "0 0 0 6px rgba(15, 118, 110, 0.12)",
                              background: "rgba(255, 255, 255, 0.72)",
                              padding: 2,
                            }}
                          >
                            {renderSpritePixels(drag.spriteIndex, stageScale)}
                          </div>
                        );
                      },
                    ),
                  )}

                  {stageHelperMessage !== "" && (
                    <div
                      css={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        padding: 24,
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        css={{
                          maxWidth: 320,
                          padding: "16px 18px",
                          borderRadius: 18,
                          background: "rgba(255, 255, 255, 0.92)",
                          border: "1px solid rgba(148, 163, 184, 0.18)",
                          boxShadow: "0 18px 36px rgba(15, 23, 42, 0.12)",
                          textAlign: "center",
                          color: "var(--ink-soft)",
                          fontSize: 14,
                          lineHeight: 1.7,
                        }}
                      >
                        {stageHelperMessage}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CanvasViewport>
          </div>

          <div
            css={{
              ...sidebarStyles,
              "@media (max-width: 1500px)": {
                gridColumn: "1 / -1",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              },
              "@media (max-width: 980px)": {
                gridTemplateColumns: "minmax(0, 1fr)",
              },
            }}
          >
            <div css={editorCardStyles}>
              <PanelHeaderRow>
                <FieldLabel>選択中のスプライト</FieldLabel>
                <Badge tone="neutral">
                  {pipe(
                    validSelectedSpriteEditorIndex,
                    O.match(
                      () => "none",
                      (value) => `#${value}`,
                    ),
                  )}
                </Badge>
              </PanelHeaderRow>

              <div
                css={{
                  minHeight: 108,
                  borderRadius: 18,
                  display: "grid",
                  placeItems: "center",
                  background:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.92))",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                }}
              >
                {pipe(
                  selectedSprite,
                  O.match(
                    () => (
                      <HelperText>
                        ステージか右下のレイヤー一覧から対象を選択してください。
                      </HelperText>
                    ),
                    (entry) =>
                      renderSpritePixels(
                        entry.sprite.spriteIndex,
                        INSPECTOR_PREVIEW_SCALE,
                      ),
                  ),
                )}
              </div>

              <FieldGrid
                css={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
              >
                <Field>
                  <FieldLabel>sprite</FieldLabel>
                  <NumberInput
                    aria-label="選択中スプライト番号"
                    type="number"
                    min={0}
                    max={63}
                    disabled={O.isNone(selectedSprite)}
                    value={pipe(
                      selectedSprite,
                      O.match(
                        () => "",
                        (entry) => `${entry.sprite.spriteIndex}`,
                      ),
                    )}
                    onChange={(event) =>
                      handleUpdateSelectedSprite(
                        "spriteIndex",
                        event.target.value,
                      )
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>layer</FieldLabel>
                  <NumberInput
                    aria-label="選択中レイヤー"
                    type="number"
                    min={0}
                    max={63}
                    disabled={O.isNone(selectedSprite)}
                    value={pipe(
                      selectedSprite,
                      O.match(
                        () => "",
                        (entry) => `${entry.sprite.layer}`,
                      ),
                    )}
                    onChange={(event) =>
                      handleUpdateSelectedSprite("layer", event.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>x</FieldLabel>
                  <NumberInput
                    aria-label="選択中X座標"
                    type="number"
                    min={0}
                    max={stageWidth - 1}
                    disabled={O.isNone(selectedSprite)}
                    value={pipe(
                      selectedSprite,
                      O.match(
                        () => "",
                        (entry) => `${entry.sprite.x}`,
                      ),
                    )}
                    onChange={(event) =>
                      handleUpdateSelectedSprite("x", event.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel>y</FieldLabel>
                  <NumberInput
                    aria-label="選択中Y座標"
                    type="number"
                    min={0}
                    max={stageHeight - 1}
                    disabled={O.isNone(selectedSprite)}
                    value={pipe(
                      selectedSprite,
                      O.match(
                        () => "",
                        (entry) => `${entry.sprite.y}`,
                      ),
                    )}
                    onChange={(event) =>
                      handleUpdateSelectedSprite("y", event.target.value)
                    }
                  />
                </Field>
              </FieldGrid>

              <ToolButton
                type="button"
                tone="danger"
                disabled={O.isNone(activeSet) || O.isNone(selectedSprite)}
                onClick={() =>
                  pipe(
                    activeSet,
                    O.chain((characterSet) =>
                      pipe(
                        selectedSprite,
                        O.map((entry) => ({
                          setId: characterSet.id,
                          index: entry.index,
                          count: characterSet.sprites.length,
                        })),
                      ),
                    ),
                    O.map((entry) =>
                      handleRemoveCharacterSprite(
                        entry.setId,
                        entry.index,
                        entry.count,
                      ),
                    ),
                  )
                }
              >
                選択中スプライトを削除
              </ToolButton>
            </div>

            <div
              css={{
                ...editorCardStyles,
                gridTemplateRows: "auto minmax(0, 1fr)",
              }}
            >
              <PanelHeaderRow>
                <FieldLabel>レイヤー一覧</FieldLabel>
                <Badge tone="accent">{layerEntries.length} layers</Badge>
              </PanelHeaderRow>

              <ScrollArea css={{ minHeight: 0, paddingRight: 0 }}>
                <div css={{ display: "grid", gap: 10 }}>
                  {layerEntries.map((entry) => {
                    const isSelected = pipe(
                      validSelectedSpriteEditorIndex,
                      O.match(
                        () => false,
                        (value) => value === entry.index,
                      ),
                    );

                    return (
                      <div
                        key={`layer-entry-${entry.index}`}
                        css={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) auto",
                          gap: 10,
                          alignItems: "stretch",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSpriteEditorIndex(O.some(entry.index))
                          }
                          css={{
                            appearance: "none",
                            display: "grid",
                            gridTemplateColumns: "72px minmax(0, 1fr)",
                            gap: 12,
                            alignItems: "center",
                            padding: 12,
                            borderRadius: 18,
                            border: isSelected
                              ? "1px solid rgba(15, 118, 110, 0.38)"
                              : "1px solid rgba(148, 163, 184, 0.2)",
                            background: isSelected
                              ? "rgba(240, 253, 250, 0.96)"
                              : "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.94))",
                            color: "var(--ink-strong)",
                            textAlign: "left",
                            boxShadow: isSelected
                              ? "0 18px 32px rgba(15, 118, 110, 0.12)"
                              : "0 10px 18px rgba(15, 23, 42, 0.06)",
                          }}
                        >
                          <div
                            css={{
                              minHeight: 56,
                              display: "grid",
                              placeItems: "center",
                              borderRadius: 14,
                              background:
                                "linear-gradient(180deg, rgba(15, 23, 42, 0.06), rgba(148, 163, 184, 0.08))",
                            }}
                          >
                            {renderSpritePixels(
                              entry.sprite.spriteIndex,
                              LIBRARY_PREVIEW_SCALE,
                            )}
                          </div>
                          <div css={{ display: "grid", gap: 6 }}>
                            <div
                              css={{
                                fontSize: 13,
                                fontWeight: 800,
                                letterSpacing: "0.02em",
                              }}
                            >
                              {`Sprite ${entry.index}`}
                            </div>
                            <div
                              css={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                              }}
                            >
                              <Badge tone="neutral">
                                {`x:${entry.sprite.x}`}
                              </Badge>
                              <Badge tone="neutral">
                                {`y:${entry.sprite.y}`}
                              </Badge>
                              <Badge tone="accent">
                                {`layer:${entry.sprite.layer}`}
                              </Badge>
                            </div>
                          </div>
                        </button>

                        <ToolButton
                          type="button"
                          tone="danger"
                          css={{ padding: "10px 12px" }}
                          onClick={() =>
                            pipe(
                              activeSet,
                              O.map((characterSet) =>
                                handleRemoveCharacterSprite(
                                  characterSet.id,
                                  entry.index,
                                  characterSet.sprites.length,
                                ),
                              ),
                            )
                          }
                        >
                          削除
                        </ToolButton>
                      </div>
                    );
                  })}

                  {layerEntries.length === 0 && (
                    <div
                      css={{
                        padding: 18,
                        borderRadius: 18,
                        border: "1px dashed rgba(148, 163, 184, 0.28)",
                        color: "var(--ink-soft)",
                        fontSize: 14,
                        lineHeight: 1.7,
                        background: "rgba(255, 255, 255, 0.72)",
                      }}
                    >
                      まだスプライトがありません。左のライブラリからドラッグして構成を作ります。
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <HelperText>{stageStatusMessage}</HelperText>

        {pipe(
          libraryDragState,
          O.match(
            () => <></>,
            (drag) => (
              <div
                aria-label="ライブラリドラッグプレビュー"
                css={{
                  position: "fixed",
                  left: drag.clientX + 18,
                  top: drag.clientY + 18,
                  zIndex: 200,
                  pointerEvents: "none",
                  display: "grid",
                  placeItems: "center",
                  width: 64,
                  minHeight: 64,
                  padding: 10,
                  borderRadius: 18,
                  background:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.92))",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  boxShadow: "0 18px 34px rgba(15, 23, 42, 0.18)",
                  opacity: 0.92,
                }}
              >
                {renderSpritePixels(drag.spriteIndex, LIBRARY_PREVIEW_SCALE)}
              </div>
            ),
          ),
        )}
      </div>
    </Panel>
  );
};
