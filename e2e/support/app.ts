import { expect, type Page } from "@playwright/test";

type AppMenuLabel = "作業モード" | "ファイル" | "編集" | "ヘルプ";

const getAppMenuBar = (page: Page) =>
  page.getByRole("menubar", {
    name: "ファイル操作メニューバー",
  });

export const getMenuTrigger = (page: Page, label: AppMenuLabel) =>
  getAppMenuBar(page).getByRole("menuitem", {
    name: label,
    exact: true,
  });

export const getVisibleMenuItem = (page: Page, label: string | RegExp) =>
  page.getByRole("menuitem", { name: label });

export const gotoApp = async (page: Page): Promise<void> => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
};

export const openMode = async (
  page: Page,
  modeName: "スプライト編集" | "画面配置" | "キャラクター編集" | "BG編集",
): Promise<void> => {
  await getMenuTrigger(page, "作業モード").click();
  await expect(getVisibleMenuItem(page, modeName)).toBeVisible();
  await getVisibleMenuItem(page, modeName).click();
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
  await getMenuTrigger(page, "ファイル").click();
  await expect(getVisibleMenuItem(page, "共有")).toBeVisible();
};

export const openShareSubmenu = async (page: Page): Promise<void> => {
  const shareMenuItem = getVisibleMenuItem(page, "共有");

  await shareMenuItem.focus();
  await page.keyboard.press("Enter");

  await expect(
    page.getByRole("menuitem", { name: "PNGエクスポート" }),
  ).toBeVisible();
};
