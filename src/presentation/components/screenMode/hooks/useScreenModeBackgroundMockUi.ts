import * as O from "fp-ts/Option";
import React from "react";

export type ScreenModeEditingTarget = "sprite" | "bgTile" | "bgPalette";

type BgPaletteIndex = 0 | 1 | 2 | 3;

interface BackgroundPlacementPreviewPosition {
  x: number;
  y: number;
}

const DEFAULT_BACKGROUND_PLACEMENT_PREVIEW_POSITION: BackgroundPlacementPreviewPosition =
  {
    x: 80,
    y: 48,
  };

/**
 * screen mode の BG 系 UI モック state を管理します。
 * store や domain へ接続せず、導線確認に必要な target 切り替えと dialog 状態だけをローカルで保持します。
 */
export const useScreenModeBackgroundMockUi = () => {
  const [editingTarget, setEditingTarget] =
    React.useState<ScreenModeEditingTarget>("sprite");
  const [isTilePickerOpen, setIsTilePickerOpen] = React.useState(false);
  const [activePaletteIndex, setActivePaletteIndex] =
    React.useState<BgPaletteIndex>(0);
  const [placementPreviewPosition, setPlacementPreviewPosition] =
    React.useState<BackgroundPlacementPreviewPosition>(
      DEFAULT_BACKGROUND_PLACEMENT_PREVIEW_POSITION,
    );
  const [grabbedTileIndex, setGrabbedTileIndex] = React.useState<
    O.Option<number>
  >(O.none);

  const openTilePicker = React.useCallback((): void => {
    setIsTilePickerOpen(true);
  }, []);

  const closeTilePicker = React.useCallback((): void => {
    setIsTilePickerOpen(false);
  }, []);

  const handleBackgroundTileSelect = React.useCallback(
    (tileIndex: number): void => {
      setGrabbedTileIndex(O.some(tileIndex));
      setIsTilePickerOpen(false);
      setEditingTarget("bgTile");
    },
    [],
  );

  const handleMockStagePlacement = React.useCallback((): void => {
    if (editingTarget !== "bgTile") {
      return;
    }

    pipeGrabbedTileIndex(grabbedTileIndex, () => {
      setGrabbedTileIndex(O.none);
      setEditingTarget("sprite");
    });
  }, [editingTarget, grabbedTileIndex]);

  const handleBackgroundPaletteSelect = React.useCallback(
    (paletteIndex: BgPaletteIndex): void => {
      setActivePaletteIndex(paletteIndex);
      setEditingTarget("bgPalette");
    },
    [],
  );

  const handlePlacementPreviewMove = React.useCallback(
    (nextPosition: BackgroundPlacementPreviewPosition): void => {
      setPlacementPreviewPosition(nextPosition);
    },
    [],
  );

  return {
    activePaletteIndex,
    closeTilePicker,
    editingTarget,
    grabbedTileIndex,
    handleBackgroundPaletteSelect,
    handleBackgroundTileSelect,
    handleMockStagePlacement,
    handlePlacementPreviewMove,
    isTilePickerOpen,
    openTilePicker,
    placementPreviewPosition,
  };
};

const pipeGrabbedTileIndex = (
  grabbedTileIndex: O.Option<number>,
  onSome: (tileIndex: number) => void,
): void => {
  if (O.isNone(grabbedTileIndex)) {
    return;
  }

  onSome(grabbedTileIndex.value);
};
