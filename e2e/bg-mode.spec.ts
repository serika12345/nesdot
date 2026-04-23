import { expect, test } from "@playwright/test";
import {
  getVisibleMenuItem,
  gotoApp,
  openFileMenu,
  openMode,
  openShareSubmenu,
} from "./support/app";
import {
  clickLogicalCanvasPixel,
  formatCanvasPixelColor,
  readLogicalCanvasPixel,
} from "./support/canvas";

const expectLibraryButtonToUseCardLayout = async (
  control: import("@playwright/test").Locator,
): Promise<void> => {
  const computedStyles = await control.evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      alignItems: styles.alignItems,
      height: element.getBoundingClientRect().height,
      justifyContent: styles.justifyContent,
      whiteSpace: styles.whiteSpace,
    };
  });

  expect(computedStyles.alignItems).toBe("stretch");
  expect(computedStyles.justifyContent).toBe("flex-start");
  expect(computedStyles.whiteSpace).toBe("normal");
  expect(computedStyles.height).toBeGreaterThanOrEqual(90);
};

test("bg mode edits the selected background tile", async ({ page }) => {
  await gotoApp(page);
  await openMode(page, "BG編集");

  await expect(
    page.getByRole("region", { name: "BG編集ワークスペース", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "BGタイル一覧", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "#000", exact: true }),
  ).toBeVisible();
  await expectLibraryButtonToUseCardLayout(
    page.getByRole("button", { name: "#000", exact: true }),
  );
  const bgTile255Button = page.getByRole("button", {
    name: "#255",
    exact: true,
  });
  await bgTile255Button.scrollIntoViewIfNeeded();
  await expect(bgTile255Button).toBeVisible();

  const bgTileFiveButton = page.getByRole("button", {
    name: "#005",
    exact: true,
  });
  const bgCanvas = page.getByLabel("BGタイル編集キャンバス", { exact: true });

  await bgTileFiveButton.click();
  await expect(bgTileFiveButton).toHaveAttribute("aria-pressed", "true");
  await expect(bgCanvas).toBeVisible();

  const initialPixel = formatCanvasPixelColor(
    await readLogicalCanvasPixel(bgCanvas, 1, 1, 8, 8),
  );

  await clickLogicalCanvasPixel(bgCanvas, 1, 1, 8, 8);

  await expect
    .poll(async () =>
      formatCanvasPixelColor(
        await readLogicalCanvasPixel(bgCanvas, 1, 1, 8, 8),
      ),
    )
    .not.toBe(initialPixel);

  await expect(
    page.getByRole("button", { name: "BGツールを開く", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "消しゴムツール", exact: true }),
  ).toHaveCount(0);

  await page
    .getByRole("button", { name: "BGツールを開く", exact: true })
    .click();

  await page
    .getByRole("button", { name: "消しゴムツール", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "消しゴムツール", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");

  await clickLogicalCanvasPixel(bgCanvas, 1, 1, 8, 8);

  await expect
    .poll(async () =>
      formatCanvasPixelColor(
        await readLogicalCanvasPixel(bgCanvas, 1, 1, 8, 8),
      ),
    )
    .toBe(initialPixel);

  await expect(
    page.getByRole("button", { name: "BGツールを閉じる", exact: true }),
  ).toBeVisible();

  await expect(page.getByText("ACTIVE TOOL", { exact: true })).toHaveCount(0);
  await expect(page.getByText("UI mock only", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("256 slots planned", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("16 mock previews", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText(/shell-only/u)).toHaveCount(0);
  await expect(
    page.getByText(
      /実データ接続前にタイル選択、道具、導線だけを確認できます。/u,
    ),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Tile #005", exact: true }),
  ).toHaveCount(0);
});

test("bg mode exposes export actions for the selected tile", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "BG編集");

  await openFileMenu(page);

  const shareMenuItem = getVisibleMenuItem(page, "共有");

  await expect(shareMenuItem).not.toHaveAttribute("aria-disabled", "true");

  await openShareSubmenu(page);

  await expect(
    page.getByRole("menuitem", { name: "CHRエクスポート", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "PNGエクスポート", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "SVGエクスポート", exact: true }),
  ).toBeVisible();
});
