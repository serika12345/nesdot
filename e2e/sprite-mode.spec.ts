import { expect, test, type Locator, type Page } from "@playwright/test";
import { gotoApp, openMode, selectMaterialOption } from "./support/app";
import {
  formatCanvasPixelColor,
  readLogicalCanvasPixel,
} from "./support/canvas";
import { getLocatorPoint, getLocatorRect } from "./support/pointer";

const getSpriteCanvas = (page: Page): Locator =>
  page.getByLabel("スプライト編集キャンバス", { exact: true });

const readSpriteCanvasColor = async (
  canvas: Locator,
  pixelX: number,
  pixelY: number,
  logicalHeight = 8,
): Promise<string> =>
  formatCanvasPixelColor(
    await readLogicalCanvasPixel(canvas, pixelX, pixelY, 8, logicalHeight),
  );

const clickSpriteCanvasLogicalPixel = async (
  page: Page,
  canvas: Locator,
  pixelX: number,
  pixelY: number,
  logicalHeight = 8,
): Promise<void> => {
  const rect = await getLocatorRect(canvas);
  const point = await getLocatorPoint(
    canvas,
    (pixelX + 0.5) * (rect.width / 8),
    (pixelY + 0.5) * (rect.height / logicalHeight),
  );

  await page.mouse.move(point.clientX, point.clientY);
  await page.mouse.down();
  await page.mouse.up();
};

const pressUndoShortcut = async (page: Page): Promise<void> => {
  const isMac = await page.evaluate(() => navigator.userAgent.includes("Mac"));

  await page.keyboard.press(isMac ? "Meta+Z" : "Control+Z");
};

const pressRedoShortcut = async (page: Page): Promise<void> => {
  const isMac = await page.evaluate(() => navigator.userAgent.includes("Mac"));

  await page.keyboard.press(isMac ? "Meta+Shift+Z" : "Control+Y");
};

test("sprite mode keeps form controls and tool panel interactions working", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "スプライト編集");

  await expect(
    page.getByRole("heading", { name: "スプライトライブラリ" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "スプライトキャンバス", exact: true }),
  ).toHaveCount(0);
  const spriteZeroButton = page.getByRole("button", {
    name: "スプライト 0",
    exact: true,
  });
  await expect(spriteZeroButton).toBeVisible();
  await expect(spriteZeroButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("combobox", { name: "パレット" })).toContainText(
    "パレット0",
  );

  const spriteOneButton = page.getByRole("button", {
    name: "スプライト 1",
    exact: true,
  });
  await spriteOneButton.click();
  await expect(spriteOneButton).toHaveAttribute("aria-pressed", "true");

  await selectMaterialOption(page, "パレット", "パレット2");
  await expect(page.getByRole("combobox", { name: "パレット" })).toContainText(
    "パレット2",
  );

  await page.getByRole("button", { name: "ツールを開く" }).click();
  await expect(page.getByRole("button", { name: "ペン" })).toBeVisible();
  await expect(page.getByRole("button", { name: "消しゴム" })).toBeVisible();
  await expect(page.getByRole("button", { name: "並べ替え" })).toBeVisible();

  await page.getByRole("button", { name: "並べ替え" }).click();
  await expect(
    page.getByRole("button", { name: "並べ替え終了" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "ツールを閉じる" }).click();
  await expect(page.getByRole("button", { name: "ペン" })).toHaveCount(0);
});

test("sprite canvas panel stretches to the bottom of the workspace", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "スプライト編集");

  const leftPane = page.getByRole("region", { name: "スプライトライブラリ" });
  const canvasPanel = page.getByRole("region", {
    name: "スプライトキャンバスパネル",
  });

  await expect(leftPane).toBeVisible();
  await expect(canvasPanel).toBeVisible();

  const [leftPaneBottom, canvasPanelBottom] = await Promise.all([
    leftPane.evaluate((element) => element.getBoundingClientRect().bottom),
    canvasPanel.evaluate((element) => element.getBoundingClientRect().bottom),
  ]);
  const bottomGap = leftPaneBottom - canvasPanelBottom;
  const leftPaneWidth = await leftPane.evaluate(
    (element) => element.getBoundingClientRect().width,
  );

  expect(bottomGap).toBeLessThanOrEqual(24);
  expect(leftPaneWidth).toBeGreaterThanOrEqual(240);
  expect(leftPaneWidth).toBeLessThanOrEqual(320);
});

test("sprite mode paints pixels and supports global undo and redo shortcuts", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "スプライト編集");

  const spriteCanvas = getSpriteCanvas(page);

  await expect(spriteCanvas).toBeVisible();

  const initialPixel = await readSpriteCanvasColor(spriteCanvas, 1, 1);

  await clickSpriteCanvasLogicalPixel(page, spriteCanvas, 1, 1);

  await expect
    .poll(async () => readSpriteCanvasColor(spriteCanvas, 1, 1))
    .not.toBe(initialPixel);

  const paintedPixel = await readSpriteCanvasColor(spriteCanvas, 1, 1);

  await pressUndoShortcut(page);
  await expect
    .poll(async () => readSpriteCanvasColor(spriteCanvas, 1, 1))
    .toBe(initialPixel);

  await pressRedoShortcut(page);
  await expect
    .poll(async () => readSpriteCanvasColor(spriteCanvas, 1, 1))
    .toBe(paintedPixel);
});

test("sprite mode asks confirmation before clearing the current sprite", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "スプライト編集");

  const spriteCanvas = getSpriteCanvas(page);

  await expect(spriteCanvas).toBeVisible();

  const initialPixel = await readSpriteCanvasColor(spriteCanvas, 2, 2);

  await clickSpriteCanvasLogicalPixel(page, spriteCanvas, 2, 2);
  await expect
    .poll(async () => readSpriteCanvasColor(spriteCanvas, 2, 2))
    .not.toBe(initialPixel);

  const paintedPixel = await readSpriteCanvasColor(spriteCanvas, 2, 2);

  await page.getByRole("button", { name: "ツールを開く" }).click();

  const clearButton = page.getByRole("button", { name: "クリア" });
  await expect(clearButton).toBeVisible();

  const cancelDialogPromise = page
    .waitForEvent("dialog")
    .then(async (dialog) => {
      expect(dialog.message()).toContain("本当にクリアしますか？");
      await dialog.dismiss();
    });

  await clearButton.click();
  await cancelDialogPromise;

  await expect
    .poll(async () => readSpriteCanvasColor(spriteCanvas, 2, 2))
    .toBe(paintedPixel);

  const acceptDialogPromise = page
    .waitForEvent("dialog")
    .then(async (dialog) => {
      expect(dialog.message()).toContain("本当にクリアしますか？");
      await dialog.accept();
    });

  await clearButton.click();
  await acceptDialogPromise;

  await expect
    .poll(async () => readSpriteCanvasColor(spriteCanvas, 2, 2))
    .toBe(initialPixel);
});
