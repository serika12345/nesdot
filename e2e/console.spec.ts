import { expect, test } from "@playwright/test";
import { openFileMenu } from "./support/app";

test("captures browser console and page errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    const line = `[browser:${message.type()}] ${message.text()}`;
    console.log(line);

    if (message.type() === "error") {
      consoleErrors[consoleErrors.length] = line;
    }
  });

  page.on("pageerror", (error) => {
    const line = `[pageerror] ${error.message}`;
    console.log(line);
    pageErrors[pageErrors.length] = line;
  });

  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await page.waitForTimeout(500);

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("layout follows window resize", async ({ page }) => {
  await page.goto("/");

  await page.setViewportSize({ width: 900, height: 700 });

  const bodyMinWidth = await page.evaluate(
    () => window.getComputedStyle(document.body).minWidth,
  );

  await expect(
    page
      .getByRole("toolbar", { name: "ファイル操作メニューバー" })
      .locator('[aria-haspopup="menu"]')
      .filter({ hasText: "作業モード" })
      .first(),
  ).toBeVisible();
  expect(bodyMinWidth).toBe("0px");
});

test("shows global app menu controls", async ({ page }) => {
  await page.goto("/");

  const menuBar = page.getByRole("toolbar", {
    name: "ファイル操作メニューバー",
  });

  await expect(menuBar).toBeVisible();
  await expect(
    menuBar
      .locator('[aria-haspopup="menu"]')
      .filter({ hasText: "作業モード" })
      .first(),
  ).toBeVisible();
  await expect(
    menuBar
      .locator('[aria-haspopup="menu"]')
      .filter({ hasText: "ファイル" })
      .first(),
  ).toBeVisible();
  await expect(
    menuBar
      .locator('[aria-haspopup="menu"]')
      .filter({ hasText: "ヘルプ" })
      .first(),
  ).toBeVisible();

  await menuBar
    .locator('[aria-haspopup="menu"]')
    .filter({ hasText: "作業モード" })
    .first()
    .click();
  await expect(
    page
      .locator('[role="menuitem"]')
      .filter({ hasText: "スプライト編集" })
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator('[role="menuitem"]')
      .filter({ hasText: "キャラクター編集" })
      .first(),
  ).toBeVisible();
  await expect(
    page.locator('[role="menuitem"]').filter({ hasText: "画面配置" }).first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await openFileMenu(page);
  await expect(
    page.locator('[role="menuitem"]').filter({ hasText: "共有" }).first(),
  ).toBeVisible();
  await expect(
    page.locator('[role="menuitem"]').filter({ hasText: "復元" }).first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await menuBar
    .locator('[aria-haspopup="menu"]')
    .filter({ hasText: "ヘルプ" })
    .first()
    .click();
  await page
    .locator('[role="menuitem"]')
    .filter({ hasText: "About" })
    .first()
    .click();
  await expect(page.getByRole("dialog", { name: "About" })).toBeVisible();
  await expect(page.getByRole("img", { name: "nesdot icon" })).toBeVisible();
  await expect(page.getByText(/^Version /)).toBeVisible();
  await expect(page.getByText("nesdot").first()).toBeVisible();
});

test("includes pwa manifest and app icons", async ({ page }) => {
  await page.goto("/");

  const manifestLink = page.locator('link[rel="manifest"]');
  const faviconSvgLink = page.locator('link[rel="icon"][type="image/svg+xml"]');
  const faviconPngLink = page.locator('link[rel="icon"][type="image/png"]');
  const appleTouchIconLink = page.locator('link[rel="apple-touch-icon"]');

  await expect(manifestLink).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(faviconSvgLink).toHaveAttribute("href", "/favicon.svg");
  await expect(faviconPngLink).toHaveAttribute("href", "/favicon-32x32.png");
  await expect(appleTouchIconLink).toHaveAttribute(
    "href",
    "/apple-touch-icon.png",
  );
});
