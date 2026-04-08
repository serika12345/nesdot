import * as E from "fp-ts/Either";
import React from "react";
import { useProjectState } from "../../../../application/state/projectStore";
import {
  decodeBackgroundTileAtIndex,
  replaceBackgroundTilePixel,
} from "../../../../domain/nes/backgroundEditing";
import {
  PROJECT_BACKGROUND_TILE_COUNT,
  createEmptyBackgroundTile,
  type BackgroundTile,
} from "../../../../domain/project/projectV2";

export type BgTool = "pen" | "eraser";
type BgPaletteIndex = 0 | 1 | 2 | 3;

const decodeVisibleBackgroundTile = (
  chrBytes: ReadonlyArray<number>,
  tileIndex: number,
): BackgroundTile => {
  const tile = decodeBackgroundTileAtIndex(chrBytes, tileIndex);

  return E.isRight(tile) ? tile.right : createEmptyBackgroundTile();
};

export const useBgModeEditingState = () => {
  const nes = useProjectState((state) => state.nes);
  const [selectedTileIndex, setSelectedTileIndex] = React.useState(0);
  const [tool, setTool] = React.useState<BgTool>("pen");
  const [activePaletteIndex, setActivePaletteIndex] =
    React.useState<BgPaletteIndex>(0);
  const [isToolMenuOpen, setIsToolMenuOpen] = React.useState(false);

  const visibleBackgroundTiles = React.useMemo(
    () =>
      Array.from({ length: PROJECT_BACKGROUND_TILE_COUNT }, (_, tileIndex) =>
        decodeVisibleBackgroundTile(nes.chrBytes, tileIndex),
      ),
    [nes.chrBytes],
  );

  const selectedTile =
    visibleBackgroundTiles[selectedTileIndex] ?? createEmptyBackgroundTile();

  const handlePaintPixel = React.useCallback(
    (pixelX: number, pixelY: number): void => {
      const nextColorIndex = tool === "eraser" ? 0 : 1;
      const currentState = useProjectState.getState();
      const nextChrBytes = replaceBackgroundTilePixel(
        currentState.nes.chrBytes,
        selectedTileIndex,
        pixelX,
        pixelY,
        nextColorIndex,
      );

      if (E.isLeft(nextChrBytes)) {
        return;
      }

      useProjectState.setState({
        nes: {
          ...currentState.nes,
          chrBytes: nextChrBytes.right,
        },
      });
    },
    [selectedTileIndex, tool],
  );

  return {
    activePaletteIndex,
    backgroundPalettes: nes.backgroundPalettes,
    handlePaintPixel,
    isToolMenuOpen,
    selectedTile,
    selectedTileIndex,
    setActivePaletteIndex,
    setIsToolMenuOpen,
    setSelectedTileIndex,
    setTool,
    tool,
    universalBackgroundColor: nes.universalBackgroundColor,
    visibleBackgroundTiles,
  };
};
