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
  replaceBackgroundTilePixels,
  type BackgroundTilePixelWrite,
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

const EMPTY_BACKGROUND_TILE_PIXEL_WRITES: ReadonlyArray<BackgroundTilePixelWrite> =
  [];

const isSamePixelTarget = (
  left: BackgroundTilePixelWrite,
  right: BackgroundTilePixelWrite,
): boolean => left.pixelX === right.pixelX && left.pixelY === right.pixelY;

const upsertBackgroundTilePixelWrite = (
  writes: ReadonlyArray<BackgroundTilePixelWrite>,
  nextWrite: BackgroundTilePixelWrite,
): ReadonlyArray<BackgroundTilePixelWrite> => {
  if (writes.some((write) => isSamePixelTarget(write, nextWrite))) {
    return writes.map((write) =>
      isSamePixelTarget(write, nextWrite) ? nextWrite : write,
    );
  }

  return [...writes, nextWrite];
};

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
  handleFlushPaint: () => void;
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
  const visibleBackgroundTilesCacheRef = React.useRef<
    ReadonlyArray<BackgroundTile>
  >(decodeAllBackgroundTiles(chrBytes));
  const cachedChrBytesRef = React.useRef(chrBytes);
  const queuedPaintWritesRef = React.useRef<
    ReadonlyArray<BackgroundTilePixelWrite>
  >(EMPTY_BACKGROUND_TILE_PIXEL_WRITES);
  const queuedPaintTileIndexRef = React.useRef<O.Option<number>>(O.none);
  const scheduledPaintFrameRef = React.useRef<O.Option<number>>(O.none);

  const visibleBackgroundTiles = React.useMemo(() => {
    if (cachedChrBytesRef.current === chrBytes) {
      return visibleBackgroundTilesCacheRef.current;
    }

    const nextTiles = decodeAllBackgroundTiles(chrBytes);

    visibleBackgroundTilesCacheRef.current = nextTiles;
    cachedChrBytesRef.current = chrBytes;
    return nextTiles;
  }, [chrBytes]);

  const selectedTile = React.useMemo(
    () =>
      visibleBackgroundTiles[selectedTileIndex] ?? createEmptyBackgroundTile(),
    [selectedTileIndex, visibleBackgroundTiles],
  );

  const flushQueuedPaintWrites = React.useCallback((): void => {
    const queuedPaintWrites = queuedPaintWritesRef.current;
    const queuedPaintTileIndex = queuedPaintTileIndexRef.current;

    queuedPaintWritesRef.current = EMPTY_BACKGROUND_TILE_PIXEL_WRITES;
    queuedPaintTileIndexRef.current = O.none;
    scheduledPaintFrameRef.current = O.none;

    if (queuedPaintWrites.length === 0 || O.isNone(queuedPaintTileIndex)) {
      return;
    }

    const currentState = useProjectState.getState();
    const nextChrBytes = replaceBackgroundTilePixels(
      currentState.nes.chrBytes,
      queuedPaintTileIndex.value,
      queuedPaintWrites,
    );

    if (E.isLeft(nextChrBytes)) {
      return;
    }

    const nextVisibleTile = decodeVisibleBackgroundTile(
      nextChrBytes.right,
      queuedPaintTileIndex.value,
    );

    visibleBackgroundTilesCacheRef.current =
      replaceVisibleBackgroundTileAtIndex(
        visibleBackgroundTilesCacheRef.current,
        queuedPaintTileIndex.value,
        nextVisibleTile,
      );
    cachedChrBytesRef.current = nextChrBytes.right;

    useProjectState.setState({
      nes: {
        ...currentState.nes,
        chrBytes: nextChrBytes.right,
      },
    });
  }, []);

  const scheduleQueuedPaintFlush = React.useCallback((): void => {
    if (O.isSome(scheduledPaintFrameRef.current)) {
      return;
    }

    if ("window" in globalThis) {
      scheduledPaintFrameRef.current = O.some(
        window.requestAnimationFrame(flushQueuedPaintWrites),
      );
      return;
    }

    flushQueuedPaintWrites();
  }, [flushQueuedPaintWrites]);

  React.useEffect(
    () => () => {
      if (O.isSome(scheduledPaintFrameRef.current)) {
        if ("window" in globalThis) {
          window.cancelAnimationFrame(scheduledPaintFrameRef.current.value);
        }
        scheduledPaintFrameRef.current = O.none;
      }

      flushQueuedPaintWrites();
    },
    [flushQueuedPaintWrites],
  );

  const handlePaintPixel = React.useCallback(
    (pixelX: number, pixelY: number): void => {
      const nextColorIndex = resolveBgModePaintColorIndex(tool, activeSlot);

      if (selectedTile.pixels[pixelY]?.[pixelX] === nextColorIndex) {
        return;
      }

      if (
        O.isSome(queuedPaintTileIndexRef.current) &&
        queuedPaintTileIndexRef.current.value !== selectedTileIndex
      ) {
        flushQueuedPaintWrites();
      }

      queuedPaintTileIndexRef.current = O.some(selectedTileIndex);
      queuedPaintWritesRef.current = upsertBackgroundTilePixelWrite(
        queuedPaintWritesRef.current,
        {
          nextColorIndex,
          pixelX,
          pixelY,
        },
      );
      scheduleQueuedPaintFlush();
    },
    [
      activeSlot,
      flushQueuedPaintWrites,
      scheduleQueuedPaintFlush,
      selectedTile,
      selectedTileIndex,
      tool,
    ],
  );

  return {
    handleFlushPaint: flushQueuedPaintWrites,
    handlePaintPixel,
    selectedTile,
    visibleBackgroundTiles,
  };
};
