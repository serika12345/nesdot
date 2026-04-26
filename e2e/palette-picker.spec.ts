import { expect, test } from "@playwright/test";
import { gotoApp } from "./support/app";
import { getLocatorRect } from "./support/pointer";

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

test("palette picker stacks palettes in a single column", async ({ page }) => {
  await gotoApp(page);

  const paletteZeroSlot = page.getByRole("button", {
    name: "背景パレット 0 スロット 1",
  });
  const paletteOneSlot = page.getByRole("button", {
    name: "背景パレット 1 スロット 1",
  });

  await expect(paletteZeroSlot).toBeVisible();
  await expect(paletteOneSlot).toBeVisible();

  const [paletteZeroRect, paletteOneRect] = await Promise.all([
    getLocatorRect(paletteZeroSlot),
    getLocatorRect(paletteOneSlot),
  ]);

  expect(
    Math.abs(paletteOneRect.clientX - paletteZeroRect.clientX),
  ).toBeLessThanOrEqual(1);
  expect(paletteOneRect.clientY).toBeGreaterThan(
    paletteZeroRect.clientY + paletteZeroRect.height,
  );
});

test("palette picker sidebar fits without scrolling at a compact viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 640 });
  await gotoApp(page);

  const sidebar = page.getByRole("complementary", {
    name: "パレット編集サイドバー",
  });
  const scrollRegion = sidebar.getByRole("region", {
    name: "パレット編集スクロール領域",
  });

  await expect(sidebar).toBeVisible();
  await expect(scrollRegion).toBeVisible();

  const scrollRegionDimensions = await scrollRegion.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));

  const libraryRegion = page.getByRole("region", { name: "色ライブラリ" });

  await expect(libraryRegion).toBeVisible();

  const scrollRegionRect = await scrollRegion.evaluate((element) => {
    const { bottom } = element.getBoundingClientRect();

    return {
      bottom,
    };
  });

  const libraryRegionRect = await libraryRegion.evaluate((element) => {
    const { bottom } = element.getBoundingClientRect();

    return {
      bottom,
    };
  });

  expect(scrollRegionDimensions.scrollHeight).toBeLessThanOrEqual(
    scrollRegionDimensions.clientHeight,
  );
  expect(
    Math.abs(libraryRegionRect.bottom - scrollRegionRect.bottom),
  ).toBeLessThanOrEqual(1);
});

test("palette picker color library uses six circular columns without oversized row gaps", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 640 });
  await gotoApp(page);

  const colorButtons = await Promise.all(
    ["00", "01", "02", "03", "04", "05", "06"].map((hex) =>
      page.getByRole("button", {
        name: `NES色 #${hex}`,
        exact: true,
      }),
    ),
  );

  await Promise.all(
    colorButtons.map(async (button) => expect(button).toBeVisible()),
  );

  const colorRects = await Promise.all(
    colorButtons.map(async (button) => getLocatorRect(button)),
  );

  const firstRowTop = colorRects[0]?.clientY ?? 0;
  const firstButtonSize = colorRects[0]?.height ?? 0;
  const secondRowTop = colorRects[6]?.clientY ?? 0;
  const rowGap = secondRowTop - firstRowTop - firstButtonSize;

  colorRects.slice(0, 6).forEach((rect) => {
    expect(Math.abs(rect.clientY - firstRowTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(rect.width - rect.height)).toBeLessThanOrEqual(1);
  });

  expect(secondRowTop).toBeGreaterThan(firstRowTop + 1);
  expect(rowGap).toBeLessThanOrEqual(firstButtonSize / 2);
});
