import { expect, test, type Locator, type Page } from "@playwright/test";
import { gotoApp, openMode } from "./support/app";
import {
  clickLogicalCanvasPixel,
  formatCanvasPixelColor,
  readLogicalCanvasPixel,
} from "./support/canvas";
import {
  clickLocatorWithMouseAtOffset,
  dispatchPointerClickAtOffset,
  getCanvasSize,
  getLocatorPoint,
  getLocatorRect,
  panViewportWithMiddleMouse,
  zoomViewportAtCenter,
} from "./support/pointer";

interface ScreenStageDebugState {
  spriteCount: number;
  selectedCount: number;
  layout: ReadonlyArray<{
    x: number;
    y: number;
  }>;
}

const parseLayoutEntry = (
  entry: string,
): {
  x: number;
  y: number;
} => {
  const parts = entry.split(":");
  const coordinates = (parts[1] ?? "0,0").split(",");

  return {
    x: Number(coordinates[0] ?? "0"),
    y: Number(coordinates[1] ?? "0"),
  };
};

const parseStageLayout = (
  rawLayout: string,
): ReadonlyArray<{
  x: number;
  y: number;
}> =>
  rawLayout
    .split("|")
    .filter((entry) => entry !== "")
    .map(parseLayoutEntry);

const getScreenStageDebugState = async (
  stage: Locator,
): Promise<ScreenStageDebugState> =>
  stage
    .evaluate((element) => ({
      spriteCount: Number(
        element.getAttribute("data-stage-sprite-count") ?? "0",
      ),
      selectedCount: Number(
        element.getAttribute("data-selected-sprite-count") ?? "0",
      ),
      rawLayout: element.getAttribute("data-stage-sprite-layout") ?? "",
    }))
    .then((state) => ({
      spriteCount: state.spriteCount,
      selectedCount: state.selectedCount,
      layout: parseStageLayout(state.rawLayout),
    }));

const dragStageSelection = async (
  stage: Locator,
  pointerId: number,
  start: { x: number; y: number },
  end: { x: number; y: number },
): Promise<void> => {
  const startPoint = await getLocatorPoint(stage, start.x, start.y);
  const endPoint = await getLocatorPoint(stage, end.x, end.y);

  await stage.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: startPoint.clientX,
    clientY: startPoint.clientY,
  });
  await stage.dispatchEvent("pointermove", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: endPoint.clientX,
    clientY: endPoint.clientY,
  });
  await stage.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: endPoint.clientX,
    clientY: endPoint.clientY,
  });
};

const openStageContextMenuAt = async (
  stage: Locator,
  stageX: number,
  stageY: number,
  pointerId: number,
): Promise<void> => {
  const point = await getLocatorPoint(stage, stageX, stageY);

  await stage.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 2,
    buttons: 2,
    clientX: point.clientX,
    clientY: point.clientY,
  });
  await stage.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 2,
    buttons: 0,
    clientX: point.clientX,
    clientY: point.clientY,
  });
};

const dragLibraryItemToStage = async (
  libraryItem: Locator,
  stage: Locator,
  pointerId: number,
  dropAt: { x: number; y: number },
): Promise<void> => {
  const sourceRect = await getLocatorRect(libraryItem);
  const sourcePoint = await getLocatorPoint(
    libraryItem,
    sourceRect.width / 2,
    sourceRect.height / 2,
  );
  const destinationPoint = await getLocatorPoint(stage, dropAt.x, dropAt.y);

  await libraryItem.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: sourcePoint.clientX,
    clientY: sourcePoint.clientY,
  });
  await libraryItem.dispatchEvent("pointermove", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: destinationPoint.clientX,
    clientY: destinationPoint.clientY,
  });
  await libraryItem.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: destinationPoint.clientX,
    clientY: destinationPoint.clientY,
  });
};

const createCharacterSetFromUi = async (
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

const dragCharacterModeLibrarySpriteToStage = async (
  page: Page,
  spriteIndex: number,
  pointerId: number,
  dropAt: { x: number; y: number },
): Promise<void> => {
  const stage = page.getByLabel("キャラクターステージ", { exact: true });
  const librarySprite = page.getByRole("button", {
    name: `ライブラリスプライト ${spriteIndex}`,
    exact: true,
  });

  await expect(stage).toBeVisible();
  await expect(librarySprite).toBeVisible();

  const [libraryRect, stageRect] = await Promise.all([
    getLocatorRect(librarySprite),
    getLocatorRect(stage),
  ]);

  await librarySprite.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: libraryRect.clientX + libraryRect.width / 2,
    clientY: libraryRect.clientY + libraryRect.height / 2,
  });
  await librarySprite.dispatchEvent("pointermove", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: stageRect.clientX + dropAt.x,
    clientY: stageRect.clientY + dropAt.y,
  });
  await librarySprite.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: stageRect.clientX + dropAt.x,
    clientY: stageRect.clientY + dropAt.y,
  });
};

test("screen mode uses a gesture-first workspace with preview libraries", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "画面配置");

  await expect(
    page.getByRole("heading", { name: "画面配置ジェスチャー", exact: true }),
  ).toHaveCount(0);

  await expect(
    page.getByLabel("スクリーン配置ジェスチャーワークスペース", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "スクリーン配置編集パネル" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "スクリーン配置スプライトライブラリ" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "スクリーン配置キャラクターライブラリ" }),
  ).toBeVisible();
});

test("screen mode keeps sprite and character library sections separated", async ({
  page,
}) => {
  await page.setViewportSize({ width: 760, height: 1800 });
  await gotoApp(page);
  await openMode(page, "画面配置");

  const spriteLibrary = page.getByRole("region", {
    name: "スクリーン配置スプライトライブラリ",
    exact: true,
  });
  const characterLibrary = page.getByRole("region", {
    name: "スクリーン配置キャラクターライブラリ",
    exact: true,
  });

  await expect(spriteLibrary).toBeVisible();
  await expect(characterLibrary).toBeVisible();

  const [spriteRect, characterRect] = await Promise.all([
    getLocatorRect(spriteLibrary),
    getLocatorRect(characterLibrary),
  ]);
  const viewportHeight = page.viewportSize()?.height ?? 0;

  expect(spriteRect.clientY + spriteRect.height).toBeLessThanOrEqual(
    characterRect.clientY,
  );
  expect(characterRect.clientY + characterRect.height).toBeLessThanOrEqual(
    viewportHeight + 1,
  );
});

test("screen mode shows BG tile placement flow", async ({ page }) => {
  await gotoApp(page);
  await openMode(page, "BG編集");

  await page.getByRole("button", { name: "#005", exact: true }).click();
  const bgCanvas = page.getByLabel("BGタイル編集キャンバス", { exact: true });
  const beforeBgTilePixel = formatCanvasPixelColor(
    await readLogicalCanvasPixel(bgCanvas, 1, 1, 8, 8),
  );
  await clickLogicalCanvasPixel(bgCanvas, 1, 1, 8, 8);
  await expect
    .poll(async () =>
      formatCanvasPixelColor(
        await readLogicalCanvasPixel(bgCanvas, 1, 1, 8, 8),
      ),
    )
    .not.toBe(beforeBgTilePixel);

  await page
    .getByRole("button", { name: "パレットを開く", exact: true })
    .click();
  await page
    .getByRole("button", { name: "背景パレット 1 スロット 1", exact: true })
    .click();
  await page.getByRole("button", { name: "NES色 #02", exact: true }).click();

  await openMode(page, "画面配置");

  await expect(page.getByText("編集対象", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/既存のスプライト配置ジェスチャー/u)).toHaveCount(
    0,
  );
  await expect(page.getByText(/大型ダイアログで BG タイルを選び/u)).toHaveCount(
    0,
  );
  await expect(page.getByText(/BG 属性モックでは/u)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "BGタイル", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "BG属性", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("最後の仮配置", { exact: true })).toHaveCount(0);
  await expect(page.getByText("未選択", { exact: true })).toHaveCount(0);

  await expect(
    page.getByRole("button", { name: "BGタイル追加", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "BGタイル追加", exact: true }).click();

  const pickerDialog = page.getByRole("dialog", {
    name: "BG編集",
  });

  await expect(pickerDialog).toBeVisible();
  await expect(
    pickerDialog.getByRole("button", { name: "BGタイル", exact: true }),
  ).toBeVisible();
  await expect(
    pickerDialog.getByRole("button", { name: "BG属性", exact: true }),
  ).toBeVisible();
  const bgTile255Preview = pickerDialog.getByRole("button", {
    name: "BGタイルプレビュー 255",
    exact: true,
  });
  await bgTile255Preview.scrollIntoViewIfNeeded();
  await expect(bgTile255Preview).toBeVisible();
  await pickerDialog
    .getByRole("button", { name: "BGタイルプレビュー 5", exact: true })
    .click();
  await expect(pickerDialog).toHaveCount(0);

  const placementOverlay = page.getByRole("img", {
    name: "BG配置プレビュー",
    exact: true,
  });
  const stage = page.getByLabel("スクリーン配置ステージ", { exact: true });
  const screenCanvas = page.getByLabel("画面プレビューキャンバス", {
    exact: true,
  });
  const beforeRenderSignature = await screenCanvas.getAttribute(
    "data-render-signature",
  );

  await expect(placementOverlay).toBeVisible();
  await expect
    .poll(async () =>
      placementOverlay.evaluate(
        (element) => window.getComputedStyle(element).borderTopLeftRadius,
      ),
    )
    .toBe("0px");

  await stage.hover({ position: { x: 84, y: 60 } });

  await expect
    .poll(async () => {
      const [stageRect, overlayRect] = await Promise.all([
        getLocatorRect(stage),
        getLocatorRect(placementOverlay),
      ]);

      return {
        x: Math.round(overlayRect.clientX - stageRect.clientX),
        y: Math.round(overlayRect.clientY - stageRect.clientY),
      };
    })
    .toEqual({ x: 80, y: 48 });

  await stage.hover({ position: { x: 120, y: 92 } });

  await expect
    .poll(async () => {
      const [stageRect, overlayRect] = await Promise.all([
        getLocatorRect(stage),
        getLocatorRect(placementOverlay),
      ]);

      return {
        x: Math.round(overlayRect.clientX - stageRect.clientX),
        y: Math.round(overlayRect.clientY - stageRect.clientY),
      };
    })
    .toEqual({ x: 112, y: 80 });

  await stage.hover({ position: { x: 84, y: 60 } });

  await expect
    .poll(async () => {
      const [stageRect, overlayRect] = await Promise.all([
        getLocatorRect(stage),
        getLocatorRect(placementOverlay),
      ]);

      return {
        x: Math.round(overlayRect.clientX - stageRect.clientX),
        y: Math.round(overlayRect.clientY - stageRect.clientY),
      };
    })
    .toEqual({ x: 80, y: 48 });

  await clickLocatorWithMouseAtOffset(page, stage, { x: 84, y: 60 });

  await expect(placementOverlay).toHaveCount(0);
  await expect(screenCanvas).not.toHaveAttribute(
    "data-render-signature",
    beforeRenderSignature ?? "",
  );

  const afterTilePlacementSignature = await screenCanvas.getAttribute(
    "data-render-signature",
  );

  await page.getByRole("button", { name: "BGタイル追加", exact: true }).click();
  await pickerDialog
    .getByRole("button", { name: "BG属性", exact: true })
    .click();
  await pickerDialog
    .getByRole("button", { name: "BG属性パレット 1", exact: true })
    .click();

  await dispatchPointerClickAtOffset(stage, 403, { x: 84, y: 60 });

  await expect(screenCanvas).not.toHaveAttribute(
    "data-render-signature",
    afterTilePlacementSignature ?? "",
  );

  await expect(placementOverlay).toHaveCount(0);
  await expect(page.getByText("最後の仮配置", { exact: true })).toHaveCount(0);
  await expect(page.getByText("未選択", { exact: true })).toHaveCount(0);
});

test("screen mode supports canvas zooming and panning", async ({ page }) => {
  await gotoApp(page);
  await openMode(page, "画面配置");

  const viewport = page.getByLabel("画面プレビューキャンバスビュー");
  const canvas = page.getByLabel("画面プレビューキャンバス", { exact: true });

  await expect(viewport).toBeVisible();
  await expect(canvas).toBeVisible();

  const defaultCanvasSize = await getCanvasSize(canvas);

  expect(defaultCanvasSize.width).toBe(512);
  expect(defaultCanvasSize.height).toBe(480);

  await zoomViewportAtCenter(viewport, -120);

  await expect.poll(async () => (await getCanvasSize(canvas)).width).toBe(768);
  await expect.poll(async () => (await getCanvasSize(canvas)).height).toBe(720);

  await page.getByRole("button", { name: "画面ズーム拡大" }).click();

  await expect.poll(async () => (await getCanvasSize(canvas)).width).toBe(1024);
  await expect.poll(async () => (await getCanvasSize(canvas)).height).toBe(960);

  await viewport.evaluate((element) => {
    element.scrollTo({ left: 120, top: 80 });
  });

  const initialScroll = await viewport.evaluate((element) => ({
    left: element.scrollLeft,
    top: element.scrollTop,
  }));

  await panViewportWithMiddleMouse(
    viewport,
    17,
    { x: 220, y: 200 },
    { x: 180, y: 170 },
  );

  await expect
    .poll(async () => viewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(initialScroll.left);
  await expect
    .poll(async () => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(initialScroll.top);

  await page.getByRole("button", { name: "画面ズーム縮小" }).click();

  await expect.poll(async () => (await getCanvasSize(canvas)).width).toBe(768);
  await expect.poll(async () => (await getCanvasSize(canvas)).height).toBe(720);
});

test("screen mode toggles sprite outlines from the zoom row", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "画面配置");

  const stage = page.getByLabel("スクリーン配置ステージ", { exact: true });
  const spritePreview = page.getByRole("button", {
    name: "スクリーンライブラリスプライト 0",
    exact: true,
  });
  const bgAddButton = page.getByRole("button", {
    name: "BGタイル追加",
    exact: true,
  });
  const outlineToggle = page.getByRole("button", {
    name: "スプライト外枠表示切り替え",
    exact: true,
  });
  const indexToggle = page.getByRole("button", {
    name: "スプライト番号表示切り替え",
    exact: true,
  });

  await expect(stage).toBeVisible();
  await expect(spritePreview).toBeVisible();
  await expect(bgAddButton).toBeVisible();
  await expect(outlineToggle).toBeVisible();
  await expect(indexToggle).toBeVisible();

  const [bgAddButtonRect, outlineToggleRect, indexToggleRect] =
    await Promise.all([
      getLocatorRect(bgAddButton),
      getLocatorRect(outlineToggle),
      getLocatorRect(indexToggle),
    ]);

  expect(bgAddButtonRect.clientX).toBeLessThan(outlineToggleRect.clientX);
  expect(outlineToggleRect.clientX).toBeLessThan(indexToggleRect.clientX);

  await dragLibraryItemToStage(spritePreview, stage, 19, { x: 120, y: 104 });

  await expect
    .poll(async () => (await getScreenStageDebugState(stage)).spriteCount)
    .toBe(1);

  const stageOutline = stage
    .locator("[data-stage-sprite-outline='true']")
    .first();

  await expect(stageOutline).toHaveCount(1);

  await expect
    .poll(async () =>
      stageOutline.evaluate(
        (element) => window.getComputedStyle(element).borderTopStyle,
      ),
    )
    .toBe("solid");

  await outlineToggle.click();

  await expect
    .poll(async () =>
      stageOutline.evaluate(
        (element) => window.getComputedStyle(element).borderTopStyle,
      ),
    )
    .toBe("none");

  await outlineToggle.click();

  await expect
    .poll(async () =>
      stageOutline.evaluate(
        (element) => window.getComputedStyle(element).borderTopStyle,
      ),
    )
    .toBe("solid");
});

test("screen mode toggles sprite index labels from the zoom row", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "画面配置");

  const stage = page.getByLabel("スクリーン配置ステージ", { exact: true });
  const spritePreview = page.getByRole("button", {
    name: "スクリーンライブラリスプライト 0",
    exact: true,
  });
  const indexToggle = page.getByRole("button", {
    name: "スプライト番号表示切り替え",
    exact: true,
  });

  await expect(stage).toBeVisible();
  await expect(spritePreview).toBeVisible();
  await expect(indexToggle).toBeVisible();

  await dragLibraryItemToStage(spritePreview, stage, 21, { x: 112, y: 96 });

  await expect
    .poll(async () => (await getScreenStageDebugState(stage)).spriteCount)
    .toBe(1);

  await expect(stage.getByText("#0", { exact: true })).toHaveCount(0);

  await indexToggle.click();
  await expect(stage.getByText("#0", { exact: true })).toBeVisible();

  await indexToggle.click();
  await expect(stage.getByText("#0", { exact: true })).toHaveCount(0);
});

test("screen mode places and deletes sprites via drag and context menu", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "画面配置");

  const stage = page.getByLabel("スクリーン配置ステージ", { exact: true });
  const spritePreview = page.getByRole("button", {
    name: "スクリーンライブラリスプライト 0",
    exact: true,
  });

  await expect(stage).toBeVisible();
  await expect(spritePreview).toBeVisible();

  await dragLibraryItemToStage(spritePreview, stage, 31, { x: 128, y: 104 });

  await expect
    .poll(async () => (await getScreenStageDebugState(stage)).spriteCount)
    .toBe(1);

  const [stagePoint, libraryPoint] = await Promise.all([
    getLocatorPoint(stage, 128, 104),
    getLocatorPoint(spritePreview, 20, 20),
  ]);

  await openStageContextMenuAt(stage, 128, 104, 41);
  await expect(
    page.getByRole("menu", { name: "スクリーン配置コンテキストメニュー" }),
  ).toBeVisible();

  const [stagePreventsNativeContextMenu, libraryPreventsNativeContextMenu] =
    await Promise.all([
      page.evaluate((point) => {
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
      }, stagePoint),
      page.evaluate((point) => {
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
      }, libraryPoint),
    ]);

  expect(stagePreventsNativeContextMenu).toBe(true);
  expect(libraryPreventsNativeContextMenu).toBe(true);

  await page.getByRole("menuitem", { name: "削除", exact: true }).click();

  await expect
    .poll(async () => (await getScreenStageDebugState(stage)).spriteCount)
    .toBe(0);
});

test("screen mode supports keyboard nudge, escape close, and delete", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "画面配置");

  const stage = page.getByLabel("スクリーン配置ステージ", { exact: true });
  const spritePreview = page.getByRole("button", {
    name: "スクリーンライブラリスプライト 0",
    exact: true,
  });

  await expect(stage).toBeVisible();
  await expect(spritePreview).toBeVisible();

  await dragLibraryItemToStage(spritePreview, stage, 111, { x: 128, y: 104 });

  await expect
    .poll(async () => (await getScreenStageDebugState(stage)).spriteCount)
    .toBe(1);

  await dragStageSelection(stage, 121, { x: 128, y: 104 }, { x: 128, y: 104 });

  await expect
    .poll(async () => (await getScreenStageDebugState(stage)).selectedCount)
    .toBe(1);

  const beforeNudge = await getScreenStageDebugState(stage);
  const beforeSprite = beforeNudge.layout[0] ?? { x: 0, y: 0 };

  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");

  await expect
    .poll(async () => getScreenStageDebugState(stage))
    .toMatchObject({
      layout: [
        {
          x: beforeSprite.x + 1,
          y: beforeSprite.y + 1,
        },
      ],
    });

  const afterNudge = await getScreenStageDebugState(stage);
  const movedSprite = afterNudge.layout[0] ?? { x: 0, y: 0 };

  await openStageContextMenuAt(
    stage,
    movedSprite.x + 1,
    movedSprite.y + 1,
    131,
  );
  const contextMenu = page.getByRole("menu", {
    name: "スクリーン配置コンテキストメニュー",
  });
  await expect(contextMenu).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(contextMenu).toHaveCount(0);

  await stage.focus();
  await page.keyboard.press("Delete");

  await expect
    .poll(async () => (await getScreenStageDebugState(stage)).spriteCount)
    .toBe(0);
});

test("screen mode supports character preview drop and grouped drag movement", async ({
  page,
}) => {
  await gotoApp(page);
  await openMode(page, "キャラクター編集");

  await createCharacterSetFromUi(page, "Screen Hero");
  await dragCharacterModeLibrarySpriteToStage(page, 0, 401, { x: 128, y: 128 });
  await dragCharacterModeLibrarySpriteToStage(page, 1, 402, { x: 156, y: 128 });

  await openMode(page, "画面配置");

  const stage = page.getByLabel("スクリーン配置ステージ", { exact: true });
  const characterPreview = page.getByRole("button", {
    name: "スクリーンキャラクタープレビュー Screen Hero",
  });

  await expect(stage).toBeVisible();
  await expect(characterPreview).toBeVisible();

  await dragLibraryItemToStage(characterPreview, stage, 51, {
    x: 96,
    y: 88,
  });

  await expect
    .poll(async () => (await getScreenStageDebugState(stage)).spriteCount)
    .toBe(2);

  await dragStageSelection(
    stage,
    61,
    {
      x: 90,
      y: 84,
    },
    {
      x: 118,
      y: 100,
    },
  );

  await expect
    .poll(async () => (await getScreenStageDebugState(stage)).selectedCount)
    .toBe(2);

  const beforeDrag = await getScreenStageDebugState(stage);

  await dragStageSelection(
    stage,
    71,
    {
      x: 97,
      y: 89,
    },
    {
      x: 129,
      y: 113,
    },
  );

  const afterDrag = await getScreenStageDebugState(stage);
  const beforeFirst = beforeDrag.layout[0] ?? { x: 0, y: 0 };
  const beforeSecond = beforeDrag.layout[1] ?? { x: 0, y: 0 };
  const afterFirst = afterDrag.layout[0] ?? { x: 0, y: 0 };
  const afterSecond = afterDrag.layout[1] ?? { x: 0, y: 0 };
  const firstDeltaX = afterFirst.x - beforeFirst.x;
  const firstDeltaY = afterFirst.y - beforeFirst.y;
  const secondDeltaX = afterSecond.x - beforeSecond.x;
  const secondDeltaY = afterSecond.y - beforeSecond.y;

  expect(firstDeltaX).toBeGreaterThan(0);
  expect(firstDeltaY).toBeGreaterThan(0);
  expect(secondDeltaX).toBe(firstDeltaX);
  expect(secondDeltaY).toBe(firstDeltaY);
  expect(afterDrag.selectedCount).toBe(2);
});
