import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  getMenuTrigger,
  getVisibleMenuItem,
  gotoApp,
  openFileMenu,
  openMode,
} from "./support/app";
import { serveBuiltAppAtBasePath } from "./support/staticPreview";

const isMenuItemDisabled = async (locator: Locator): Promise<boolean> =>
  locator.evaluate((element) => {
    const ariaDisabled = element.getAttribute("aria-disabled");

    return ariaDisabled === "true";
  });

const expectFileMenuState = async (
  page: Page,
  expected: {
    shareDisabled: boolean;
    restoreDisabled: boolean;
  },
): Promise<void> => {
  await openFileMenu(page);

  const shareMenuItem = getVisibleMenuItem(page, "共有");
  const restoreMenuItem = getVisibleMenuItem(page, "復元");

  await expect(shareMenuItem).toBeVisible();
  await expect(restoreMenuItem).toBeVisible();

  expect(await isMenuItemDisabled(shareMenuItem)).toBe(expected.shareDisabled);
  expect(await isMenuItemDisabled(restoreMenuItem)).toBe(
    expected.restoreDisabled,
  );

  await page.keyboard.press("Escape");
};

const openHelpMenu = async (page: Page): Promise<void> => {
  await getMenuTrigger(page, "ヘルプ").click();
};

const emulateTauriRuntime = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {},
    });
  });
};

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

  await gotoApp(page);
  await page.waitForTimeout(500);

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("loads a pages-style built artifact without console or page errors", async ({
  page,
}) => {
  const staticPreview = await serveBuiltAppAtBasePath("/nesdot/");
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

  try {
    await page.goto(staticPreview.url);

    await expect(getMenuTrigger(page, "作業モード")).toBeVisible();
    await expect(page.locator('link[rel="manifest"]').first()).toHaveAttribute(
      "href",
      "/nesdot/manifest.webmanifest",
    );
    await expect(
      page.locator('link[rel="icon"][type="image/svg+xml"]'),
    ).toHaveAttribute("href", "/nesdot/favicon.svg");

    await page.waitForTimeout(500);

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  } finally {
    await staticPreview.dispose();
  }
});

test("layout follows window resize", async ({ page }) => {
  await gotoApp(page);

  await page.setViewportSize({ width: 900, height: 700 });

  const bodyMinWidth = await page.evaluate(
    () => window.getComputedStyle(document.body).minWidth,
  );

  await expect(getMenuTrigger(page, "作業モード")).toBeVisible();
  expect(bodyMinWidth).toBe("0px");
});

test("shows global app menu controls", async ({ page }) => {
  await gotoApp(page);

  type TopLevelTriggerLabel =
    | "作業モード"
    | "編集"
    | "表示"
    | "ファイル"
    | "ヘルプ";

  const menuBar = page.getByRole("menubar", {
    name: "ファイル操作メニューバー",
  });
  const topLevelTriggerLabels: ReadonlyArray<TopLevelTriggerLabel> = [
    "作業モード",
    "表示",
    "編集",
    "ファイル",
    "ヘルプ",
  ];

  await expect(menuBar).toBeVisible();
  await expect(getMenuTrigger(page, "作業モード")).toBeVisible();
  await expect(getMenuTrigger(page, "ファイル")).toBeVisible();
  await expect(getMenuTrigger(page, "編集")).toBeVisible();
  await expect(getMenuTrigger(page, "表示")).toBeVisible();
  await expect(getMenuTrigger(page, "ヘルプ")).toBeVisible();

  const triggerPositions = await Promise.all(
    topLevelTriggerLabels.map(async (label) => {
      const box = await getMenuTrigger(page, label).boundingBox();
      const hasBoundingBox = box instanceof Object;

      return {
        x: hasBoundingBox ? box.x : -1,
        y: hasBoundingBox ? box.y : -1,
      };
    }),
  );

  triggerPositions.forEach((position) => {
    expect(position.x).toBeGreaterThanOrEqual(0);
    expect(position.y).toBeGreaterThanOrEqual(0);
  });

  const firstTriggerY = triggerPositions[0]?.y ?? -1;

  expect(
    Math.abs((triggerPositions[1]?.y ?? -1) - firstTriggerY),
  ).toBeLessThanOrEqual(2);
  expect(
    Math.abs((triggerPositions[2]?.y ?? -1) - firstTriggerY),
  ).toBeLessThanOrEqual(2);
  expect(
    Math.abs((triggerPositions[3]?.y ?? -1) - firstTriggerY),
  ).toBeLessThanOrEqual(2);
  expect(
    Math.abs((triggerPositions[4]?.y ?? -1) - firstTriggerY),
  ).toBeLessThanOrEqual(2);
  expect(triggerPositions[1]?.x ?? -1).toBeGreaterThan(
    triggerPositions[0]?.x ?? -1,
  );
  expect(triggerPositions[2]?.x ?? -1).toBeGreaterThan(
    triggerPositions[1]?.x ?? -1,
  );
  expect(triggerPositions[3]?.x ?? -1).toBeGreaterThan(
    triggerPositions[2]?.x ?? -1,
  );
  expect(triggerPositions[4]?.x ?? -1).toBeGreaterThan(
    triggerPositions[3]?.x ?? -1,
  );

  await getMenuTrigger(page, "作業モード").click();
  await expect(getVisibleMenuItem(page, "スプライト編集")).toBeVisible();
  await expect(getVisibleMenuItem(page, "キャラクター編集")).toBeVisible();
  await expect(getVisibleMenuItem(page, "画面配置")).toBeVisible();
  await expect(getVisibleMenuItem(page, "BG編集")).toBeVisible();
  await page.keyboard.press("Escape");

  await getMenuTrigger(page, "編集").click();
  const undoMenuItem = getVisibleMenuItem(page, /アンドゥ/);
  const redoMenuItem = getVisibleMenuItem(page, /リドゥ/);
  await expect(undoMenuItem).toBeVisible();
  await expect(undoMenuItem).toContainText(/(Ctrl\+Z|⌘Z)/);
  await expect(redoMenuItem).toBeVisible();
  await expect(redoMenuItem).toContainText(/(Ctrl\+Shift\+Z|Ctrl\+Y|⇧⌘Z)/);
  await page.keyboard.press("Escape");

  await getMenuTrigger(page, "表示").click();
  await expect(getVisibleMenuItem(page, "ライト")).toBeVisible();
  await expect(getVisibleMenuItem(page, "ダーク")).toBeVisible();
  await expect(getVisibleMenuItem(page, "システムに合わせる")).toBeVisible();
  await page.keyboard.press("Escape");

  await openFileMenu(page);
  await expect(getVisibleMenuItem(page, "共有")).toBeVisible();
  await expect(getVisibleMenuItem(page, "復元")).toBeVisible();
  await page.keyboard.press("Escape");

  await getMenuTrigger(page, "ヘルプ").click();
  await expect(page.getByRole("menuitem", { name: "更新を確認" })).toHaveCount(
    0,
  );
  await getVisibleMenuItem(page, "About").click();
  const aboutDialog = page.getByRole("dialog", { name: "About" });
  await expect(aboutDialog).toBeVisible();
  await expect(
    aboutDialog.getByRole("button", { name: "更新を確認" }),
  ).toHaveCount(0);
  const aboutIcon = page.getByRole("img", { name: "nesdot icon" });
  await expect(aboutIcon).toBeVisible();

  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  expect(manifestHref).not.toBeNull();

  const expectedAboutIconPathname = new URL(
    manifestHref ?? "/manifest.webmanifest",
    page.url(),
  ).pathname.replace(/manifest\.webmanifest$/u, "pwa-192x192.png");

  const aboutIconPathname = await aboutIcon.evaluate((element) => {
    if (element instanceof HTMLImageElement) {
      return new URL(element.src).pathname;
    }

    return "";
  });

  expect(aboutIconPathname).toBe(expectedAboutIconPathname);
  await expect(page.getByText(/^Version /)).toBeVisible();
  await expect(aboutDialog.getByText("nesdot", { exact: true })).toBeVisible();
});

test("clicking the same menu trigger closes it without keeping the open styling", async ({
  page,
}) => {
  await gotoApp(page);

  const helpTrigger = getMenuTrigger(page, "ヘルプ");

  await helpTrigger.click();
  await expect(getVisibleMenuItem(page, "About")).toBeVisible();

  await helpTrigger.click();
  await expect(page.getByRole("menu", { name: "ヘルプメニュー" })).toHaveCount(
    0,
  );

  await page.mouse.move(0, 0);

  await expect
    .poll(async () =>
      helpTrigger.evaluate((element) => {
        const computedStyle = window.getComputedStyle(element);

        return {
          backgroundImage: computedStyle.backgroundImage,
          boxShadow: computedStyle.boxShadow,
        };
      }),
    )
    .toEqual({
      backgroundImage: "none",
      boxShadow: "none",
    });
});

test("work mode menu stays above the workspace and keeps a distinct surface", async ({
  page,
}) => {
  await gotoApp(page);

  await getMenuTrigger(page, "作業モード").click();

  const bgModeItem = page.getByRole("menuitemradio", {
    name: "作業モード BG編集",
  });

  await expect(bgModeItem).toBeVisible();

  await expect
    .poll(async () =>
      bgModeItem.evaluate((element) => {
        const menuSurface = element.closest('[class*="menuContentSurface"]');

        if (!(menuSurface instanceof HTMLElement)) {
          return {
            backgroundImage: "",
            hasOpaqueSurface: false,
            zIndex: "",
          };
        }

        const computedStyle = window.getComputedStyle(menuSurface);

        return {
          backgroundImage: computedStyle.backgroundImage,
          hasOpaqueSurface:
            computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)",
          zIndex: computedStyle.zIndex,
        };
      }),
    )
    .toEqual({
      backgroundImage: "none",
      hasOpaqueSurface: true,
      zIndex: "1200",
    });

  const isMenuItemTopmost = await bgModeItem.evaluate((element) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    const topElement = document.elementFromPoint(
      left + width / 2,
      top + height / 2,
    );
    const menuItem = topElement?.closest('[role="menuitemradio"]');

    return menuItem?.getAttribute("aria-label") === "作業モード BG編集";
  });

  expect(isMenuItemTopmost).toBe(true);
});

test("shows update checks inside tauri runtime", async ({ page }) => {
  await emulateTauriRuntime(page);
  await gotoApp(page);

  await openHelpMenu(page);
  await expect(getVisibleMenuItem(page, "更新を確認")).toBeVisible();

  await getVisibleMenuItem(page, "About").click();
  const aboutDialog = page.getByRole("dialog", { name: "About" });

  await expect(aboutDialog).toBeVisible();
  await expect(
    aboutDialog.getByRole("button", { name: "更新を確認" }),
  ).toBeVisible();
});

test("includes pwa manifest and app icons", async ({ page }) => {
  await gotoApp(page);

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

test("file menu availability follows the current work mode", async ({
  page,
}) => {
  await gotoApp(page);

  await expect(
    page.getByRole("region", { name: "スプライトライブラリ" }),
  ).toBeVisible();
  await expectFileMenuState(page, {
    shareDisabled: false,
    restoreDisabled: false,
  });

  await openMode(page, "BG編集");
  await expect(
    page.getByRole("region", { name: "BG編集ワークスペース", exact: true }),
  ).toBeVisible();
  await expectFileMenuState(page, {
    shareDisabled: false,
    restoreDisabled: true,
  });

  await openMode(page, "画面配置");
  await expect(
    page.getByLabel("スクリーン配置ジェスチャーワークスペース", {
      exact: true,
    }),
  ).toBeVisible();
  await expectFileMenuState(page, {
    shareDisabled: false,
    restoreDisabled: false,
  });

  await openMode(page, "キャラクター編集");
  await expect(
    page.getByLabel("キャラクター編集ロックオーバーレイ"),
  ).toBeVisible();
  await expectFileMenuState(page, {
    shareDisabled: true,
    restoreDisabled: true,
  });
});

test("about dialog closes with escape and the close button", async ({
  page,
}) => {
  await gotoApp(page);

  await openHelpMenu(page);
  await getVisibleMenuItem(page, "About").click();

  const aboutDialog = page.getByRole("dialog", { name: "About" });

  await expect(aboutDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(aboutDialog).toBeHidden();

  await openHelpMenu(page);
  await getVisibleMenuItem(page, "About").click();

  await expect(aboutDialog).toBeVisible();
  await aboutDialog.getByRole("button", { name: "閉じる" }).click();
  await expect(aboutDialog).toBeHidden();
});
