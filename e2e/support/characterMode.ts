import { type Locator, type Page } from "@playwright/test";
import { getLocatorPoint } from "./pointer";

interface StageDebugState {
  activeSetName: string;
  selectedSpriteIndex: string;
  selectedSpriteLayer: string;
  selectedSpriteX: string;
  selectedSpriteY: string;
  stageSpriteCount: string;
}

export const seedDiagonalSprite = async (page: Page): Promise<void> => {
  await page.evaluate(async () => {
    const projectStoreModulePath = "/application/state/projectStore";
    const { useProjectState } = await import(projectStoreModulePath);

    const current = useProjectState.getState();
    const nextSprites = current.sprites.map((sprite, spriteIndex) =>
      spriteIndex === 0
        ? {
            ...sprite,
            pixels: sprite.pixels.map((row, rowIndex) =>
              row.map((value, columnIndex) =>
                rowIndex === columnIndex && rowIndex < 4 ? 1 : value,
              ),
            ),
          }
        : sprite,
    );

    useProjectState.setState({
      ...current,
      sprites: nextSprites,
    });
  });
};

export const getStageDebugState = async (
  locator: Locator,
): Promise<StageDebugState> =>
  locator.evaluate((element) => ({
    activeSetName: element.getAttribute("data-active-set-name") ?? "",
    selectedSpriteIndex:
      element.getAttribute("data-selected-sprite-index") ?? "",
    selectedSpriteLayer:
      element.getAttribute("data-selected-sprite-layer") ?? "",
    selectedSpriteX: element.getAttribute("data-selected-sprite-x") ?? "",
    selectedSpriteY: element.getAttribute("data-selected-sprite-y") ?? "",
    stageSpriteCount: element.getAttribute("data-stage-sprite-count") ?? "",
  }));

export const getStageGridState = async (
  locator: Locator,
): Promise<{ backgroundSize: string }> =>
  locator.evaluate((element) => ({
    backgroundSize: window.getComputedStyle(element, "::before").backgroundSize,
  }));

export const clickComposeCanvasAtPosition = async (
  locator: Locator,
  stageX: number,
  stageY: number,
  pointerId: number,
): Promise<void> => {
  const fabricCanvas = locator.locator('[data-fabric="top"]');
  const target = (await fabricCanvas.count()) > 0 ? fabricCanvas : locator;
  const point = await getLocatorPoint(locator, stageX, stageY);

  await target.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: point.clientX,
    clientY: point.clientY,
  });
  await target.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: point.clientX,
    clientY: point.clientY,
  });
};

export const openComposeCanvasSpriteContextMenu = async (
  locator: Locator,
  sprite: { x: number; y: number },
  scale: number,
): Promise<void> => {
  const fabricCanvas = locator.locator('[data-fabric="top"]');
  const target = (await fabricCanvas.count()) > 0 ? fabricCanvas : locator;
  const point = await getLocatorPoint(
    locator,
    (sprite.x + 4) * scale,
    (sprite.y + 4) * scale,
  );

  await target.dispatchEvent("pointerdown", {
    pointerId: 101,
    pointerType: "mouse",
    isPrimary: true,
    button: 2,
    buttons: 2,
    clientX: point.clientX,
    clientY: point.clientY,
  });
  await target.dispatchEvent("pointerup", {
    pointerId: 101,
    pointerType: "mouse",
    isPrimary: true,
    button: 2,
    buttons: 0,
    clientX: point.clientX,
    clientY: point.clientY,
  });
};

export const clickCanvasPixel = async (
  locator: Locator,
  pixelX: number,
  pixelY: number,
): Promise<void> => {
  const rect = await locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const stageWidth = Number(element.getAttribute("data-stage-width") ?? "0");
    const stageHeight = Number(
      element.getAttribute("data-stage-height") ?? "0",
    );

    return {
      width: bounds.width,
      height: bounds.height,
      stageWidth: stageWidth > 0 ? stageWidth : 1,
      stageHeight: stageHeight > 0 ? stageHeight : 1,
    };
  });
  const point = await getLocatorPoint(
    locator,
    (pixelX + 0.25) * (rect.width / rect.stageWidth),
    (pixelY + 0.25) * (rect.height / rect.stageHeight),
  );

  await locator.dispatchEvent("pointerdown", {
    pointerId: pixelX + pixelY + 20,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: point.clientX,
    clientY: point.clientY,
  });
  await locator.dispatchEvent("pointerup", {
    pointerId: pixelX + pixelY + 20,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: point.clientX,
    clientY: point.clientY,
  });
};
