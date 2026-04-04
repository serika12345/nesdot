import { expect, test } from "@playwright/test";
import { gotoApp, openMode } from "./support/app";
import {
  getCanvasSize,
  panViewportWithMiddleMouse,
  zoomViewportAtCenter,
} from "./support/pointer";

test("screen mode supports canvas zooming and panning", async ({ page }) => {
  await gotoApp(page);
  await openMode(page, "画面配置");

  const viewport = page.getByLabel("画面プレビューキャンバスビュー");
  const canvas = page.getByLabel("画面プレビューキャンバス", { exact: true });

  await expect(viewport).toBeVisible();
  await expect(canvas).toBeVisible();

  const defaultCanvasSize = await getCanvasSize(canvas);

  expect(defaultCanvasSize.width).toBe(512);
  expect(defaultCanvasSize.height).toBe(480);

  await zoomViewportAtCenter(viewport, -120);

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

  await panViewportWithMiddleMouse(
    viewport,
    17,
    { x: 220, y: 200 },
    { x: 180, y: 170 },
  );

  await expect
    .poll(async () => viewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(initialScroll.left);
  await expect
    .poll(async () => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(initialScroll.top);

  await page.getByRole("button", { name: "画面ズーム縮小" }).click();

  await expect.poll(async () => (await getCanvasSize(canvas)).width).toBe(768);
  await expect.poll(async () => (await getCanvasSize(canvas)).height).toBe(720);
});
