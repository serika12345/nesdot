import { expect, type Page } from "@playwright/test";

export const gotoApp = async (page: Page): Promise<void> => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
};

export const openMode = async (
  page: Page,
  modeName: "スプライト編集" | "画面配置" | "キャラクター編集",
): Promise<void> => {
  const appMenuBar = page.getByRole("toolbar", {
    name: "ファイル操作メニューバー",
  });
  const modeTrigger = appMenuBar
    .locator('[aria-haspopup="menu"]')
    .filter({ hasText: "作業モード" })
    .first();

  await modeTrigger.click();

  await page
    .locator('[role="menuitem"]:visible')
    .filter({ hasText: modeName })
    .first()
    .click();
};

export const selectMaterialOption = async (
  page: Page,
  selectLabel: string,
  optionText: string,
): Promise<void> => {
  const select = page.getByRole("combobox", { name: selectLabel });
  await select.click();
  await page.getByRole("option", { name: optionText, exact: true }).click();
};

export const openFileMenu = async (page: Page): Promise<void> => {
  const fileMenuBar = page.getByRole("toolbar", {
    name: "ファイル操作メニューバー",
  });
  const fileTrigger = fileMenuBar
    .locator('[aria-haspopup="menu"]')
    .filter({ hasText: "ファイル" })
    .first();

  await fileTrigger.click();

  const shareMenuItem = page
    .locator('[role="menuitem"]:visible')
    .filter({ hasText: "共有" })
    .last();

  await expect(shareMenuItem).toBeVisible();
};

export const openShareSubmenu = async (page: Page): Promise<void> => {
  const shareMenuItem = page
    .locator('[role="menuitem"]:visible')
    .filter({ hasText: "共有" })
    .last();

  await shareMenuItem.focus();
  await page.keyboard.press("Enter");

  await expect(
    page.getByRole("menuitem", { name: /エクスポート|保存/ }).first(),
  ).toBeVisible();
};
