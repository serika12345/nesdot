import { expect, test } from "@playwright/test";
import { gotoApp } from "./support/app";

test("palette picker updates the active palette, slot, and color summary", async ({
  page,
}) => {
  await gotoApp(page);

  const activePaletteSummary = page.getByRole("heading", {
    name: /パレット \d \/ スロット \d/u,
  });
  const paletteListToggle = page.getByRole("button", {
    name: "パレットを開く",
  });
  const transparentSlot = page.getByRole("button", {
    name: "背景パレット 0 スロット 0",
  });
  const targetSlot = page.getByRole("button", {
    name: "背景パレット 1 スロット 2",
  });
  const closeColorLibraryButton = page.getByRole("button", {
    name: "色ライブラリを閉じる",
  });

  await expect(activePaletteSummary).toHaveText("パレット 0 / スロット 1");

  await paletteListToggle.click();

  await expect(transparentSlot).toBeVisible();
  await expect(transparentSlot).toBeDisabled();
  await expect(targetSlot).toBeVisible();

  await targetSlot.click();

  await expect(activePaletteSummary).toHaveText("パレット 1 / スロット 2");
  await expect(closeColorLibraryButton).toBeVisible();

  await page.getByRole("button", { name: "NES色 #0A", exact: true }).click();

  await expect(page.getByText("#0A", { exact: true })).toBeVisible();

  await closeColorLibraryButton.click();
  await expect(
    page.getByRole("button", { name: "NES色 #0A", exact: true }),
  ).toHaveCount(0);
});
