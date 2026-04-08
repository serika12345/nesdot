import { type Locator } from "@playwright/test";
import { getLocatorPoint, getLocatorRect } from "./pointer";

interface CanvasPixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const clickLogicalCanvasPixel = async (
  locator: Locator,
  pixelX: number,
  pixelY: number,
  logicalWidth: number,
  logicalHeight: number,
): Promise<void> => {
  const rect = await getLocatorRect(locator);
  const point = await getLocatorPoint(
    locator,
    (pixelX + 0.5) * (rect.width / logicalWidth),
    (pixelY + 0.5) * (rect.height / logicalHeight),
  );

  await locator.dispatchEvent("pointerdown", {
    pointerId: pixelX + pixelY + logicalWidth + logicalHeight,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: point.clientX,
    clientY: point.clientY,
  });
  await locator.dispatchEvent("pointerup", {
    pointerId: pixelX + pixelY + logicalWidth + logicalHeight,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: point.clientX,
    clientY: point.clientY,
  });
};

export const readLogicalCanvasPixel = async (
  locator: Locator,
  pixelX: number,
  pixelY: number,
  logicalWidth: number,
  logicalHeight: number,
): Promise<CanvasPixelColor> =>
  locator.evaluate(
    (element, coordinates) => {
      if (element instanceof HTMLCanvasElement === false) {
        return {
          r: 0,
          g: 0,
          b: 0,
          a: 0,
        };
      }

      const context = element.getContext("2d");

      if (context instanceof CanvasRenderingContext2D === false) {
        return {
          r: 0,
          g: 0,
          b: 0,
          a: 0,
        };
      }

      const canvasX = Math.floor(
        (coordinates.pixelX + 0.5) * (element.width / coordinates.logicalWidth),
      );
      const canvasY = Math.floor(
        (coordinates.pixelY + 0.5) *
          (element.height / coordinates.logicalHeight),
      );
      const pixelData = context.getImageData(canvasX, canvasY, 1, 1).data;

      return {
        r: pixelData[0] ?? 0,
        g: pixelData[1] ?? 0,
        b: pixelData[2] ?? 0,
        a: pixelData[3] ?? 0,
      };
    },
    {
      logicalHeight,
      logicalWidth,
      pixelX,
      pixelY,
    },
  );

export const formatCanvasPixelColor = (pixel: CanvasPixelColor): string =>
  `${pixel.r},${pixel.g},${pixel.b},${pixel.a}`;
