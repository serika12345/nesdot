import * as O from "fp-ts/Option";
import React from "react";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../../../domain/nes/nesProject";
import { nesIndexToCssHex } from "../../../../../../domain/nes/palette";
import { type BackgroundTile } from "../../../../../../domain/project/projectV2";
import { APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME } from "../../../../../styleClassNames";

interface BgModeTileEditorCanvasProps {
  onPaintPixel: (pixelX: number, pixelY: number) => void;
  palette: NesSubPalette;
  tile: BackgroundTile;
  universalBackgroundColor: NesColorIndex;
}

const EDITOR_TILE_SCALE = 24;

const resolvePixelHex = (
  palette: NesSubPalette,
  universalBackgroundColor: NesColorIndex,
  colorIndex: number,
): string => {
  if (colorIndex === 0) {
    return nesIndexToCssHex(universalBackgroundColor);
  }

  return nesIndexToCssHex(palette[colorIndex] ?? universalBackgroundColor);
};

const drawEditorCanvas = (
  canvasElement: HTMLCanvasElement,
  tile: BackgroundTile,
  palette: NesSubPalette,
  universalBackgroundColor: NesColorIndex,
): void => {
  const context = canvasElement.getContext("2d");

  if (context instanceof CanvasRenderingContext2D === false) {
    return;
  }

  context.clearRect(0, 0, canvasElement.width, canvasElement.height);
  Object.assign(context, { imageSmoothingEnabled: false });

  Object.assign(context, { fillStyle: "#ddd" });
  context.fillRect(0, 0, canvasElement.width, canvasElement.height);
  Object.assign(context, { fillStyle: "#eee" });
  Array.from({ length: tile.height }, (_, rowIndex) => rowIndex).forEach(
    (rowIndex) => {
      Array.from(
        { length: tile.width },
        (_, columnIndex) => columnIndex,
      ).forEach((columnIndex) => {
        if ((rowIndex + columnIndex) % 2 !== 0) {
          return;
        }

        context.fillRect(
          columnIndex * EDITOR_TILE_SCALE,
          rowIndex * EDITOR_TILE_SCALE,
          EDITOR_TILE_SCALE,
          EDITOR_TILE_SCALE,
        );
      });
    },
  );

  tile.pixels.forEach((row, rowIndex) => {
    row.forEach((colorIndex, columnIndex) => {
      if (colorIndex === 0) {
        return;
      }

      Object.assign(context, {
        fillStyle: resolvePixelHex(
          palette,
          universalBackgroundColor,
          colorIndex,
        ),
      });
      context.fillRect(
        columnIndex * EDITOR_TILE_SCALE,
        rowIndex * EDITOR_TILE_SCALE,
        EDITOR_TILE_SCALE,
        EDITOR_TILE_SCALE,
      );
    });
  });

  Object.assign(context, {
    strokeStyle: "rgba(148, 163, 184, 0.24)",
    lineWidth: 1,
  });

  Array.from({ length: tile.width + 1 }, (_, index) => index).forEach(
    (index) => {
      context.beginPath();
      context.moveTo(index * EDITOR_TILE_SCALE + 0.5, 0);
      context.lineTo(
        index * EDITOR_TILE_SCALE + 0.5,
        tile.height * EDITOR_TILE_SCALE,
      );
      context.stroke();
    },
  );

  Array.from({ length: tile.height + 1 }, (_, index) => index).forEach(
    (index) => {
      context.beginPath();
      context.moveTo(0, index * EDITOR_TILE_SCALE + 0.5);
      context.lineTo(
        tile.width * EDITOR_TILE_SCALE,
        index * EDITOR_TILE_SCALE + 0.5,
      );
      context.stroke();
    },
  );
};

const resolveTilePixelFromPointerEvent = (
  event: React.PointerEvent<HTMLCanvasElement>,
): { pixelX: number; pixelY: number } => {
  const rect = event.currentTarget.getBoundingClientRect();
  const pixelX = Math.floor((event.clientX - rect.left) / EDITOR_TILE_SCALE);
  const pixelY = Math.floor((event.clientY - rect.top) / EDITOR_TILE_SCALE);

  return {
    pixelX: Math.max(0, Math.min(pixelX, 7)),
    pixelY: Math.max(0, Math.min(pixelY, 7)),
  };
};

const BgModeTileEditorCanvasComponent: React.FC<
  BgModeTileEditorCanvasProps
> = ({ onPaintPixel, palette, tile, universalBackgroundColor }) => {
  const canvasElementRef = React.useRef<O.Option<HTMLCanvasElement>>(O.none);
  const isPaintingRef = React.useRef(false);
  const lastPaintedPixelRef = React.useRef<O.Option<string>>(O.none);

  const handleCanvasRef = React.useCallback(
    (element: HTMLCanvasElement | null) => {
      Object.assign(canvasElementRef, {
        current: O.fromNullable(element),
      });
    },
    [],
  );

  React.useEffect(() => {
    if (O.isNone(canvasElementRef.current)) {
      return;
    }

    drawEditorCanvas(
      canvasElementRef.current.value,
      tile,
      palette,
      universalBackgroundColor,
    );
  }, [palette, tile, universalBackgroundColor]);

  const paintResolvedPixel = React.useCallback(
    (pixelX: number, pixelY: number): void => {
      const nextPixelKey = `${pixelX}:${pixelY}`;

      if (O.isSome(lastPaintedPixelRef.current)) {
        if (lastPaintedPixelRef.current.value === nextPixelKey) {
          return;
        }
      }

      lastPaintedPixelRef.current = O.some(nextPixelKey);
      onPaintPixel(pixelX, pixelY);
    },
    [onPaintPixel],
  );

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      isPaintingRef.current = true;

      const tilePixel = resolveTilePixelFromPointerEvent(event);

      paintResolvedPixel(tilePixel.pixelX, tilePixel.pixelY);
    },
    [paintResolvedPixel],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (isPaintingRef.current === false) {
        return;
      }

      const tilePixel = resolveTilePixelFromPointerEvent(event);

      paintResolvedPixel(tilePixel.pixelX, tilePixel.pixelY);
    },
    [paintResolvedPixel],
  );

  const handlePointerEnd = React.useCallback(() => {
    isPaintingRef.current = false;
    lastPaintedPixelRef.current = O.none;
  }, []);

  return (
    <canvas
      className={APP_INTERACTIVE_PIXEL_CANVAS_CLASS_NAME}
      ref={handleCanvasRef}
      aria-label="BGタイル編集キャンバス"
      width={tile.width * EDITOR_TILE_SCALE}
      height={tile.height * EDITOR_TILE_SCALE}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
    />
  );
};

export const BgModeTileEditorCanvas = React.memo(
  BgModeTileEditorCanvasComponent,
);
