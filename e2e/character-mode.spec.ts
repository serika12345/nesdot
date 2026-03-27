import { expect, Locator, test } from "@playwright/test";

const getLocatorPoint = async (
  locator: Locator,
  x: number,
  y: number,
) =>
  locator.evaluate(
    (element, point) => {
      const rect = element.getBoundingClientRect();
      return {
        clientX: rect.left + point.x,
        clientY: rect.top + point.y,
      };
    },
    { x, y },
  );

const getStageDebugState = async (locator: Locator) =>
  locator.evaluate((element) => ({
    activeSetName: element.getAttribute("data-active-set-name") ?? "",
    selectedSpriteIndex: element.getAttribute("data-selected-sprite-index") ?? "",
    selectedSpriteLayer: element.getAttribute("data-selected-sprite-layer") ?? "",
    selectedSpriteX: element.getAttribute("data-selected-sprite-x") ?? "",
    selectedSpriteY: element.getAttribute("data-selected-sprite-y") ?? "",
    stageSpriteCount: element.getAttribute("data-stage-sprite-count") ?? "",
  }));

const clickComposeCanvasAtPosition = async (
  locator: Locator,
  stageX: number,
  stageY: number,
  pointerId: number,
) => {
  const point = await getLocatorPoint(locator, stageX, stageY);

  await locator.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: point.clientX,
    clientY: point.clientY,
  });
  await locator.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: point.clientX,
    clientY: point.clientY,
  });
};

const openComposeCanvasSpriteContextMenu = async (
  locator: Locator,
  sprite: { x: number; y: number },
  scale: number,
) => {
  const point = await getLocatorPoint(
    locator,
    (sprite.x + 4) * scale,
    (sprite.y + 4) * scale,
  );

  await locator.dispatchEvent("pointerdown", {
    pointerId: 101,
    pointerType: "mouse",
    isPrimary: true,
    button: 2,
    buttons: 2,
    clientX: point.clientX,
    clientY: point.clientY,
  });
  await locator.dispatchEvent("pointerup", {
    pointerId: 101,
    pointerType: "mouse",
    isPrimary: true,
    button: 2,
    buttons: 0,
    clientX: point.clientX,
    clientY: point.clientY,
  });
};

const clickCanvasPixel = async (
  locator: Locator,
  pixelX: number,
  pixelY: number,
) => {
  const rect = await locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const stageWidth = Number(element.getAttribute("data-stage-width") ?? "0");
    const stageHeight = Number(element.getAttribute("data-stage-height") ?? "0");

    return {
      width: bounds.width,
      height: bounds.height,
      stageWidth: stageWidth > 0 ? stageWidth : 1,
      stageHeight: stageHeight > 0 ? stageHeight : 1,
    };
  });
  const point = await getLocatorPoint(
    locator,
    (pixelX + 0.25) * (rect.width / rect.stageWidth),
    (pixelY + 0.25) * (rect.height / rect.stageHeight),
  );

  await locator.dispatchEvent("pointerdown", {
    pointerId: pixelX + pixelY + 20,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: point.clientX,
    clientY: point.clientY,
  });
  await locator.dispatchEvent("pointerup", {
    pointerId: pixelX + pixelY + 20,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: point.clientX,
    clientY: point.clientY,
  });
};

test("character mode supports drag and drop placement and stage movement", async ({
  page,
}) => {
  await page.goto("/");

  await page.evaluate(async () => {
    const { useProjectState } = await import(
      "../src/application/state/projectStore"
    );

    const current = useProjectState.getState();
    const nextSprites = current.sprites.map((sprite, spriteIndex) =>
      spriteIndex === 0
        ? {
            ...sprite,
            pixels: sprite.pixels.map((row, rowIndex) =>
              row.map((value, columnIndex) =>
                rowIndex === columnIndex && rowIndex < 4 ? 1 : value,
              ),
            ),
          }
        : sprite,
    );

    useProjectState.setState({
      ...current,
      sprites: nextSprites,
    });
  });

  await page.getByRole("button", { name: "キャラクター編集" }).click();
  await page.getByLabel("新規セット名").fill("Hero");
  await page.getByRole("button", { name: "セットを作成" }).click();

  const viewport = page.getByLabel("プレビューキャンバスビュー");
  const stage = page.getByLabel("キャラクターステージ");
  const composeCanvas = page.getByLabel("合成描画キャンバス");
  const librarySprite = page.getByRole("button", {
    name: "ライブラリスプライト 0",
  });

  await expect(page.getByLabel("プレビューキャンバス幅")).toHaveValue("16");
  await expect(page.getByLabel("プレビューキャンバス高さ")).toHaveValue("16");

  const defaultStage = await stage.evaluate((element) => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
  }));

  expect(defaultStage.width).toBe(512);
  expect(defaultStage.height).toBe(512);

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

  const viewportRect = await viewport.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  });

  await viewport.dispatchEvent("wheel", {
    ctrlKey: true,
    deltaY: -120,
    clientX: viewportRect.left + viewportRect.width / 2,
    clientY: viewportRect.top + viewportRect.height / 2,
  });
  await expect(page.getByLabel("ステージズーム")).toHaveCount(0);

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

  await viewport.dispatchEvent("pointerdown", {
    pointerId: 7,
    pointerType: "mouse",
    isPrimary: true,
    button: 1,
    buttons: 4,
    clientX: viewportRect.left + 220,
    clientY: viewportRect.top + 200,
  });
  await viewport.dispatchEvent("pointermove", {
    pointerId: 7,
    pointerType: "mouse",
    isPrimary: true,
    button: 1,
    buttons: 4,
    clientX: viewportRect.left + 180,
    clientY: viewportRect.top + 170,
  });
  await viewport.dispatchEvent("pointerup", {
    pointerId: 7,
    pointerType: "mouse",
    isPrimary: true,
    button: 1,
    buttons: 0,
    clientX: viewportRect.left + 180,
    clientY: viewportRect.top + 170,
  });

  const movedViewportScroll = await viewport.evaluate((element) => ({
    left: element.scrollLeft,
    top: element.scrollTop,
  }));

  expect(movedViewportScroll.left).toBeGreaterThan(initialViewportScroll.left);
  expect(movedViewportScroll.top).toBeGreaterThan(initialViewportScroll.top);

  await viewport.evaluate((element) => {
    const viewportElement = element;
    viewportElement.scrollTo({ left: 0, top: 0 });
  });

  const stageRect = await stage.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  });
  const libraryRect = await librarySprite.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  });

  await librarySprite.dispatchEvent("pointerdown", {
    pointerId: 2,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: libraryRect.left + libraryRect.width / 2,
    clientY: libraryRect.top + libraryRect.height / 2,
  });
  await librarySprite.dispatchEvent("pointermove", {
    pointerId: 2,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: stageRect.left + 180,
    clientY: stageRect.top + 140,
  });
  await librarySprite.dispatchEvent("pointerup", {
    pointerId: 2,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: stageRect.left + 180,
    clientY: stageRect.top + 140,
  });

  await librarySprite.dispatchEvent("pointerdown", {
    pointerId: 4,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: libraryRect.left + libraryRect.width / 2,
    clientY: libraryRect.top + libraryRect.height / 2,
  });
  await librarySprite.dispatchEvent("pointermove", {
    pointerId: 4,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: stageRect.left + 220,
    clientY: stageRect.top + 180,
  });
  await librarySprite.dispatchEvent("pointerup", {
    pointerId: 4,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: stageRect.left + 220,
    clientY: stageRect.top + 180,
  });

  await expect(composeCanvas).toBeVisible();
  await expect(page.getByText("選択中のスプライト")).toHaveCount(0);
  await expect(page.getByText("レイヤー一覧")).toHaveCount(0);

  await expect
    .poll(async () => (await getStageDebugState(stage)).stageSpriteCount)
    .toBe("2");

  await clickComposeCanvasAtPosition(composeCanvas, 180, 140, 9);
  await expect
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteIndex)
    .toBe("0");
  const initialStageState = await getStageDebugState(stage);
  const initialSprite = {
    x: Number(initialStageState.selectedSpriteX),
    y: Number(initialStageState.selectedSpriteY),
  };

  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");

  await expect
    .poll(async () => getStageDebugState(stage))
    .toMatchObject({
      selectedSpriteIndex: "0",
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
  await expect(page.getByRole("button", { name: "右へ移動" })).toHaveCount(0);

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
    .poll(async () => (await getStageDebugState(stage)).selectedSpriteIndex)
    .toBe("1");
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
  await page.goto("/");
  await page.setViewportSize({ width: 1800, height: 1200 });

  await page.getByRole("button", { name: "キャラクター編集" }).click();
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
  await expect(page.getByLabel("合成描画キャンバス")).toBeVisible();
  await expect
    .poll(async () => (await getStageDebugState(page.getByLabel("キャラクターステージ"))).stageSpriteCount)
    .toBe("2");
});

test("character decomposition respects project level 8x16 sprite size", async ({
  page,
}) => {
  await page.goto("/");
  await page.setViewportSize({ width: 1800, height: 1200 });

  await page.getByRole("button", { name: "キャラクター編集" }).click();
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
  await expect(page.getByLabel("合成描画キャンバス")).toBeVisible();
  await expect
    .poll(async () => (await getStageDebugState(page.getByLabel("キャラクターステージ"))).stageSpriteCount)
    .toBe("1");
});
