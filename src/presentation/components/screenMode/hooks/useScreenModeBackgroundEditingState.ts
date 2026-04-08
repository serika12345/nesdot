import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import React from "react";
import { useProjectState } from "../../../../application/state/projectStore";
import {
  setAttributeTablePaletteAtPixel,
  setNameTableTileAtPixel,
} from "../../../../domain/nes/backgroundEditing";
import { type PaletteIndex } from "../../../../domain/project/project";
import { getScreenBackgroundTilePlacementFromPixel } from "../../../../domain/screen/backgroundLayout";
import { getScreenBackgroundPalettePlacementFromPixel } from "../../../../domain/screen/backgroundPalette";

export type ScreenModeBackgroundEditingTarget =
  | "sprite"
  | "bgTile"
  | "bgPalette";

interface BackgroundCursorOverlayState {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface StagePixelPosition {
  x: number;
  y: number;
}

const DEFAULT_TILE_CURSOR: BackgroundCursorOverlayState = {
  height: 8,
  width: 8,
  x: 80,
  y: 48,
};

const DEFAULT_PALETTE_CURSOR: BackgroundCursorOverlayState = {
  height: 16,
  width: 16,
  x: 80,
  y: 48,
};

const resolveTileCursorOverlay = (
  position: StagePixelPosition,
): BackgroundCursorOverlayState => {
  const placement = getScreenBackgroundTilePlacementFromPixel(
    position.x,
    position.y,
  );

  if (E.isLeft(placement)) {
    return DEFAULT_TILE_CURSOR;
  }

  return {
    height: 8,
    width: 8,
    x: placement.right.snappedPixelX,
    y: placement.right.snappedPixelY,
  };
};

const resolvePaletteCursorOverlay = (
  position: StagePixelPosition,
): BackgroundCursorOverlayState => {
  const placement = getScreenBackgroundPalettePlacementFromPixel(
    position.x,
    position.y,
  );

  if (E.isLeft(placement)) {
    return DEFAULT_PALETTE_CURSOR;
  }

  return {
    height: 16,
    width: 16,
    x: placement.right.snappedPixelX,
    y: placement.right.snappedPixelY,
  };
};

export const useScreenModeBackgroundEditingState = () => {
  const [editingTarget, setEditingTarget] =
    React.useState<ScreenModeBackgroundEditingTarget>("sprite");
  const [isTilePickerOpen, setIsTilePickerOpen] = React.useState(false);
  const [activePaletteIndex, setActivePaletteIndex] =
    React.useState<PaletteIndex>(0);
  const [grabbedTileIndex, setGrabbedTileIndex] = React.useState<
    O.Option<number>
  >(O.none);
  const [cursorOverlay, setCursorOverlay] = React.useState<
    O.Option<BackgroundCursorOverlayState>
  >(O.none);
  const [isPaletteStrokeActive, setIsPaletteStrokeActive] =
    React.useState(false);

  const openTilePicker = React.useCallback((): void => {
    setIsTilePickerOpen(true);
  }, []);

  const closeTilePicker = React.useCallback((): void => {
    setIsTilePickerOpen(false);
  }, []);

  const handleBackgroundTileSelect = React.useCallback(
    (tileIndex: number): void => {
      setGrabbedTileIndex(O.some(tileIndex));
      setEditingTarget("bgTile");
      setCursorOverlay(O.some(DEFAULT_TILE_CURSOR));
      setIsTilePickerOpen(false);
    },
    [],
  );

  const handleBackgroundPaletteSelect = React.useCallback(
    (paletteIndex: PaletteIndex): void => {
      setActivePaletteIndex(paletteIndex);
      setEditingTarget("bgPalette");
      setCursorOverlay(O.some(DEFAULT_PALETTE_CURSOR));
      setIsPaletteStrokeActive(false);
      setIsTilePickerOpen(false);
    },
    [],
  );

  const placeGrabbedBackgroundTile = React.useCallback((): void => {
    if (editingTarget !== "bgTile") {
      return;
    }

    if (O.isNone(grabbedTileIndex) || O.isNone(cursorOverlay)) {
      return;
    }

    const currentState = useProjectState.getState();
    const nextNameTable = setNameTableTileAtPixel(
      currentState.nes.nameTable,
      cursorOverlay.value.x,
      cursorOverlay.value.y,
      grabbedTileIndex.value,
    );

    if (E.isLeft(nextNameTable)) {
      return;
    }

    useProjectState.setState({
      nes: {
        ...currentState.nes,
        nameTable: nextNameTable.right,
      },
    });

    setGrabbedTileIndex(O.none);
    setCursorOverlay(O.none);
    setEditingTarget("sprite");
  }, [cursorOverlay, editingTarget, grabbedTileIndex]);

  const handleStagePointerMove = React.useCallback(
    (position: StagePixelPosition, buttons: number): void => {
      if (editingTarget === "bgTile") {
        setCursorOverlay(O.some(resolveTileCursorOverlay(position)));
        return;
      }

      if (editingTarget !== "bgPalette") {
        return;
      }

      setCursorOverlay(O.some(resolvePaletteCursorOverlay(position)));

      if (isPaletteStrokeActive === false || (buttons & 1) === 0) {
        return;
      }

      const currentState = useProjectState.getState();
      const nextAttributeTable = setAttributeTablePaletteAtPixel(
        currentState.nes.attributeTable,
        position.x,
        position.y,
        activePaletteIndex,
      );

      if (E.isLeft(nextAttributeTable)) {
        return;
      }

      useProjectState.setState({
        nes: {
          ...currentState.nes,
          attributeTable: nextAttributeTable.right,
        },
      });
    },
    [activePaletteIndex, editingTarget, isPaletteStrokeActive],
  );

  const handleStagePointerDown = React.useCallback(
    (position: StagePixelPosition, button: number): void => {
      if (button !== 0) {
        return;
      }

      if (editingTarget === "bgTile") {
        return;
      }

      if (editingTarget !== "bgPalette") {
        return;
      }

      setIsPaletteStrokeActive(true);

      const currentState = useProjectState.getState();
      const nextAttributeTable = setAttributeTablePaletteAtPixel(
        currentState.nes.attributeTable,
        position.x,
        position.y,
        activePaletteIndex,
      );

      if (E.isLeft(nextAttributeTable)) {
        return;
      }

      useProjectState.setState({
        nes: {
          ...currentState.nes,
          attributeTable: nextAttributeTable.right,
        },
      });
    },
    [activePaletteIndex, editingTarget],
  );

  const handleStageClick = React.useCallback((): void => {
    placeGrabbedBackgroundTile();
  }, [placeGrabbedBackgroundTile]);

  const handleStagePointerUp = React.useCallback((): void => {
    if (editingTarget !== "bgPalette") {
      return;
    }

    setIsPaletteStrokeActive(false);
    setCursorOverlay(O.none);
    setEditingTarget("sprite");
  }, [editingTarget]);

  return {
    activePaletteIndex,
    closeTilePicker,
    cursorOverlay,
    editingTarget,
    grabbedTileIndex,
    handleBackgroundPaletteSelect,
    handleBackgroundTileSelect,
    handleStageClick,
    handleStagePointerDown,
    handleStagePointerMove,
    handleStagePointerUp,
    isTilePickerOpen,
    openTilePicker,
  };
};
