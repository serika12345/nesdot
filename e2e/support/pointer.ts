import { type Locator, type Page } from "@playwright/test";

interface LocatorPoint {
  clientX: number;
  clientY: number;
}

interface LocatorRect extends LocatorPoint {
  width: number;
  height: number;
}

export const getLocatorPoint = async (
  locator: Locator,
  x: number,
  y: number,
): Promise<LocatorPoint> =>
  locator.evaluate(
    (element, point) => {
      const rect = element.getBoundingClientRect();

      return {
        clientX: rect.left + point.x,
        clientY: rect.top + point.y,
      };
    },
    { x, y },
  );

export const getLocatorRect = async (locator: Locator): Promise<LocatorRect> =>
  locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return {
      clientX: rect.left,
      clientY: rect.top,
      width: rect.width,
      height: rect.height,
    };
  });

export const getCanvasSize = async (
  locator: Locator,
): Promise<{ width: number; height: number }> =>
  locator.evaluate((element) => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }));

export const zoomViewportAtCenter = async (
  locator: Locator,
  deltaY: number,
): Promise<void> => {
  const rect = await getLocatorRect(locator);

  await locator.dispatchEvent("wheel", {
    ctrlKey: true,
    deltaY,
    clientX: rect.clientX + rect.width / 2,
    clientY: rect.clientY + rect.height / 2,
  });
};

export const panViewportWithMiddleMouse = async (
  locator: Locator,
  pointerId: number,
  startOffset: { x: number; y: number },
  endOffset: { x: number; y: number },
): Promise<void> => {
  const startPoint = await getLocatorPoint(
    locator,
    startOffset.x,
    startOffset.y,
  );
  const endPoint = await getLocatorPoint(locator, endOffset.x, endOffset.y);

  await locator.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 1,
    buttons: 4,
    clientX: startPoint.clientX,
    clientY: startPoint.clientY,
  });
  await locator.dispatchEvent("pointermove", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 1,
    buttons: 4,
    clientX: endPoint.clientX,
    clientY: endPoint.clientY,
  });
  await locator.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 1,
    buttons: 0,
    clientX: endPoint.clientX,
    clientY: endPoint.clientY,
  });
};

export const dispatchPointerClickAtOffset = async (
  locator: Locator,
  pointerId: number,
  offset: { x: number; y: number },
): Promise<void> => {
  const point = await getLocatorPoint(locator, offset.x, offset.y);

  await locator.dispatchEvent("pointermove", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: -1,
    buttons: 0,
    clientX: point.clientX,
    clientY: point.clientY,
  });
  await locator.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: point.clientX,
    clientY: point.clientY,
  });
  await locator.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: point.clientX,
    clientY: point.clientY,
  });
};

export const clickLocatorWithMouseAtOffset = async (
  page: Page,
  locator: Locator,
  offset: { x: number; y: number },
): Promise<void> => {
  const point = await getLocatorPoint(locator, offset.x, offset.y);

  await page.mouse.move(point.clientX, point.clientY);
  await page.mouse.down();
  await page.mouse.up();
};
