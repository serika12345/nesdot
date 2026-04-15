import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  getVisibleMenuItem,
  gotoApp,
  openFileMenu,
  openMode,
  openShareSubmenu,
  selectMaterialOption,
} from "./support/app";
import {
  clickCanvasPixel,
  clickComposeCanvasAtPosition,
  clickPortalButton,
  getStageDebugState,
  getStageGridState,
  openComposeCanvasSpriteContextMenu,
  seedDiagonalSprite,
} from "./support/characterMode";
import {
  getLocatorPoint,
  getLocatorRect,
  panViewportWithMiddleMouse,
  zoomViewportAtCenter,
} from "./support/pointer";

const waitForCharacterWorkspaceUnlock = async (page: Page): Promise<void> => {
  await expect(
    page.getByLabel("キャラクター編集ロックオーバーレイ"),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("キャラクター編集ワークスペース", { exact: true }),
  ).toBeVisible();
};

const createCharacterSet = async (
  page: Page,
  setName: string,
): Promise<void> => {
  await page.getByRole("button", { name: "セットを作成" }).click();

  const createDialog = page.getByRole("dialog", {
    name: "キャラクターセットを作成",
  });
  await expect(createDialog).toBeVisible();

  await createDialog
    .getByRole("textbox", { name: "新規セット名" })
    .fill(setName);
  await createDialog.getByRole("button", { name: "作成する" }).click();

  await expect(createDialog).toHaveCount(0);
};

const closeDecompositionAppliedDialog = async (page: Page): Promise<void> => {
  const feedbackDialog = page.getByRole("dialog", {
    name: "現在のセットへ反映しました",
  });
  await expect(feedbackDialog).toBeVisible();
  await feedbackDialog.getByRole("button", { name: "閉じる" }).click();
  await expect(feedbackDialog).toHaveCount(0);
};

const dragLibrarySpriteToStage = async (
  page: Page,
  spriteIndex: number,
  pointerId: number,
  dropPoint: { x: number; y: number },
): Promise<void> => {
  const stage = page.getByLabel("キャラクターステージ");
  const librarySprite = page.getByRole("button", {
    name: `ライブラリスプライト ${spriteIndex}`,
  });

  await expect(stage).toBeVisible();
  await expect(librarySprite).toBeVisible();

  const [stageRect, libraryRect] = await Promise.all([
    getLocatorRect(stage),
    getLocatorRect(librarySprite),
  ]);

  const sourceClientX = libraryRect.clientX + libraryRect.width / 2;
  const sourceClientY = libraryRect.clientY + libraryRect.height / 2;
  const destinationClientX = stageRect.clientX + dropPoint.x;
  const destinationClientY = stageRect.clientY + dropPoint.y;

  await librarySprite.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: sourceClientX,
    clientY: sourceClientY,
  });
  await librarySprite.dispatchEvent("pointermove", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: destinationClientX,
    clientY: destinationClientY,
  });
  await librarySprite.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: destinationClientX,
    clientY: destinationClientY,
  });
};

const hasVisibleComposePixels = async (
  composeCanvas: Locator,
): Promise<boolean> =>
  composeCanvas.evaluate((element) => {
    if (element instanceof HTMLElement === false) {
      return false;
    }

    const candidate = element.querySelector('[data-fabric="main"]');

    if (candidate instanceof HTMLCanvasElement === false) {
      return false;
    }

    const context = candidate.getContext("2d");
    if (context instanceof CanvasRenderingContext2D === false) {
      return false;
    }

    const alphaStep = 4;
    const alphaChannelOffset = 3;
    const pixelData = context.getImageData(
      0,
      0,
      candidate.width,
      candidate.height,
    );

    return pixelData.data.some(
      (value, index) => index % alphaStep === alphaChannelOffset && value > 0,
    );
  });

const paintSpriteModePixel = async (
  page: Page,
  pixel: { x: number; y: number },
): Promise<void> => {
  const spriteCanvas = page.getByLabel("スプライト編集キャンバス", {
    exact: true,
  });

  await expect(spriteCanvas).toBeVisible();

  const spriteCanvasScale = 24;
  const point = await getLocatorPoint(
    spriteCanvas,
    (pixel.x + 0.5) * spriteCanvasScale,
    (pixel.y + 0.5) * spriteCanvasScale,
  );

  await page.mouse.move(point.clientX, point.clientY);
  await page.mouse.down();
  await page.mouse.up();
};

test("character mode keeps set controls on a single row", async ({ page }) => {
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  const composeModeButton = page.getByRole("button", {
    name: "編集モード 合成",
  });
  const spriteSize8Button = page.getByRole("button", {
    name: "プロジェクトスプライトサイズ 8x8",
  });
  const createSetButton = page.getByRole("button", { name: "セットを作成" });
  const activeSetSelect = page.getByRole("combobox", {
    name: "編集中のセット",
  });
  const renameSetButton = page.getByRole("button", { name: "セット名変更" });
  const deleteSetButton = page.getByRole("button", { name: "セットを削除" });

  await expect(page.getByRole("textbox", { name: "新規セット名" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("textbox", { name: "セット名" })).toHaveCount(0);
  await expect(page.getByText("編集中のセット", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText("編集モード", { exact: true })).toHaveCount(0);
  await expect(page.getByText("スプライト単位", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("heading", { name: "キャラクター編集", exact: true }),
  ).toHaveCount(0);
  await expect(composeModeButton).toBeVisible();
  await expect(spriteSize8Button).toBeVisible();
  await expect(createSetButton).toBeVisible();
  await expect(activeSetSelect).toBeVisible();
  await expect(renameSetButton).toBeVisible();
  await expect(deleteSetButton).toBeVisible();

  const [
    composeModeButtonBox,
    spriteSize8ButtonBox,
    createSetButtonBox,
    activeSetSelectBox,
    renameSetButtonBox,
    deleteSetButtonBox,
  ] = await Promise.all([
    getLocatorRect(composeModeButton),
    getLocatorRect(spriteSize8Button),
    getLocatorRect(createSetButton),
    getLocatorRect(activeSetSelect),
    getLocatorRect(renameSetButton),
    getLocatorRect(deleteSetButton),
  ]);

  const selectRowBottoms = [
    activeSetSelectBox.clientY + activeSetSelectBox.height,
    renameSetButtonBox.clientY + renameSetButtonBox.height,
    deleteSetButtonBox.clientY + deleteSetButtonBox.height,
  ];
  const selectRowBottomSpread =
    Math.max(...selectRowBottoms) - Math.min(...selectRowBottoms);

  expect(
    composeModeButtonBox.clientX + composeModeButtonBox.width,
  ).toBeLessThan(createSetButtonBox.clientX);
  expect(
    spriteSize8ButtonBox.clientX + spriteSize8ButtonBox.width,
  ).toBeLessThan(createSetButtonBox.clientX);
  expect(selectRowBottomSpread).toBeLessThan(2);
  expect(activeSetSelectBox.clientX).toBeLessThan(renameSetButtonBox.clientX);
  expect(renameSetButtonBox.clientX).toBeLessThan(deleteSetButtonBox.clientX);
  expect(activeSetSelectBox.clientX).toBeLessThan(deleteSetButtonBox.clientX);
});

test("character mode enables share actions only after a set is available", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  await openFileMenu(page);

  const shareMenuItem = getVisibleMenuItem(page, "共有");

  await expect(shareMenuItem).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");

  await createCharacterSet(page, "Share Hero");

  await openFileMenu(page);
  await expect(shareMenuItem).not.toHaveAttribute("aria-disabled", "true");

  await openShareSubmenu(page);

  await expect(
    page.getByRole("menuitem", { name: "PNGエクスポート" }),
  ).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "SVGエクスポート" }),
  ).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "キャラクターJSON書き出し" }),
  ).toBeVisible();
});

test("character mode asks confirmation before deleting a set", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Delete Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const activeSetSelect = page.getByRole("combobox", {
    name: "編集中のセット",
  });
  const deleteSetButton = page.getByRole("button", { name: "セットを削除" });

  await expect(activeSetSelect).toContainText("Delete Hero (0 sprites)");

  const cancelDialogPromise = page
    .waitForEvent("dialog")
    .then(async (dialog) => {
      expect(dialog.message()).toContain("セットを削除");
      await dialog.dismiss();
    });
  await deleteSetButton.click();
  await cancelDialogPromise;

  await expect(activeSetSelect).toContainText("Delete Hero (0 sprites)");

  const acceptDialogPromise = page
    .waitForEvent("dialog")
    .then(async (dialog) => {
      expect(dialog.message()).toContain("セットを削除");
      await dialog.accept();
    });
  await deleteSetButton.click();
  await acceptDialogPromise;

  await expect(
    page.getByLabel("キャラクター編集ロックオーバーレイ"),
  ).toBeVisible();
  await expect(deleteSetButton).toBeDisabled();
});

test("character mode renames set from dialog", async ({ page }) => {
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Rename Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const activeSetSelect = page.getByRole("combobox", {
    name: "編集中のセット",
  });
  const renameSetButton = page.getByRole("button", { name: "セット名変更" });

  await expect(activeSetSelect).toContainText("Rename Hero (0 sprites)");
  await expect(renameSetButton).toBeEnabled();

  await renameSetButton.click();

  const renameDialog = page.getByRole("dialog", { name: "セット名を変更" });
  await expect(renameDialog).toBeVisible();

  const renameTextbox = renameDialog.getByRole("textbox", {
    name: "変更後のセット名",
  });
  await renameTextbox.fill("Renamed Hero");
  await renameDialog.getByRole("button", { name: "変更する" }).click();

  await expect(renameDialog).toHaveCount(0);
  await expect(activeSetSelect).toContainText("Renamed Hero (0 sprites)");
});

test("character mode locks workspace interactions until a set is created", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  const workspaceLock = page.getByLabel("キャラクター編集ロックオーバーレイ");

  await expect(workspaceLock).toBeVisible();
  await expect(
    page.getByText("セットを作成すると編集できます", { exact: true }),
  ).toBeVisible();

  await createCharacterSet(page, "Unlock Hero");

  await waitForCharacterWorkspaceUnlock(page);
  await expect(workspaceLock).toHaveCount(0);
});

test("character mode lets the sprite library collapse and expand", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Library Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const libraryLabel = page.getByText("スプライトライブラリ", { exact: true });
  const closeLibraryButton = page.getByRole("button", {
    name: "スプライトライブラリを閉じる",
  });
  const openLibraryButton = page.getByRole("button", {
    name: "スプライトライブラリを開く",
  });
  const librarySprite = page.getByRole("button", {
    name: "ライブラリスプライト 0",
  });

  await expect(page.getByText("64 items", { exact: true })).toHaveCount(0);
  await expect(closeLibraryButton).toBeVisible();
  await expect(librarySprite).toHaveCount(1);

  const [libraryLabelBox, closeLibraryButtonBox] = await Promise.all([
    getLocatorRect(libraryLabel),
    getLocatorRect(closeLibraryButton),
  ]);

  expect(closeLibraryButtonBox.clientX).toBeGreaterThan(
    libraryLabelBox.clientX + libraryLabelBox.width,
  );
  expect(
    closeLibraryButtonBox.clientX -
      (libraryLabelBox.clientX + libraryLabelBox.width),
  ).toBeLessThan(120);

  await closeLibraryButton.click();

  await expect(openLibraryButton).toBeVisible();
  await expect(librarySprite).toHaveCount(0);

  await openLibraryButton.click();

  await expect(closeLibraryButton).toBeVisible();
  await expect(librarySprite).toHaveCount(1);
});

test("character mode preserves sprite library visibility across editor mode switches", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Library Mode Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const closeLibraryButton = page.getByRole("button", {
    name: "スプライトライブラリを閉じる",
  });
  const openLibraryButton = page.getByRole("button", {
    name: "スプライトライブラリを開く",
  });
  const librarySprite = page.getByRole("button", {
    name: "ライブラリスプライト 0",
  });

  await closeLibraryButton.click();
  await expect(openLibraryButton).toBeVisible();
  await expect(librarySprite).toHaveCount(0);

  await page.getByRole("button", { name: "編集モード 分解" }).click();
  await expect(openLibraryButton).toBeVisible();
  await expect(librarySprite).toHaveCount(0);

  await page.getByRole("button", { name: "編集モード 合成" }).click();
  await expect(openLibraryButton).toBeVisible();
  await expect(librarySprite).toHaveCount(0);
});

test("character mode redraws compose canvas immediately after switching modes", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "スプライト編集");
  await paintSpriteModePixel(page, { x: 4, y: 4 });
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Compose Roundtrip Hero");
  await waitForCharacterWorkspaceUnlock(page);

  await dragLibrarySpriteToStage(page, 0, 31, { x: 160, y: 144 });

  const composeStage = page.getByLabel("キャラクターステージ");
  await expect
    .poll(async () => (await getStageDebugState(composeStage)).stageSpriteCount)
    .toBe("1");

  const composeCanvas = page.locator(
    '[data-fabric="wrapper"][aria-label="合成描画キャンバス"]',
  );
  await expect(composeCanvas).toBeVisible();
  await clickComposeCanvasAtPosition(composeCanvas, 500, 500, 88);
  await expect
    .poll(async () => hasVisibleComposePixels(composeCanvas))
    .toBe(true);

  await openMode(page, "スプライト編集");
  await openMode(page, "キャラクター編集");

  const returnedComposeCanvas = page.locator(
    '[data-fabric="wrapper"][aria-label="合成描画キャンバス"]',
  );
  const returnedStage = page.getByLabel("キャラクターステージ");

  await expect(returnedComposeCanvas).toBeVisible();
  await expect
    .poll(
      async () => (await getStageDebugState(returnedStage)).stageSpriteCount,
    )
    .toBe("1");
  await clickComposeCanvasAtPosition(returnedComposeCanvas, 500, 500, 89);
  await expect
    .poll(async () => hasVisibleComposePixels(returnedComposeCanvas))
    .toBe(true);
});

test("character mode keeps preview fixed while the sidebar scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 640 });
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Scroll Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const workspace = page.getByLabel("キャラクター編集ワークスペース");
  const sidebar = page.getByRole("complementary", {
    name: "キャラクター編集サイドバー",
  });
  const previewWidthInput = page.getByRole("spinbutton", {
    name: "プレビューキャンバス幅",
  });

  await expect(workspace).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(previewWidthInput).toBeVisible();

  const sidebarDimensions = await sidebar.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));

  expect(sidebarDimensions.scrollHeight).toBeGreaterThan(
    sidebarDimensions.clientHeight,
  );

  const previewWidthInputTopBefore = await previewWidthInput.evaluate(
    (element) => element.getBoundingClientRect().top,
  );

  await sidebar.evaluate((element) => {
    element.scrollTo({ top: element.scrollHeight });
  });

  await expect
    .poll(async () => sidebar.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => workspace.evaluate((element) => element.scrollTop))
    .toBe(0);
  await expect
    .poll(async () =>
      previewWidthInput.evaluate(
        (element) => element.getBoundingClientRect().top,
      ),
    )
    .toBe(previewWidthInputTopBefore);
});

test("character mode keeps preview viewport shell size when stage size is small", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1800, height: 900 });
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Viewport Shell Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const previewViewport = page.getByLabel("プレビューキャンバスビュー");
  const previewWidthInput = page.getByRole("spinbutton", {
    name: "プレビューキャンバス幅",
  });
  const previewHeightInput = page.getByRole("spinbutton", {
    name: "プレビューキャンバス高さ",
  });
  const zoomOutButton = page.getByRole("button", { name: "-" });
  const zoomLevelOneBadge = page.getByText("1x", { exact: true });

  const assertViewportShellStableAcrossResize = async (): Promise<void> => {
    await zoomOutButton.click();
    await expect(zoomLevelOneBadge).toBeVisible();

    await previewWidthInput.fill("320");
    await previewHeightInput.fill("256");
    await expect(previewWidthInput).toHaveValue("320");
    await expect(previewHeightInput).toHaveValue("256");
    const largeViewportRect = await getLocatorRect(previewViewport);

    await previewWidthInput.fill("16");
    await previewHeightInput.fill("16");
    await expect(previewWidthInput).toHaveValue("16");
    await expect(previewHeightInput).toHaveValue("16");
    const smallViewportRect = await getLocatorRect(previewViewport);

    expect(
      Math.abs(largeViewportRect.width - smallViewportRect.width),
    ).toBeLessThan(2);
    expect(
      Math.abs(largeViewportRect.height - smallViewportRect.height),
    ).toBeLessThan(2);
  };

  await expect(previewViewport).toBeVisible();
  await assertViewportShellStableAcrossResize();

  await page.getByRole("button", { name: "編集モード 分解" }).click();
  await expect(previewViewport).toBeVisible();
  await assertViewportShellStableAcrossResize();
});

test("character mode supports drag and drop placement and stage movement", async ({
  page,
}) => {
  await gotoApp(page);
  await seedDiagonalSprite(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const viewport = page.getByLabel("プレビューキャンバスビュー");
  const stage = page.getByLabel("キャラクターステージ");
  const composeCanvas = page.locator(
    '[data-fabric="wrapper"][aria-label="合成描画キャンバス"]',
  );
  const librarySprite = page.getByRole("button", {
    name: "ライブラリスプライト 0",
  });

  await expect(page.getByLabel("プレビューキャンバス幅")).toHaveValue("16");
  await expect(page.getByLabel("プレビューキャンバス高さ")).toHaveValue("16");

  const defaultStage = await stage.evaluate((element) => {
    if (element instanceof HTMLElement) {
      return {
        width: element.offsetWidth,
        height: element.offsetHeight,
      };
    }

    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  });
  const defaultGrid = await getStageGridState(stage);

  expect(defaultStage.width).toBe(512);
  expect(defaultStage.height).toBe(512);
  expect(defaultGrid.backgroundSize).toContain("32px 32px");
  expect(defaultGrid.backgroundSize).toContain("256px 256px");

  await page.getByLabel("プレビューキャンバス幅").fill("320");
  await page.getByLabel("プレビューキャンバス高さ").fill("256");
  await expect(page.getByLabel("プレビューキャンバス幅")).toHaveValue("320");
  await expect(page.getByLabel("プレビューキャンバス高さ")).toHaveValue("256");

  const resizedStage = await stage.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      borderRadius: window.getComputedStyle(element).borderRadius,
    };
  });

  expect(resizedStage.width).toBe(640);
  expect(resizedStage.height).toBe(512);
  expect(resizedStage.borderRadius).toBe("0px");

  await zoomViewportAtCenter(viewport, -120);

  const zoomedStage = await stage.evaluate((element) => {
    if (element instanceof HTMLElement) {
      return {
        width: element.offsetWidth,
        height: element.offsetHeight,
      };
    }

    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  });

  expect(zoomedStage.width).toBe(960);
  expect(zoomedStage.height).toBe(768);

  await viewport.evaluate((element) => {
    const viewportElement = element;
    viewportElement.scrollTo({ left: 120, top: 80 });
  });

  const initialViewportScroll = await viewport.evaluate((element) => ({
    left: element.scrollLeft,
    top: element.scrollTop,
  }));
  const hasVerticalOverflow = await viewport.evaluate(
    (element) => element.scrollHeight > element.clientHeight,
  );

  await panViewportWithMiddleMouse(
    viewport,
    7,
    { x: 220, y: 200 },
    { x: 180, y: 170 },
  );

  await expect
    .poll(async () => viewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(initialViewportScroll.left);
  if (hasVerticalOverflow === true) {
    await expect
      .poll(async () => viewport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(initialViewportScroll.top);
  }

  await viewport.evaluate((element) => {
    const viewportElement = element;
    viewportElement.scrollTo({ left: 0, top: 0 });
  });

  const stageRect = await getLocatorRect(stage);
  const libraryRect = await getLocatorRect(librarySprite);

  await librarySprite.dispatchEvent("pointerdown", {
    pointerId: 2,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: libraryRect.clientX + libraryRect.width / 2,
    clientY: libraryRect.clientY + libraryRect.height / 2,
  });
  await librarySprite.dispatchEvent("pointermove", {
    pointerId: 2,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: stageRect.clientX + 180,
    clientY: stageRect.clientY + 140,
  });
  await librarySprite.dispatchEvent("pointerup", {
    pointerId: 2,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: stageRect.clientX + 180,
    clientY: stageRect.clientY + 140,
  });

  await librarySprite.dispatchEvent("pointerdown", {
    pointerId: 4,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: libraryRect.clientX + libraryRect.width / 2,
    clientY: libraryRect.clientY + libraryRect.height / 2,
  });
  await librarySprite.dispatchEvent("pointermove", {
    pointerId: 4,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: stageRect.clientX + 220,
    clientY: stageRect.clientY + 180,
  });
  await librarySprite.dispatchEvent("pointerup", {
    pointerId: 4,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: stageRect.clientX + 220,
    clientY: stageRect.clientY + 180,
  });

  await expect(composeCanvas).toBeVisible();

  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("2");

  await clickComposeCanvasAtPosition(composeCanvas, 180, 140, 9);
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteIndex)
    .not.toBe("");
  const initialStageState = await getStageDebugState(stage);
  const initialSelectedSpriteIndex = initialStageState.selectedSpriteIndex;
  const initialSprite = {
    x: Number(initialStageState.selectedSpriteX),
    y: Number(initialStageState.selectedSpriteY),
  };

  await stage.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");

  await expect
    .poll(async () => getStageDebugState(stage))
    .toMatchObject({
      selectedSpriteIndex: initialSelectedSpriteIndex,
      selectedSpriteX: `${initialSprite.x + 1}`,
      selectedSpriteY: `${initialSprite.y + 1}`,
    });

  const nudgedStageState = await getStageDebugState(stage);
  const nudgedSprite = {
    x: Number(nudgedStageState.selectedSpriteX),
    y: Number(nudgedStageState.selectedSpriteY),
  };
  const contextMenuPoint = await getLocatorPoint(
    composeCanvas,
    (nudgedSprite.x + 4) * 3,
    (nudgedSprite.y + 4) * 3,
  );
  await openComposeCanvasSpriteContextMenu(composeCanvas, nudgedSprite, 3);
  await expect(
    page.getByRole("menu", { name: "スプライトメニュー" }),
  ).toBeVisible();
  const preventsNativeContextMenu = await page.evaluate((point) => {
    const target = document.elementFromPoint(point.clientX, point.clientY);
    if (target instanceof Element === false) {
      return false;
    }

    const contextMenuEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      button: 2,
      buttons: 2,
      clientX: point.clientX,
      clientY: point.clientY,
    });

    return target.dispatchEvent(contextMenuEvent) === false;
  }, contextMenuPoint);
  expect(preventsNativeContextMenu).toBe(true);

  const layeredStageState = await getStageDebugState(stage);
  const layeredSprite = {
    x: Number(layeredStageState.selectedSpriteX),
    y: Number(layeredStageState.selectedSpriteY),
  };
  const currentLayer = Number(layeredStageState.selectedSpriteLayer);
  await openComposeCanvasSpriteContextMenu(composeCanvas, layeredSprite, 3);
  await clickPortalButton(
    page.getByRole("button", { name: "レイヤーを上げる" }),
  );

  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteLayer)
    .toBe(`${currentLayer + 1}`);

  await clickComposeCanvasAtPosition(composeCanvas, 220, 180, 10);
  await expect
    .poll(async () => {
      const stageState = await getStageDebugState(stage);
      return stageState.selectedSpriteIndex === initialSelectedSpriteIndex;
    })
    .toBe(false);
  const deleteStageState = await getStageDebugState(stage);
  const spriteToDelete = {
    x: Number(deleteStageState.selectedSpriteX),
    y: Number(deleteStageState.selectedSpriteY),
  };
  await openComposeCanvasSpriteContextMenu(composeCanvas, spriteToDelete, 3);
  await clickPortalButton(
    page.getByRole("button", { name: "削除", exact: true }),
  );
  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("1");
});

test("character decomposition keeps tools in the canvas menu and preserves preview position", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1800, height: 640 });
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Decompose Sidebar Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const composeStage = page.getByLabel("キャラクターステージ");
  await expect(composeStage).toBeVisible();

  const composeStageBox = await getLocatorRect(composeStage);

  await page.getByRole("button", { name: "編集モード 分解" }).click();

  const openDecompositionToolMenuButton = page.getByRole("button", {
    name: "分解ツールを開く",
  });
  const closeDecompositionToolMenuButton = page.getByRole("button", {
    name: "分解ツールを閉じる",
  });
  const viewport = page.getByLabel("プレビューキャンバスビュー");

  await expect(openDecompositionToolMenuButton).toBeVisible();
  await expect(viewport).toBeVisible();

  const [openDecompositionToolMenuButtonBox, viewportBox] = await Promise.all([
    getLocatorRect(openDecompositionToolMenuButton),
    getLocatorRect(viewport),
  ]);

  expect(
    openDecompositionToolMenuButtonBox.clientX - viewportBox.clientX,
  ).toBeLessThan(80);
  await expect(closeDecompositionToolMenuButton).toHaveCount(0);
  await openDecompositionToolMenuButton.click();
  await expect(closeDecompositionToolMenuButton).toBeVisible();

  const decompositionCanvas = page.getByLabel("分解描画キャンバス");
  await clickCanvasPixel(decompositionCanvas, 1, 1);
  await page.getByRole("button", { name: "分解ツール 切り取り" }).click();
  await clickCanvasPixel(decompositionCanvas, 0, 0);
  await expect(page.getByText(/region-/)).toHaveCount(0);

  const workspace = page.getByLabel("キャラクター編集ワークスペース");
  const sidebar = page.getByRole("complementary", {
    name: "キャラクター編集サイドバー",
  });
  const regionToolButton = page.getByRole("button", {
    name: "分解ツール 切り取り",
  });
  const previewWidthInput = page.getByRole("spinbutton", {
    name: "プレビューキャンバス幅",
  });
  const decomposeStage = page.getByLabel("キャラクターステージ");
  const selectedRegionLabel = page.getByText("選択中の領域", { exact: true });
  const spriteLibraryLabel = page.getByText("スプライトライブラリ", {
    exact: true,
  });

  await expect(sidebar).toBeVisible();
  await expect(viewport).toBeVisible();
  await expect(regionToolButton).toBeVisible();
  await expect(previewWidthInput).toBeVisible();
  await expect(decomposeStage).toBeVisible();
  await expect(selectedRegionLabel).toBeVisible();
  await expect(spriteLibraryLabel).toBeVisible();

  const [
    sidebarBox,
    regionToolButtonBox,
    decomposeStageBox,
    selectedRegionLabelBox,
    spriteLibraryLabelBox,
  ] = await Promise.all([
    getLocatorRect(sidebar),
    getLocatorRect(regionToolButton),
    getLocatorRect(decomposeStage),
    getLocatorRect(selectedRegionLabel),
    getLocatorRect(spriteLibraryLabel),
  ]);

  expect(regionToolButtonBox.clientX).toBeGreaterThan(
    sidebarBox.clientX + sidebarBox.width,
  );
  expect(regionToolButtonBox.clientX).toBeGreaterThan(viewportBox.clientX);
  expect(regionToolButtonBox.clientX + regionToolButtonBox.width).toBeLessThan(
    viewportBox.clientX + viewportBox.width,
  );
  expect(regionToolButtonBox.clientY).toBeGreaterThan(viewportBox.clientY);
  expect(regionToolButtonBox.clientY + regionToolButtonBox.height).toBeLessThan(
    viewportBox.clientY + viewportBox.height,
  );
  expect(selectedRegionLabelBox.clientY).toBeLessThan(
    spriteLibraryLabelBox.clientY,
  );
  expect(
    Math.abs(decomposeStageBox.clientX - composeStageBox.clientX),
  ).toBeLessThan(2);
  expect(
    Math.abs(decomposeStageBox.clientY - composeStageBox.clientY),
  ).toBeLessThan(2);

  const sidebarDimensions = await sidebar.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));

  expect(sidebarDimensions.scrollHeight).toBeGreaterThan(
    sidebarDimensions.clientHeight,
  );

  const previewWidthInputTopBefore = await previewWidthInput.evaluate(
    (element) => element.getBoundingClientRect().top,
  );

  await sidebar.evaluate((element) => {
    element.scrollTo({ top: element.scrollHeight });
  });

  await expect
    .poll(async () => sidebar.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => workspace.evaluate((element) => element.scrollTop))
    .toBe(0);
  await expect
    .poll(async () =>
      previewWidthInput.evaluate(
        (element) => element.getBoundingClientRect().top,
      ),
    )
    .toBe(previewWidthInputTopBefore);
});

test("character decomposition deletes selected regions from context menu", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Decompose Context Hero");
  await waitForCharacterWorkspaceUnlock(page);
  await page.getByRole("button", { name: "編集モード 分解" }).click();
  await page.getByRole("button", { name: "分解ツールを開く" }).click();
  await page.getByRole("button", { name: "分解ツール 切り取り" }).click();

  const decompositionCanvas = page.getByLabel("分解描画キャンバス");
  await clickCanvasPixel(decompositionCanvas, 0, 0);
  await page.getByRole("button", { name: "分解ツールを閉じる" }).click();

  await expect(
    page.getByRole("button", { name: "選択中領域を削除" }),
  ).toHaveCount(0);

  const firstRegionOverlay = page.getByLabel("切り取り領域 0");
  await expect(firstRegionOverlay).toBeVisible();
  await firstRegionOverlay.click({ button: "right" });

  await expect(
    page.getByRole("menu", { name: "切り取り領域メニュー" }),
  ).toBeVisible();
  await clickPortalButton(
    page.getByRole("button", { name: "選択中領域を削除" }),
  );
  await expect(firstRegionOverlay).toHaveCount(0);
});

test("character decomposition blocks mixed palettes and applies split regions", async ({
  page,
}) => {
  await gotoApp(page);
  await page.setViewportSize({ width: 1800, height: 1200 });
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Decompose Hero");
  await waitForCharacterWorkspaceUnlock(page);
  await page.getByRole("button", { name: "編集モード 分解" }).click();
  await page.getByRole("button", { name: "分解ツールを開く" }).click();

  const decompositionCanvas = page.getByLabel("分解描画キャンバス");

  await clickCanvasPixel(decompositionCanvas, 1, 1);
  await selectMaterialOption(page, "分解描画パレット", "パレット 1");
  await clickCanvasPixel(decompositionCanvas, 2, 2);

  await page.getByRole("button", { name: "分解ツール 切り取り" }).click();
  await clickCanvasPixel(decompositionCanvas, 0, 0);

  await expect(
    page
      .getByRole("button", { name: "切り取り領域 0", exact: true })
      .getByText("複数パレット", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "分解して現在のセットへ反映" }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "分解ツール 消しゴム" }).click();
  await clickCanvasPixel(decompositionCanvas, 2, 2);
  await selectMaterialOption(page, "分解描画パレット", "パレット 1");
  await page.getByRole("button", { name: "分解ツール ペン" }).click();
  await clickCanvasPixel(decompositionCanvas, 10, 1);

  await page.getByRole("button", { name: "分解ツール 切り取り" }).click();
  await clickCanvasPixel(decompositionCanvas, 8, 0);

  const applyButton = page.getByRole("button", {
    name: "分解して現在のセットへ反映",
  });
  await expect(applyButton).toBeEnabled();
  await applyButton.click();
  await closeDecompositionAppliedDialog(page);

  await expect(
    page.getByRole("combobox", { name: "編集中のセット" }),
  ).toContainText("Decompose Hero (2 sprites)");
  await expect(
    page.getByRole("button", { name: "プロジェクトスプライトサイズ 8x16" }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "編集モード 合成" }).click();
  await expect(page.getByLabel("キャラクターステージ")).toHaveAttribute(
    "tabindex",
    "0",
  );
  await expect
    .poll(
      async () =>
        (await getStageDebugState(page.getByLabel("キャラクターステージ")))
          .stageSpriteCount,
    )
    .toBe("2");
});

test("character decomposition respects project level 8x16 sprite size", async ({
  page,
}) => {
  await gotoApp(page);
  await page.setViewportSize({ width: 1800, height: 1200 });
  await openMode(page, "キャラクター編集");

  const size16Button = page.getByRole("button", {
    name: "プロジェクトスプライトサイズ 8x16",
  });
  await expect(size16Button).toBeDisabled();
  await createCharacterSet(page, "Tall Hero");
  await waitForCharacterWorkspaceUnlock(page);
  await expect(size16Button).toBeEnabled();
  await size16Button.click();
  await page.getByRole("button", { name: "編集モード 分解" }).click();
  await page.getByRole("button", { name: "分解ツールを開く" }).click();

  const decompositionCanvas = page.getByLabel("分解描画キャンバス");
  await clickCanvasPixel(decompositionCanvas, 1, 1);
  await clickCanvasPixel(decompositionCanvas, 1, 10);

  await page.getByRole("button", { name: "分解ツール 切り取り" }).click();
  await clickCanvasPixel(decompositionCanvas, 0, 0);

  const applyButton = page.getByRole("button", {
    name: "分解して現在のセットへ反映",
  });
  await expect(applyButton).toBeEnabled();
  await applyButton.click();
  await closeDecompositionAppliedDialog(page);

  await expect(
    page.getByRole("combobox", { name: "編集中のセット" }),
  ).toContainText("Tall Hero (1 sprites)");
  await expect(
    page.getByRole("button", { name: "プロジェクトスプライトサイズ 8x8" }),
  ).toBeDisabled();
  await expect(size16Button).toBeEnabled();

  await page.getByRole("button", { name: "編集モード 合成" }).click();
  await expect(page.getByLabel("キャラクターステージ")).toHaveAttribute(
    "tabindex",
    "0",
  );
  await expect
    .poll(
      async () =>
        (await getStageDebugState(page.getByLabel("キャラクターステージ")))
          .stageSpriteCount,
    )
    .toBe("1");
});

test("character compose mode deletes selected sprite with Delete key", async ({
  page,
}) => {
  await gotoApp(page);
  await seedDiagonalSprite(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Delete Key Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const stage = page.getByLabel("キャラクターステージ");
  const composeCanvas = page.locator(
    '[data-fabric="wrapper"][aria-label="合成描画キャンバス"]',
  );

  await dragLibrarySpriteToStage(page, 0, 40, { x: 160, y: 140 });
  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("1");

  await clickComposeCanvasAtPosition(composeCanvas, 160, 140, 41);
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteIndex)
    .not.toBe("");

  await stage.focus();
  await page.keyboard.press("Delete");

  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("0");
});

test("character compose mode deletes selected sprite with Backspace key", async ({
  page,
}) => {
  await gotoApp(page);
  await seedDiagonalSprite(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Backspace Key Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const stage = page.getByLabel("キャラクターステージ");
  const composeCanvas = page.locator(
    '[data-fabric="wrapper"][aria-label="合成描画キャンバス"]',
  );

  await dragLibrarySpriteToStage(page, 0, 50, { x: 200, y: 200 });
  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("1");

  await clickComposeCanvasAtPosition(composeCanvas, 200, 200, 51);
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteIndex)
    .not.toBe("");

  await stage.focus();
  await page.keyboard.press("Backspace");

  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("0");
});

test("character compose mode nudges selected sprite in all four directions", async ({
  page,
}) => {
  await gotoApp(page);
  await seedDiagonalSprite(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Nudge Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const stage = page.getByLabel("キャラクターステージ");
  const composeCanvas = page.locator(
    '[data-fabric="wrapper"][aria-label="合成描画キャンバス"]',
  );

  await dragLibrarySpriteToStage(page, 0, 60, { x: 160, y: 160 });
  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("1");

  await clickComposeCanvasAtPosition(composeCanvas, 160, 160, 61);
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteIndex)
    .not.toBe("");

  const baseState = await getStageDebugState(stage);
  const baseX = Number(baseState.selectedSpriteX);
  const baseY = Number(baseState.selectedSpriteY);

  await stage.focus();
  await page.keyboard.press("ArrowLeft");
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteX)
    .toBe(`${baseX - 1}`);

  await page.keyboard.press("ArrowUp");
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteY)
    .toBe(`${baseY - 1}`);

  await page.keyboard.press("ArrowRight");
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteX)
    .toBe(`${baseX}`);

  await page.keyboard.press("ArrowDown");
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteY)
    .toBe(`${baseY}`);
});

test("character compose mode closes sprite context menu with Escape key", async ({
  page,
}) => {
  await gotoApp(page);
  await seedDiagonalSprite(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Escape Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const stage = page.getByLabel("キャラクターステージ");
  const composeCanvas = page.locator(
    '[data-fabric="wrapper"][aria-label="合成描画キャンバス"]',
  );

  await dragLibrarySpriteToStage(page, 0, 70, { x: 160, y: 140 });
  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("1");

  await clickComposeCanvasAtPosition(composeCanvas, 160, 140, 71);
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteIndex)
    .not.toBe("");

  const spriteState = await getStageDebugState(stage);
  const sprite = {
    x: Number(spriteState.selectedSpriteX),
    y: Number(spriteState.selectedSpriteY),
  };
  await openComposeCanvasSpriteContextMenu(composeCanvas, sprite, 32);
  await expect(
    page.getByRole("menu", { name: "スプライトメニュー" }),
  ).toBeVisible();

  await stage.focus();
  await page.keyboard.press("Escape");

  await expect(
    page.getByRole("menu", { name: "スプライトメニュー" }),
  ).toHaveCount(0);
  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("1");
});

test("character compose mode shifts sprite layer down via context menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1800, height: 640 });
  await gotoApp(page);
  await seedDiagonalSprite(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Layer Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const stage = page.getByLabel("キャラクターステージ");
  const composeCanvas = page.locator(
    '[data-fabric="wrapper"][aria-label="合成描画キャンバス"]',
  );

  await dragLibrarySpriteToStage(page, 0, 80, { x: 160, y: 140 });
  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("1");

  await clickComposeCanvasAtPosition(composeCanvas, 160, 140, 82);
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteIndex)
    .not.toBe("");

  const spriteState = await getStageDebugState(stage);
  const sprite = {
    x: Number(spriteState.selectedSpriteX),
    y: Number(spriteState.selectedSpriteY),
  };
  const layerBefore = Number(spriteState.selectedSpriteLayer);

  await openComposeCanvasSpriteContextMenu(composeCanvas, sprite, 32);
  await expect(
    page.getByRole("menu", { name: "スプライトメニュー" }),
  ).toBeVisible();

  await clickPortalButton(
    page.getByRole("button", { name: "レイヤーを上げる" }),
  );

  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteLayer)
    .toBe(`${layerBefore + 1}`);

  await openComposeCanvasSpriteContextMenu(composeCanvas, sprite, 32);
  await expect(
    page.getByRole("menu", { name: "スプライトメニュー" }),
  ).toBeVisible();

  await clickPortalButton(
    page.getByRole("button", { name: "レイヤーを下げる" }),
  );

  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteLayer)
    .toBe(`${layerBefore}`);
});

test("character compose mode auto-selects next sprite after keyboard deletion", async ({
  page,
}) => {
  await gotoApp(page);
  await seedDiagonalSprite(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Auto Select Hero");
  await waitForCharacterWorkspaceUnlock(page);

  const stage = page.getByLabel("キャラクターステージ");
  const composeCanvas = page.locator(
    '[data-fabric="wrapper"][aria-label="合成描画キャンバス"]',
  );

  await dragLibrarySpriteToStage(page, 0, 90, { x: 160, y: 140 });
  await dragLibrarySpriteToStage(page, 0, 91, { x: 250, y: 250 });
  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("2");

  await clickComposeCanvasAtPosition(composeCanvas, 160, 140, 92);
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteIndex)
    .not.toBe("");

  await stage.focus();
  await page.keyboard.press("Delete");

  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("1");
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteIndex)
    .not.toBe("");
});

test("character decomposition selects a region and shows inspector details", async ({
  page,
}) => {
  await gotoApp(page);
  await page.setViewportSize({ width: 1800, height: 1200 });
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Region Select Hero");
  await waitForCharacterWorkspaceUnlock(page);
  await page.getByRole("button", { name: "編集モード 分解" }).click();
  await page.getByRole("button", { name: "分解ツールを開く" }).click();

  const decompositionCanvas = page.getByLabel("分解描画キャンバス");
  await clickCanvasPixel(decompositionCanvas, 1, 1);

  await page.getByRole("button", { name: "分解ツール 切り取り" }).click();
  await clickCanvasPixel(decompositionCanvas, 0, 0);

  const regionOverlay = page.getByLabel("切り取り領域 0");
  await expect(regionOverlay).toBeVisible();

  await regionOverlay.click();

  const selectedRegionLabel = page.getByText("選択中の領域", { exact: true });
  await expect(selectedRegionLabel).toBeVisible();

  const regionXInput = page.getByLabel("選択中領域X座標");
  const regionYInput = page.getByLabel("選択中領域Y座標");
  await expect(regionXInput).toBeVisible();
  await expect(regionYInput).toBeVisible();
  await expect(regionXInput).toHaveValue("0");
  await expect(regionYInput).toHaveValue("0");
});

test("character decomposition moves a region by dragging with the cut tool", async ({
  page,
}) => {
  await gotoApp(page);
  await page.setViewportSize({ width: 1800, height: 1200 });
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Region Drag Hero");
  await waitForCharacterWorkspaceUnlock(page);
  await page.getByRole("button", { name: "編集モード 分解" }).click();
  await page.getByRole("button", { name: "分解ツールを開く" }).click();

  const decompositionCanvas = page.getByLabel("分解描画キャンバス");
  await clickCanvasPixel(decompositionCanvas, 1, 1);

  await page.getByRole("button", { name: "分解ツール 切り取り" }).click();
  await clickCanvasPixel(decompositionCanvas, 0, 0);

  const regionOverlay = page.getByLabel("切り取り領域 0");
  await expect(regionOverlay).toBeVisible();
  await regionOverlay.click();

  const regionXInput = page.getByLabel("選択中領域X座標");
  const regionYInput = page.getByLabel("選択中領域Y座標");
  await expect(regionXInput).toHaveValue("0");
  await expect(regionYInput).toHaveValue("0");

  const stage = page.getByLabel("キャラクターステージ");
  await expect(stage).toBeVisible();
  const regionRect = await getLocatorRect(regionOverlay);

  const startClientX = regionRect.clientX + regionRect.width / 2;
  const startClientY = regionRect.clientY + regionRect.height / 2;
  const dragDistancePx = 24;

  await regionOverlay.dispatchEvent("pointerdown", {
    pointerId: 200,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: startClientX,
    clientY: startClientY,
  });

  const workspace = page.getByLabel("キャラクター編集ワークスペース", {
    exact: true,
  });
  await workspace.dispatchEvent("pointermove", {
    pointerId: 200,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: startClientX + dragDistancePx,
    clientY: startClientY + dragDistancePx,
  });
  await workspace.dispatchEvent("pointerup", {
    pointerId: 200,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: startClientX + dragDistancePx,
    clientY: startClientY + dragDistancePx,
  });

  await expect
    .poll(async () => Number(await regionXInput.inputValue()))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => Number(await regionYInput.inputValue()))
    .toBeGreaterThan(0);
});

test("character decomposition creates multiple regions and selects between them", async ({
  page,
}) => {
  await gotoApp(page);
  await page.setViewportSize({ width: 1800, height: 1200 });
  await openMode(page, "キャラクター編集");

  await createCharacterSet(page, "Multi Region Hero");
  await waitForCharacterWorkspaceUnlock(page);
  await page.getByRole("button", { name: "編集モード 分解" }).click();
  await page.getByRole("button", { name: "分解ツールを開く" }).click();

  const decompositionCanvas = page.getByLabel("分解描画キャンバス");
  await clickCanvasPixel(decompositionCanvas, 1, 1);
  await clickCanvasPixel(decompositionCanvas, 10, 1);

  await page.getByRole("button", { name: "分解ツール 切り取り" }).click();
  await clickCanvasPixel(decompositionCanvas, 0, 0);
  await clickCanvasPixel(decompositionCanvas, 8, 0);

  const firstRegion = page.getByLabel("切り取り領域 0");
  const secondRegion = page.getByLabel("切り取り領域 1");
  await expect(firstRegion).toBeVisible();
  await expect(secondRegion).toBeVisible();

  await firstRegion.click();

  const regionXInput = page.getByLabel("選択中領域X座標");
  await expect(regionXInput).toBeVisible();
  await expect(regionXInput).toHaveValue("0");

  await secondRegion.click();
  await expect(regionXInput).toHaveValue("8");
});
