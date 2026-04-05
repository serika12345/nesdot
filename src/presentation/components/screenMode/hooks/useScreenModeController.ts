import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import React, { useMemo, useRef, useState } from "react";
import { useCharacterState } from "../../../../application/state/characterStore";
import {
  getHexArrayForScreen,
  type Screen,
  type SpriteInScreen,
  type SpritePriority,
  useProjectState,
} from "../../../../application/state/projectStore";
import { expandCharacterToScreenSprites } from "../../../../domain/characters/characterSet";
import { scanNesSpriteConstraints } from "../../../../domain/screen/constraints";
import { mergeScreenIntoNesOam } from "../../../../domain/screen/oamSync";
import {
  getGroupBounds,
  isValidGroupMovement,
  moveGroupByDelta,
} from "../../../../domain/screen/spriteGroup";
import useExportImage from "../../../../infrastructure/browser/useExportImage";
import useImportImage from "../../../../infrastructure/browser/useImportImage";

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

interface ViewportPanState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startScrollLeft: number;
  startScrollTop: number;
}

/**
 * スクリーン配置画面の状態、検証、イベント処理を束ねるフックです。
 * 配置追加、グループ移動、選択編集、ズーム、書き出しを一つの制御面に集約して表示側を薄く保ちます。
 */
export const useScreenModeController = () => {
  const [spriteNumber, setSpriteNumber] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [screenZoomLevel, setScreenZoomLevel] = useState(
    SCREEN_DEFAULT_ZOOM_LEVEL,
  );
  const [selectedSpriteIndex, setSelectedSpriteIndex] = useState<
    O.Option<number>
  >(() =>
    useProjectState.getState().screen.sprites.length > 0 ? O.some(0) : O.none,
  );
  const [viewportPanState, setViewportPanState] = useState<
    O.Option<ViewportPanState>
  >(O.none);
  const [isPlacementOpen, setIsPlacementOpen] = useState(true);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [isGroupMoveOpen, setIsGroupMoveOpen] = useState(false);
  const [selectedSpriteIndices, setSelectedSpriteIndices] = useState<
    Set<number>
  >(() => new Set());
  const [groupMoveDeltaX, setGroupMoveDeltaX] = useState(0);
  const [groupMoveDeltaY, setGroupMoveDeltaY] = useState(0);
  const [characterBaseX, setCharacterBaseX] = useState(0);
  const [characterBaseY, setCharacterBaseY] = useState(0);

  const viewportElementRef = useRef<O.Option<HTMLDivElement>>(O.none);

  const screen = useProjectState((state) => state.screen);
  const nes = useProjectState((state) => state.nes);
  const sprites = useProjectState((state) => state.sprites);
  const spritesOnScreen = useProjectState((state) => state.screen.sprites);
  const projectState = useProjectState((state) => state);

  const characterSets = useCharacterState((state) => state.characterSets);
  const selectedCharacterId = useCharacterState(
    (state) => state.selectedCharacterId,
  );
  const selectCharacterSet = useCharacterState((state) => state.selectSet);

  const { exportPng, exportSvgSimple, exportJSON } = useExportImage();
  const { importJSON } = useImportImage();

  const scan = (
    checkeeScreen = useProjectState.getState().screen,
    checkeeNes = useProjectState.getState().nes,
  ) =>
    scanNesSpriteConstraints(mergeScreenIntoNesOam(checkeeNes, checkeeScreen));

  const setScreenAndSyncNes = (nextScreen: Screen, nextNes = nes): void => {
    useProjectState.setState({
      screen: nextScreen,
      nes: mergeScreenIntoNesOam(nextNes, nextScreen),
    });
  };

  const addToGroupSelection = (index: number): void => {
    setSelectedSpriteIndices((previous) => new Set([...previous, index]));
  };

  const removeFromGroupSelection = (index: number): void => {
    setSelectedSpriteIndices(
      (previous) =>
        new Set(Array.from(previous).filter((value) => value !== index)),
    );
  };

  const clearGroupSelection = (): void => {
    setSelectedSpriteIndices(new Set());
  };

  const handleMoveSelectedGroup = (): void => {
    if (selectedSpriteIndices.size === 0) {
      alert("グループを選択してください");
      return;
    }

    const isValid = isValidGroupMovement(
      spritesOnScreen,
      selectedSpriteIndices,
      groupMoveDeltaX,
      groupMoveDeltaY,
    );

    if (isValid !== true) {
      alert(
        "移動により一部のスプライトがスクリーン外に出ます。\n位置を調整してください。",
      );
      return;
    }

    const movedSprites = moveGroupByDelta(
      spritesOnScreen,
      selectedSpriteIndices,
      groupMoveDeltaX,
      groupMoveDeltaY,
    );

    const newScreen = {
      ...screen,
      sprites: movedSprites,
    };

    const report = scan(newScreen);
    if (report.ok === false) {
      alert(
        "グループの移動に失敗しました。制約違反:\n" + report.errors.join("\n"),
      );
      return;
    }

    setScreenAndSyncNes(newScreen);
    alert(
      `グループを (${groupMoveDeltaX > 0 ? "+" : ""}${groupMoveDeltaX}, ${groupMoveDeltaY > 0 ? "+" : ""}${groupMoveDeltaY}) 移動しました`,
    );
    setGroupMoveDeltaX(0);
    setGroupMoveDeltaY(0);
  };

  const handleImport = async () => {
    try {
      await importJSON((data) => {
        const syncedNes = mergeScreenIntoNesOam(data.nes, data.screen);
        useProjectState.setState({
          ...data,
          nes: syncedNes,
        });
        setSelectedSpriteIndex(
          data.screen.sprites.length > 0 ? O.some(0) : O.none,
        );

        const result = scan(data.screen, syncedNes);
        if (result.ok === false) {
          alert(
            "インポートしたデータに制約違反があります:\n" +
              result.errors.join("\n"),
          );
        }
      });
    } catch (error) {
      alert("インポートに失敗しました: " + error);
    }
  };

  const handleAddSprite = () => {
    const spriteTileOption = O.fromNullable(sprites[spriteNumber]);
    if (O.isNone(spriteTileOption)) {
      alert("指定されたスプライト番号のスプライトが存在しません");
      return;
    }
    const spriteTile = spriteTileOption.value;

    const candidate: SpriteInScreen = {
      ...spriteTile,
      x,
      y,
      spriteIndex: spriteNumber,
      priority: "front",
      flipH: false,
      flipV: false,
    };
    const newScreen = {
      ...screen,
      sprites: [...screen.sprites, candidate],
    };

    const report = scan(newScreen);
    if (report.ok === false) {
      alert(
        "スプライトの追加に失敗しました。制約違反:\n" +
          report.errors.join("\n"),
      );
      return;
    }

    setScreenAndSyncNes(newScreen);
    if (O.isNone(selectedSpriteIndex)) {
      setSelectedSpriteIndex(O.some(newScreen.sprites.length - 1));
    }
    alert(`スプライト#${spriteNumber}を(${x},${y})に追加しました`);
  };

  const activeSprite = pipe(
    selectedSpriteIndex,
    O.chain((index) => O.fromNullable(spritesOnScreen[index])),
  );

  const activeCharacter = pipe(
    selectedCharacterId,
    O.chain((id) =>
      O.fromNullable(
        characterSets.find((characterSet) => characterSet.id === id),
      ),
    ),
  );

  const handleAddCharacter = () => {
    const placement = pipe(
      activeCharacter,
      O.match(
        () => E.left("キャラクターセットを選択してください"),
        (characterSet) =>
          expandCharacterToScreenSprites(characterSet, {
            baseX: characterBaseX,
            baseY: characterBaseY,
            sprites,
          }),
      ),
    );

    if (E.isLeft(placement)) {
      alert(`キャラクター追加に失敗しました: ${placement.left}`);
      return;
    }

    const newScreen = {
      ...screen,
      sprites: [...screen.sprites, ...placement.right],
    };
    const report = scan(newScreen);
    if (report.ok === false) {
      alert(
        "キャラクターの追加に失敗しました。制約違反:\n" +
          report.errors.join("\n"),
      );
      return;
    }

    setScreenAndSyncNes(newScreen);
    if (O.isNone(selectedSpriteIndex) && placement.right.length > 0) {
      setSelectedSpriteIndex(O.some(screen.sprites.length));
    }
    alert(`キャラクターを(${characterBaseX},${characterBaseY})に追加しました`);
  };

  const selectedIndexValue = pipe(
    selectedSpriteIndex,
    O.getOrElse(() => -1),
  );

  const scanReport = useMemo(() => scan(screen, nes), [nes, screen]);

  const setViewportRef = (element: HTMLDivElement | null): void => {
    viewportElementRef.current = O.fromNullable(element);
  };

  const updateScreenZoomLevel = (
    nextZoomLevel: number,
    anchor: O.Option<{ clientX: number; clientY: number }> = O.none,
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

  const handleViewportWheel = (
    event: React.WheelEvent<HTMLDivElement>,
  ): void => {
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
    event: React.PointerEvent<HTMLDivElement>,
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
    event: React.PointerEvent<HTMLDivElement>,
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
    event: React.PointerEvent<HTMLDivElement>,
  ): void => {
    if (O.isNone(viewportPanState)) {
      return;
    }

    if (viewportPanState.value.pointerId !== event.pointerId) {
      return;
    }

    setViewportPanState(O.none);
  };

  const handleCharacterSetSelect = (value: string | number): void => {
    const nextValue = String(value);
    selectCharacterSet(nextValue === "" ? O.none : O.some(nextValue));
  };

  const handleSelectedSpriteListChange = (value: string | number): void => {
    const nextValue = String(value);
    setSelectedSpriteIndex(
      nextValue === "" ? O.none : O.some(Number(nextValue)),
    );
  };

  const updateSelectedSpriteWithValidation = (
    transform: (sprite: SpriteInScreen) => SpriteInScreen,
    violationMessage: string,
  ): void => {
    pipe(
      selectedSpriteIndex,
      O.chain((spriteIndex) =>
        pipe(
          O.fromNullable(spritesOnScreen[spriteIndex]),
          O.map((sprite) => ({ spriteIndex, sprite })),
        ),
      ),
      O.map(({ spriteIndex, sprite }) => {
        const newSprites = spritesOnScreen.map((entry, index) =>
          index === spriteIndex ? transform(sprite) : entry,
        );
        const newScreen = {
          ...screen,
          sprites: newSprites,
        };
        const report = scan(newScreen);

        if (report.ok === false) {
          alert(violationMessage + "\n" + report.errors.join("\n"));
          return;
        }

        setScreenAndSyncNes(newScreen);
      }),
    );
  };

  const handleSelectedSpriteXChange = (value: string): void => {
    const nextX = Number(value);
    updateSelectedSpriteWithValidation(
      (sprite) => ({ ...sprite, x: nextX }),
      "位置の更新に失敗しました。制約違反:",
    );
  };

  const handleSelectedSpriteYChange = (value: string): void => {
    const nextY = Number(value);
    updateSelectedSpriteWithValidation(
      (sprite) => ({ ...sprite, y: nextY }),
      "位置の更新に失敗しました。制約違反:",
    );
  };

  const handleSelectedSpritePriorityChange = (value: string | number): void => {
    const nextValue = String(value);
    if (nextValue !== "front" && nextValue !== "behindBg") {
      return;
    }

    const nextPriority: SpritePriority = nextValue;
    updateSelectedSpriteWithValidation(
      (sprite) => ({ ...sprite, priority: nextPriority }),
      "優先度の更新に失敗しました。制約違反:",
    );
  };

  const updateSelectedSpriteWithoutValidation = (
    transform: (sprite: SpriteInScreen) => SpriteInScreen,
  ): void => {
    pipe(
      selectedSpriteIndex,
      O.chain((spriteIndex) =>
        pipe(
          O.fromNullable(spritesOnScreen[spriteIndex]),
          O.map((sprite) => ({ spriteIndex, sprite })),
        ),
      ),
      O.map(({ spriteIndex, sprite }) => {
        const newSprites = spritesOnScreen.map((entry, index) =>
          index === spriteIndex ? transform(sprite) : entry,
        );
        const newScreen = {
          ...screen,
          sprites: newSprites,
        };

        setScreenAndSyncNes(newScreen);
      }),
    );
  };

  const handleToggleSelectedSpriteFlipH = (): void => {
    updateSelectedSpriteWithoutValidation((sprite) => ({
      ...sprite,
      flipH: sprite.flipH === false,
    }));
  };

  const handleToggleSelectedSpriteFlipV = (): void => {
    updateSelectedSpriteWithoutValidation((sprite) => ({
      ...sprite,
      flipV: sprite.flipV === false,
    }));
  };

  const handleDeleteSelectedSprite = (): void => {
    pipe(
      selectedSpriteIndex,
      O.map((spriteIndex) => {
        const newSprites = spritesOnScreen.filter(
          (_, index) => index !== spriteIndex,
        );
        const newScreen = {
          ...screen,
          sprites: newSprites,
        };
        const report = scan(newScreen);

        if (report.ok === false) {
          alert(
            "削除後の状態で制約違反が検出されました:\n" +
              report.errors.join("\n"),
          );
        }

        setScreenAndSyncNes(newScreen);
        setSelectedSpriteIndex(O.none);
      }),
    );
  };

  const handleGroupSelectionToggleFromSelect = (
    value: string | number,
  ): void => {
    const nextValue = String(value);
    if (nextValue === "") {
      return;
    }

    const index = Number(nextValue);
    if (selectedSpriteIndices.has(index)) {
      removeFromGroupSelection(index);
      return;
    }

    addToGroupSelection(index);
  };

  const projectActions = useMemo(
    () => [
      {
        label: "PNGエクスポート",
        onSelect: () => exportPng(getHexArrayForScreen(screen)),
      },
      {
        label: "SVGエクスポート",
        onSelect: () => exportSvgSimple(getHexArrayForScreen(screen)),
      },
      { label: "保存", onSelect: () => exportJSON(projectState) },
    ],
    [exportJSON, exportPng, exportSvgSimple, projectState, screen],
  );

  return {
    spriteNumber,
    setSpriteNumber,
    x,
    setX,
    y,
    setY,
    screenZoomLevel,
    selectedSpriteIndex,
    setSelectedSpriteIndex,
    viewportPanState,
    isPlacementOpen,
    setIsPlacementOpen,
    isSelectionOpen,
    setIsSelectionOpen,
    isGroupMoveOpen,
    setIsGroupMoveOpen,
    selectedSpriteIndices,
    groupMoveDeltaX,
    setGroupMoveDeltaX,
    groupMoveDeltaY,
    setGroupMoveDeltaY,
    characterBaseX,
    setCharacterBaseX,
    characterBaseY,
    setCharacterBaseY,
    screen,
    nes,
    sprites,
    spritesOnScreen,
    characterSets,
    selectedCharacterId,
    activeCharacter,
    activeSprite,
    projectState,
    selectedIndexValue,
    scanReport,
    projectActions,
    setViewportRef,
    selectCharacterSet,
    handleCharacterSetSelect,
    addToGroupSelection,
    removeFromGroupSelection,
    clearGroupSelection,
    getGroupBounds,
    handleMoveSelectedGroup,
    handleImport,
    handleAddSprite,
    handleAddCharacter,
    handleZoomOut,
    handleZoomIn,
    handleViewportWheel,
    handleViewportPointerDown,
    handleViewportPointerMove,
    handleViewportPointerEnd,
    handleSelectedSpriteListChange,
    handleSelectedSpriteXChange,
    handleSelectedSpriteYChange,
    handleSelectedSpritePriorityChange,
    handleToggleSelectedSpriteFlipH,
    handleToggleSelectedSpriteFlipV,
    handleDeleteSelectedSprite,
    handleGroupSelectionToggleFromSelect,
  };
};
