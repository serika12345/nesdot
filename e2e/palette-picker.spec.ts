import { expect, test } from "@playwright/test";
import { gotoApp } from "./support/app";

test("palette picker updates the active palette, slot, and color summary", async ({
  page,
}) => {
  await gotoApp(page);

  await expect(
    page.getByRole("heading", { name: "パレット 0 / スロット 1" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "パレットを開く" }).click();

  await expect(
    page.getByRole("button", { name: "背景パレット 0 スロット 0" }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "背景パレット 1 スロット 2" }).click();

  await expect(
    page.getByRole("heading", { name: "パレット 1 / スロット 2" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "色ライブラリを閉じる" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "NES色 #0A", exact: true }).click();

  await expect(page.getByText("#0A", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "色ライブラリを閉じる" }).click();
  await expect(
    page.getByRole("button", { name: "NES色 #0A", exact: true }),
  ).toHaveCount(0);
});
