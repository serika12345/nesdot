import { expect, test } from "@playwright/test";
import { gotoApp, openMode, selectMaterialOption } from "./support/app";

test("sprite mode keeps form controls and tool panel interactions working", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "スプライト編集");

  await expect(
    page.getByRole("heading", { name: "スプライト編集" }),
  ).toBeVisible();
  await expect(page.getByLabel("スプライト番号")).toHaveValue("0");
  await expect(page.getByRole("combobox", { name: "パレット" })).toContainText(
    "パレット 0",
  );

  await page.getByLabel("スプライト番号").fill("12");
  await expect(page.getByLabel("スプライト番号")).toHaveValue("12");

  await selectMaterialOption(page, "パレット", "パレット 2");
  await expect(page.getByRole("combobox", { name: "パレット" })).toContainText(
    "パレット 2",
  );

  await page.getByRole("button", { name: "ツールを開く" }).click();
  await expect(page.getByRole("button", { name: "ペン" })).toBeVisible();
  await expect(page.getByRole("button", { name: "消しゴム" })).toBeVisible();
  await expect(page.getByRole("button", { name: "並べ替え" })).toBeVisible();

  await page.getByRole("button", { name: "並べ替え" }).click();
  await expect(
    page.getByRole("button", { name: "並べ替え終了" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "ツールを閉じる" }).click();
  await expect(page.getByRole("button", { name: "ペン" })).toHaveCount(0);
});

test("sprite canvas panel stretches to the bottom of the workspace", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "スプライト編集");

  const leftPane = page.getByRole("region", { name: "スプライト編集パネル" });
  const canvasPanel = page.getByRole("region", {
    name: "スプライトキャンバスパネル",
  });

  await expect(leftPane).toBeVisible();
  await expect(canvasPanel).toBeVisible();

  const [leftPaneBottom, canvasPanelBottom] = await Promise.all([
    leftPane.evaluate((element) => element.getBoundingClientRect().bottom),
    canvasPanel.evaluate((element) => element.getBoundingClientRect().bottom),
  ]);
  const bottomGap = leftPaneBottom - canvasPanelBottom;

  expect(bottomGap).toBeLessThanOrEqual(24);
});
