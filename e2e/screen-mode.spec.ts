import { expect, test } from "@playwright/test";
import { gotoApp, openMode } from "./support/app";
import {
  getCanvasSize,
  panViewportWithMiddleMouse,
  zoomViewportAtCenter,
} from "./support/pointer";

test("screen mode editor panel scrolls as a single unit", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await gotoApp(page);
  await openMode(page, "画面配置");

  const editorPanel = page.getByRole("region", {
    name: "スクリーン配置編集パネル",
  });

  await expect(editorPanel).toBeVisible();

  const initialDimensions = await editorPanel.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));

  expect(initialDimensions.scrollHeight).toBeGreaterThan(
    initialDimensions.clientHeight,
  );

  await editorPanel.evaluate((element) => {
    element.scrollTo({ top: element.scrollHeight });
  });

  await expect
    .poll(async () => editorPanel.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
});

test("screen mode summary omits screen and constraint metrics", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "画面配置");

  const editorPanel = page.getByRole("region", {
    name: "スクリーン配置編集パネル",
  });

  await expect(editorPanel).toBeVisible();
  await expect(editorPanel.getByText("配置中", { exact: true })).toBeVisible();
  await expect(editorPanel.getByText("画面", { exact: true })).toHaveCount(0);
  await expect(editorPanel.getByText("制約", { exact: true })).toHaveCount(0);
});

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

test("screen mode keeps project action buttons grouped", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoApp(page);
  await openMode(page, "画面配置");

  const shareButton = page.getByRole("button", { name: "共有", exact: true });
  const restoreButton = page.getByRole("button", {
    name: "復元",
    exact: true,
  });

  await expect(shareButton).toBeVisible();
  await expect(restoreButton).toBeVisible();

  const [shareRect, restoreRect] = await Promise.all([
    shareButton.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
      };
    }),
    restoreButton.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
      };
    }),
  ]);

  expect(Math.abs(shareRect.top - restoreRect.top)).toBeLessThanOrEqual(2);

  const horizontalGap =
    shareRect.left <= restoreRect.left
      ? restoreRect.left - shareRect.right
      : shareRect.left - restoreRect.right;

  expect(horizontalGap).toBeGreaterThanOrEqual(0);
  expect(horizontalGap).toBeLessThanOrEqual(24);
});
