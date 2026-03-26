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

const clickCanvasPixel = async (
  locator: Locator,
  pixelX: number,
  pixelY: number,
) => {
  const rect = await locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { width: bounds.width, height: bounds.height };
  });
  const point = await getLocatorPoint(
    locator,
    (pixelX + 0.5) * (rect.width / 256),
    (pixelY + 0.5) * (rect.height / 240),
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
  const librarySprite = page.getByRole("button", {
    name: "ライブラリスプライト 0",
  });

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

  const placedSprite = page.getByRole("button", { name: "配置スプライト 0" });

  await expect(placedSprite).toBeVisible();
  await expect(page.getByLabel("選択中スプライト番号")).toHaveValue("0");
  const initialX = Number(
    await page.getByLabel("選択中X座標").inputValue(),
  );
  const initialY = Number(
    await page.getByLabel("選択中Y座標").inputValue(),
  );

  expect(initialX).toBeGreaterThanOrEqual(55);
  expect(initialX).toBeLessThanOrEqual(58);
  expect(initialY).toBeGreaterThanOrEqual(42);
  expect(initialY).toBeLessThanOrEqual(44);

  const placedSpriteRect = await placedSprite.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  });

  await placedSprite.dispatchEvent("pointerdown", {
    pointerId: 3,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: placedSpriteRect.left + placedSpriteRect.width / 2,
    clientY: placedSpriteRect.top + placedSpriteRect.height / 2,
  });
  await stage.dispatchEvent("pointermove", {
    pointerId: 3,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: placedSpriteRect.left + placedSpriteRect.width / 2 + 24,
    clientY: placedSpriteRect.top + placedSpriteRect.height / 2 + 20,
  });
  await stage.dispatchEvent("pointerup", {
    pointerId: 3,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: placedSpriteRect.left + placedSpriteRect.width / 2 + 24,
    clientY: placedSpriteRect.top + placedSpriteRect.height / 2 + 20,
  });

  const movedX = Number(await page.getByLabel("選択中X座標").inputValue());
  const movedY = Number(await page.getByLabel("選択中Y座標").inputValue());

  expect(movedX).toBeGreaterThanOrEqual(initialX + 7);
  expect(movedX).toBeLessThanOrEqual(initialX + 9);
  expect(movedY).toBeGreaterThanOrEqual(initialY + 6);
  expect(movedY).toBeLessThanOrEqual(initialY + 8);
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
  await expect(
    page.getByRole("button", { name: "配置スプライト 0" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "配置スプライト 1" }),
  ).toBeVisible();
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
  await expect(
    page.getByRole("button", { name: "配置スプライト 0" }),
  ).toBeVisible();
});
