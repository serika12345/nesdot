import { expect, type Page } from "@playwright/test";

export const gotoApp = async (page: Page): Promise<void> => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
};

export const openMode = async (
  page: Page,
  modeName: "スプライト編集" | "画面配置" | "キャラクター編集",
): Promise<void> => {
  if (modeName !== "スプライト編集") {
    await page.getByRole("button", { name: modeName }).click();
  }

  await expect(page.getByRole("button", { name: modeName })).toBeVisible();
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
