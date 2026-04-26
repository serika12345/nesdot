import { expect, test } from "@playwright/test";
import { gotoApp } from "./support/app";

test("palette picker updates the active palette, slot, and color summary", async ({
  page,
}) => {
  await gotoApp(page);

  const activePaletteSummary = page.getByRole("heading", {
    name: /パレット \d \/ スロット \d/u,
  });
  const transparentSlot = page.getByRole("button", {
    name: "背景パレット 0 スロット 0",
  });
  const targetSlot = page.getByRole("button", {
    name: "背景パレット 1 スロット 2",
  });
  const selectedColorButton = page.getByRole("button", {
    name: "NES色 #0A",
    exact: true,
  });

  await expect(activePaletteSummary).toHaveText("パレット 0 / スロット 1");
  await expect(
    page.getByRole("button", { name: "パレットを開く" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "色ライブラリを開く" }),
  ).toHaveCount(0);
  await expect(transparentSlot).toBeVisible();
  await expect(transparentSlot).toBeDisabled();
  await expect(targetSlot).toBeVisible();
  await expect(selectedColorButton).toBeVisible();
  await expect(selectedColorButton).toHaveAttribute("aria-pressed", "false");

  await targetSlot.click();

  await expect(activePaletteSummary).toHaveText("パレット 1 / スロット 2");
  await expect(selectedColorButton).toBeVisible();

  await selectedColorButton.click();

  await expect(selectedColorButton).toHaveAttribute("aria-pressed", "true");
});
