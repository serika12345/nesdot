import * as O from "fp-ts/Option";
import React from "react";
import {
  type SpriteTile,
  useProjectState,
} from "../../../../../application/state/projectStore";
import { renderSpriteTileToHexArray } from "../../../../../domain/nes/rendering";
import { EmptyTilePreview } from "../../primitives/CharacterModePrimitives";
import { tilePreviewCanvasStyle } from "./styles";

const PREVIEW_TRANSPARENT_HEX = "#00000000";

interface CharacterModeTilePreviewProps {
  scale: number;
  tileOption: O.Option<SpriteTile>;
}

const isSameTileOption = (
  left: O.Option<SpriteTile>,
  right: O.Option<SpriteTile>,
): boolean => {
  if (O.isNone(left) && O.isNone(right)) {
    return true;
  }

  if (O.isSome(left) && O.isSome(right)) {
    return left.value === right.value;
  }

  return false;
};

const areSameTilePreviewProps = (
  previous: CharacterModeTilePreviewProps,
  next: CharacterModeTilePreviewProps,
): boolean =>
  previous.scale === next.scale &&
  isSameTileOption(previous.tileOption, next.tileOption);

const drawTilePreview = (
  context: CanvasRenderingContext2D,
  tile: SpriteTile,
  hexPixels: string[][],
  scale: number,
  previewWidth: number,
  previewHeight: number,
): void => {
  context.clearRect(0, 0, previewWidth, previewHeight);
  Object.assign(context, { imageSmoothingEnabled: false });

  tile.pixels.forEach((pixelRow, rowIndex) => {
    pixelRow.forEach((colorIndex, columnIndex) => {
      if (colorIndex === 0) {
        return;
      }

      const colorHex =
        hexPixels[rowIndex]?.[columnIndex] ?? PREVIEW_TRANSPARENT_HEX;
      Object.assign(context, { fillStyle: colorHex });
      context.fillRect(columnIndex * scale, rowIndex * scale, scale, scale);
    });
  });
};

/**
 * キャラクター編集画面用のタイルプレビューです。
 * スプライトパレットを使ってタイルをピクセル単位で描画します。
 */
const CharacterModeTilePreviewComponent: React.FC<
  CharacterModeTilePreviewProps
> = ({ scale, tileOption }) => {
  const spritePalettes = useProjectState((state) => state.nes.spritePalettes);
  const canvasElementRef = React.useRef<O.Option<HTMLCanvasElement>>(O.none);

  const previewSize = React.useMemo(
    () =>
      O.match(
        () => ({ width: 8 * scale, height: 16 * scale }),
        (tile: SpriteTile) => ({
          width: tile.width * scale,
          height: tile.height * scale,
        }),
      )(tileOption),
    [scale, tileOption],
  );

  const hexPixelsOption = React.useMemo(
    () =>
      O.map((tile: SpriteTile) =>
        renderSpriteTileToHexArray(tile, spritePalettes),
      )(tileOption),
    [spritePalettes, tileOption],
  );

  const handleCanvasRef = React.useCallback(
    (element: HTMLCanvasElement | null) => {
      Object.assign(canvasElementRef, {
        current: O.fromNullable(element),
      });
    },
    [],
  );

  React.useEffect(() => {
    if (O.isNone(tileOption) || O.isNone(hexPixelsOption)) {
      return;
    }

    const canvasElementOption = canvasElementRef.current;
    if (O.isNone(canvasElementOption)) {
      return;
    }

    const contextOption = O.fromNullable(
      canvasElementOption.value.getContext("2d"),
    );
    if (O.isNone(contextOption)) {
      return;
    }

    drawTilePreview(
      contextOption.value,
      tileOption.value,
      hexPixelsOption.value,
      scale,
      previewSize.width,
      previewSize.height,
    );
  }, [
    hexPixelsOption,
    previewSize.height,
    previewSize.width,
    scale,
    tileOption,
  ]);

  if (O.isNone(tileOption)) {
    return (
      <EmptyTilePreview
        previewWidth={previewSize.width}
        previewHeight={previewSize.height}
      />
    );
  }

  return (
    <canvas
      ref={handleCanvasRef}
      width={previewSize.width}
      height={previewSize.height}
      style={tilePreviewCanvasStyle}
      aria-hidden="true"
    />
  );
};

export const CharacterModeTilePreview = React.memo(
  CharacterModeTilePreviewComponent,
  areSameTilePreviewProps,
);
