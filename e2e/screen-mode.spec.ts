import { expect, Locator, test } from "@playwright/test";

const getCanvasSize = async (locator: Locator) =>
  locator.evaluate((element) => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }));

test("screen mode supports canvas zooming and panning", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "画面配置" }).click();

  const viewport = page.getByLabel("画面プレビューキャンバスビュー");
  const canvas = page.getByLabel("画面プレビューキャンバス", { exact: true });

  await expect(viewport).toBeVisible();
  await expect(canvas).toBeVisible();

  const defaultCanvasSize = await getCanvasSize(canvas);

  expect(defaultCanvasSize.width).toBe(512);
  expect(defaultCanvasSize.height).toBe(480);

  const viewportRect = await viewport.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  });

  await viewport.dispatchEvent("wheel", {
    ctrlKey: true,
    deltaY: -120,
    clientX: viewportRect.left + viewportRect.width / 2,
    clientY: viewportRect.top + viewportRect.height / 2,
  });

  await expect.poll(async () => (await getCanvasSize(canvas)).width).toBe(768);
  await expect.poll(async () => (await getCanvasSize(canvas)).height).toBe(720);

  await page.getByRole("button", { name: "画面ズーム拡大" }).click();

  await expect.poll(async () => (await getCanvasSize(canvas)).width).toBe(1024);
  await expect.poll(async () => (await getCanvasSize(canvas)).height).toBe(960);

  await viewport.evaluate((element) => {
    element.scrollTo({ left: 120, top: 80 });
  });

  const initialScroll = await viewport.evaluate((element) => ({
    left: element.scrollLeft,
    top: element.scrollTop,
  }));

  await viewport.dispatchEvent("pointerdown", {
    pointerId: 17,
    pointerType: "mouse",
    isPrimary: true,
    button: 1,
    buttons: 4,
    clientX: viewportRect.left + 220,
    clientY: viewportRect.top + 200,
  });
  await viewport.dispatchEvent("pointermove", {
    pointerId: 17,
    pointerType: "mouse",
    isPrimary: true,
    button: 1,
    buttons: 4,
    clientX: viewportRect.left + 180,
    clientY: viewportRect.top + 170,
  });
  await viewport.dispatchEvent("pointerup", {
    pointerId: 17,
    pointerType: "mouse",
    isPrimary: true,
    button: 1,
    buttons: 0,
    clientX: viewportRect.left + 180,
    clientY: viewportRect.top + 170,
  });

  const movedScroll = await viewport.evaluate((element) => ({
    left: element.scrollLeft,
    top: element.scrollTop,
  }));

  expect(movedScroll.left).toBeGreaterThan(initialScroll.left);
  expect(movedScroll.top).toBeGreaterThan(initialScroll.top);

  await page.getByRole("button", { name: "画面ズーム縮小" }).click();

  await expect.poll(async () => (await getCanvasSize(canvas)).width).toBe(768);
  await expect.poll(async () => (await getCanvasSize(canvas)).height).toBe(720);
});
