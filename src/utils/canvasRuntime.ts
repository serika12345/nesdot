import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";

// Canvas / DOM の命令的操作はここへ閉じ込める。
export type CanvasSurface = {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
};

export type FloatingImage = {
  readonly image: HTMLImageElement;
};

const toCanvasSurface = (
  canvas: HTMLCanvasElement,
): O.Option<CanvasSurface> =>
  pipe(
    O.fromNullable(canvas.getContext("2d")),
    O.map((context) => ({ canvas, context })),
  );

export const getCanvasSurface = (
  canvas: HTMLCanvasElement,
): O.Option<CanvasSurface> => toCanvasSurface(canvas);

export const createOffscreenCanvasSurface = (
  width: number,
  height: number,
): O.Option<CanvasSurface> => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return toCanvasSurface(canvas);
};

export const resizeCanvasSurface = (
  surface: CanvasSurface,
  width: number,
  height: number,
): void => {
  const { canvas } = surface;
  canvas.width = width;
  canvas.height = height;
};

export const setImageSmoothingEnabled = (
  surface: CanvasSurface,
  enabled: boolean,
): void => {
  const { context } = surface;
  context.imageSmoothingEnabled = enabled;
};

export const setFillStyle = (
  surface: CanvasSurface,
  fillStyle: string,
): void => {
  const { context } = surface;
  context.fillStyle = fillStyle;
};

export const setStrokeStyle = (
  surface: CanvasSurface,
  strokeStyle: string,
): void => {
  const { context } = surface;
  context.strokeStyle = strokeStyle;
};

export const setLineWidth = (
  surface: CanvasSurface,
  lineWidth: number,
): void => {
  const { context } = surface;
  context.lineWidth = lineWidth;
};

export const setLineDash = (
  surface: CanvasSurface,
  dash: ReadonlyArray<number>,
): void => {
  const { context } = surface;
  context.setLineDash(Array.from(dash));
};

export const setGlobalCompositeOperation = (
  surface: CanvasSurface,
  value: GlobalCompositeOperation,
): void => {
  const { context } = surface;
  context.globalCompositeOperation = value;
};

export const setFilter = (surface: CanvasSurface, filter: string): void => {
  const { context } = surface;
  context.filter = filter;
};

export const fillRect = (
  surface: CanvasSurface,
  x: number,
  y: number,
  width: number,
  height: number,
): void => {
  const { context } = surface;
  context.fillRect(x, y, width, height);
};

export const strokeRect = (
  surface: CanvasSurface,
  x: number,
  y: number,
  width: number,
  height: number,
): void => {
  const { context } = surface;
  context.strokeRect(x, y, width, height);
};

export const strokeLine = (
  surface: CanvasSurface,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): void => {
  const { context } = surface;
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
};

export const withSavedContext = (
  surface: CanvasSurface,
  draw: () => void,
): void => {
  const { context } = surface;
  context.save();
  draw();
  context.restore();
};

export const putImageData = (
  surface: CanvasSurface,
  imageData: ImageData,
  x: number,
  y: number,
): void => {
  const { context } = surface;
  context.putImageData(imageData, x, y);
};

export const createImageData = (
  rgbaValues: ReadonlyArray<number>,
  width: number,
  height: number,
): ImageData =>
  new ImageData(Uint8ClampedArray.from(rgbaValues), width, height);

export const canvasToBlob = async (
  surface: CanvasSurface,
  type: string,
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const { canvas } = surface;
    canvas.toBlob(
      (blob) => {
        const blobOption = O.fromNullable(blob);
        if (O.isNone(blobOption)) {
          reject(new Error("Canvas blob generation failed"));
          return;
        }
        resolve(blobOption.value);
      },
      type,
    );
  });

export const canvasToDataUrl = (
  surface: CanvasSurface,
  type: string,
): string => {
  const { canvas } = surface;
  return canvas.toDataURL(type);
};

export const createFloatingImage = (src: string): FloatingImage => {
  const image = document.createElement("img");
  const body = document.body;
  image.src = src;
  image.style.position = "fixed";
  image.style.pointerEvents = "none";
  image.style.opacity = "0.9";
  image.style.transform = "translate(-50%, -50%)";
  image.style.zIndex = "9999";
  body.appendChild(image);
  return { image };
};

export const moveFloatingImage = (
  floatingImage: FloatingImage,
  left: number,
  top: number,
): void => {
  const { image } = floatingImage;
  image.style.left = `${left}px`;
  image.style.top = `${top}px`;
};

export const removeFloatingImage = (
  floatingImage: FloatingImage,
): void => {
  const { image } = floatingImage;
  image.remove();
};
