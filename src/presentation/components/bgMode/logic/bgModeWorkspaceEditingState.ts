import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import React from "react";
import {
  useProjectState,
  type ColorIndexOfPalette,
} from "../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../application/state/workbenchStore";
import {
  decodeBackgroundTileAtIndex,
  replaceBackgroundTilePixel,
} from "../../../../domain/nes/backgroundEditing";
import {
  PROJECT_BACKGROUND_TILE_COUNT,
  createEmptyBackgroundTile,
  type BackgroundTile,
} from "../../../../domain/project/projectV2";

const decodeVisibleBackgroundTile = (
  chrBytes: ReadonlyArray<number>,
  tileIndex: number,
): BackgroundTile => {
  const tile = decodeBackgroundTileAtIndex(chrBytes, tileIndex);

  return E.isRight(tile) ? tile.right : createEmptyBackgroundTile();
};

const decodeAllBackgroundTiles = (
  chrBytes: ReadonlyArray<number>,
): ReadonlyArray<BackgroundTile> =>
  Array.from({ length: PROJECT_BACKGROUND_TILE_COUNT }, (_, tileIndex) =>
    decodeVisibleBackgroundTile(chrBytes, tileIndex),
  );

const replaceVisibleBackgroundTileAtIndex = (
  tiles: ReadonlyArray<BackgroundTile>,
  tileIndex: number,
  nextTile: BackgroundTile,
): ReadonlyArray<BackgroundTile> =>
  tiles.map((tile, index) => (index === tileIndex ? nextTile : tile));

export const resolveBgModePaintColorIndex = (
  tool: "pen" | "eraser",
  activeSlot: ColorIndexOfPalette,
): ColorIndexOfPalette => (tool === "eraser" ? 0 : activeSlot);

export const useBgModeSelectedTile = (): BackgroundTile => {
  const chrBytes = useProjectState((state) => state.nes.chrBytes);
  const selectedTileIndex = useWorkbenchState(
    (state) => state.bgMode.selectedTileIndex,
  );

  return React.useMemo(
    () => decodeVisibleBackgroundTile(chrBytes, selectedTileIndex),
    [chrBytes, selectedTileIndex],
  );
};

export const useBgModeTileEditorState = (): Readonly<{
  handlePaintPixel: (pixelX: number, pixelY: number) => void;
  selectedTile: BackgroundTile;
  visibleBackgroundTiles: ReadonlyArray<BackgroundTile>;
}> => {
  const chrBytes = useProjectState((state) => state.nes.chrBytes);
  const selectedTileIndex = useWorkbenchState(
    (state) => state.bgMode.selectedTileIndex,
  );
  const tool = useWorkbenchState((state) => state.bgMode.tool);
  const activeSlot = useWorkbenchState((state) => state.bgMode.activeSlot);
  const selectedTile = useBgModeSelectedTile();
  const locallyEditedTileIndexRef = React.useRef<O.Option<number>>(O.none);
  const visibleBackgroundTilesCacheRef = React.useRef<
    ReadonlyArray<BackgroundTile>
  >(decodeAllBackgroundTiles(chrBytes));
  const cachedChrBytesRef = React.useRef(chrBytes);

  const visibleBackgroundTiles = React.useMemo(() => {
    if (cachedChrBytesRef.current === chrBytes) {
      return visibleBackgroundTilesCacheRef.current;
    }

    if (O.isSome(locallyEditedTileIndexRef.current)) {
      const nextTileIndex = locallyEditedTileIndexRef.current.value;
      const nextTile = decodeVisibleBackgroundTile(chrBytes, nextTileIndex);
      const nextTiles = replaceVisibleBackgroundTileAtIndex(
        visibleBackgroundTilesCacheRef.current,
        nextTileIndex,
        nextTile,
      );

      visibleBackgroundTilesCacheRef.current = nextTiles;
      cachedChrBytesRef.current = chrBytes;
      locallyEditedTileIndexRef.current = O.none;
      return nextTiles;
    }

    const nextTiles = decodeAllBackgroundTiles(chrBytes);

    visibleBackgroundTilesCacheRef.current = nextTiles;
    cachedChrBytesRef.current = chrBytes;
    return nextTiles;
  }, [chrBytes]);

  const handlePaintPixel = React.useCallback(
    (pixelX: number, pixelY: number): void => {
      const nextColorIndex = resolveBgModePaintColorIndex(tool, activeSlot);

      if (selectedTile.pixels[pixelY]?.[pixelX] === nextColorIndex) {
        return;
      }

      const currentState = useProjectState.getState();
      const nextChrBytes = replaceBackgroundTilePixel(
        chrBytes,
        selectedTileIndex,
        pixelX,
        pixelY,
        nextColorIndex,
      );

      if (E.isLeft(nextChrBytes)) {
        return;
      }

      const nextVisibleTile = decodeVisibleBackgroundTile(
        nextChrBytes.right,
        selectedTileIndex,
      );

      locallyEditedTileIndexRef.current = O.some(selectedTileIndex);
      visibleBackgroundTilesCacheRef.current =
        replaceVisibleBackgroundTileAtIndex(
          visibleBackgroundTilesCacheRef.current,
          selectedTileIndex,
          nextVisibleTile,
        );

      useProjectState.setState({
        nes: {
          ...currentState.nes,
          chrBytes: nextChrBytes.right,
        },
      });
    },
    [activeSlot, chrBytes, selectedTile, selectedTileIndex, tool],
  );

  return {
    handlePaintPixel,
    selectedTile,
    visibleBackgroundTiles,
  };
};
