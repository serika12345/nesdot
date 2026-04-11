import * as O from "fp-ts/Option";
import React from "react";
import {
  type NesColorIndex,
  type NesSubPalette,
} from "../../../../domain/nes/nesProject";
import { nesIndexToCssHex } from "../../../../domain/nes/palette";
import { type BackgroundTile } from "../../../../domain/project/projectV2";
import { BACKGROUND_TILE_PREVIEW_CANVAS_CLASS_NAME } from "../../../styleClassNames";

interface BackgroundTilePreviewProps {
  ariaLabel?: string;
  scale: number;
  tile: BackgroundTile;
  palette: NesSubPalette;
  universalBackgroundColor: NesColorIndex;
}

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

const drawBackgroundTilePreview = (
  canvasElement: HTMLCanvasElement,
  tile: BackgroundTile,
  palette: NesSubPalette,
  scale: number,
  universalBackgroundColor: NesColorIndex,
): void => {
  const context = canvasElement.getContext("2d");

  if (context instanceof CanvasRenderingContext2D === false) {
    return;
  }

  context.clearRect(0, 0, canvasElement.width, canvasElement.height);
  Object.assign(context, { imageSmoothingEnabled: false });

  tile.pixels.forEach((row, rowIndex) => {
    row.forEach((colorIndex, columnIndex) => {
      Object.assign(context, {
        fillStyle: resolvePixelHex(
          palette,
          universalBackgroundColor,
          colorIndex,
        ),
      });
      context.fillRect(columnIndex * scale, rowIndex * scale, scale, scale);
    });
  });
};

const BackgroundTilePreviewComponent: React.FC<BackgroundTilePreviewProps> = ({
  ariaLabel,
  palette,
  scale,
  tile,
  universalBackgroundColor,
}) => {
  const canvasElementRef = React.useRef<O.Option<HTMLCanvasElement>>(O.none);

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

    drawBackgroundTilePreview(
      canvasElementRef.current.value,
      tile,
      palette,
      scale,
      universalBackgroundColor,
    );
  }, [palette, scale, tile, universalBackgroundColor]);

  return typeof ariaLabel === "string" ? (
    <canvas
      className={BACKGROUND_TILE_PREVIEW_CANVAS_CLASS_NAME}
      ref={handleCanvasRef}
      width={tile.width * scale}
      height={tile.height * scale}
      aria-label={ariaLabel}
    />
  ) : (
    <canvas
      className={BACKGROUND_TILE_PREVIEW_CANVAS_CLASS_NAME}
      ref={handleCanvasRef}
      width={tile.width * scale}
      height={tile.height * scale}
      aria-hidden="true"
    />
  );
};

export const BackgroundTilePreview = React.memo(BackgroundTilePreviewComponent);
