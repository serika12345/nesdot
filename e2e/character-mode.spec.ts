import { expect, test } from "@playwright/test";
import { gotoApp, openMode } from "./support/app";
import {
  clickCanvasPixel,
  clickComposeCanvasAtPosition,
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

test("character mode supports drag and drop placement and stage movement", async ({
  page,
}) => {
  await gotoApp(page);
  await seedDiagonalSprite(page);
  await openMode(page, "キャラクター編集");

  await page.getByLabel("新規セット名").fill("Hero");
  await page.getByRole("button", { name: "セットを作成" }).click();

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

  const defaultStage = await stage.evaluate((element) => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
  }));
  const defaultGrid = await getStageGridState(stage);

  expect(defaultStage.width).toBe(512);
  expect(defaultStage.height).toBe(512);
  expect(defaultGrid.backgroundSize).toContain("32px 32px");
  expect(defaultGrid.backgroundSize).toContain("256px 256px");

  await page.getByLabel("プレビューキャンバス幅").fill("320");
  await page.getByLabel("プレビューキャンバス高さ").fill("256");
  await expect(page.getByLabel("プレビューキャンバス幅")).toHaveValue("320");
  await expect(page.getByLabel("プレビューキャンバス高さ")).toHaveValue("256");

  const resizedStage = await stage.evaluate((element) => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
    borderRadius: window.getComputedStyle(element).borderRadius,
  }));

  expect(resizedStage.width).toBe(640);
  expect(resizedStage.height).toBe(512);
  expect(resizedStage.borderRadius).toBe("0px");

  await zoomViewportAtCenter(viewport, -120);

  const zoomedStage = await stage.evaluate((element) => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
  }));

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
  await expect(page.getByRole("menu", { name: "スプライトメニュー" })).toBeVisible();
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
  await page.getByRole("button", { name: "レイヤーを上げる" }).click();

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
  await page.getByRole("button", { name: "削除", exact: true }).click();
  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("1");
});

test("character decomposition blocks mixed palettes and applies split regions", async ({
  page,
}) => {
  await gotoApp(page);
  await page.setViewportSize({ width: 1800, height: 1200 });
  await openMode(page, "キャラクター編集");

  await page.getByLabel("新規セット名").fill("Decompose Hero");
  await page.getByRole("button", { name: "セットを作成" }).click();
  await page.getByRole("button", { name: "編集モード 分解" }).click();

  const decompositionCanvas = page.getByLabel("分解描画キャンバス");

  await clickCanvasPixel(decompositionCanvas, 1, 1);
  await page.getByLabel("分解描画パレット").selectOption("1");
  await clickCanvasPixel(decompositionCanvas, 2, 2);

  await page.getByRole("button", { name: "分解ツール 切り取り" }).click();
  await clickCanvasPixel(decompositionCanvas, 0, 0);

  await expect(
    page.getByRole("button", { name: /領域 0 .*複数パレット/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "分解して現在のセットへ反映" }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "分解ツール 消しゴム" }).click();
  await clickCanvasPixel(decompositionCanvas, 2, 2);
  await page.getByLabel("分解描画パレット").selectOption("1");
  await page.getByRole("button", { name: "分解ツール ペン" }).click();
  await clickCanvasPixel(decompositionCanvas, 10, 1);

  await page.getByRole("button", { name: "分解ツール 切り取り" }).click();
  await clickCanvasPixel(decompositionCanvas, 8, 0);

  const applyButton = page.getByRole("button", {
    name: "分解して現在のセットへ反映",
  });
  await expect(applyButton).toBeEnabled();
  await applyButton.click();

  await expect(
    page.getByLabel("編集中のセット").locator("option:checked"),
  ).toHaveText("Decompose Hero (2 sprites)");
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
  await size16Button.click();
  await page.getByLabel("新規セット名").fill("Tall Hero");
  await page.getByRole("button", { name: "セットを作成" }).click();
  await page.getByRole("button", { name: "編集モード 分解" }).click();

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

  await expect(
    page.getByLabel("編集中のセット").locator("option:checked"),
  ).toHaveText("Tall Hero (1 sprites)");
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
