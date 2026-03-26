import { expect, test } from "@playwright/test";

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

  const stage = page.getByLabel("キャラクターステージ");
  const librarySprite = page.getByRole("button", {
    name: "ライブラリスプライト 0",
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

  expect(initialX).toBeGreaterThanOrEqual(85);
  expect(initialX).toBeLessThanOrEqual(88);
  expect(initialY).toBeGreaterThanOrEqual(65);
  expect(initialY).toBeLessThanOrEqual(68);

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

  expect(movedX).toBeGreaterThanOrEqual(initialX + 10);
  expect(movedX).toBeLessThanOrEqual(initialX + 14);
  expect(movedY).toBeGreaterThanOrEqual(initialY + 8);
  expect(movedY).toBeLessThanOrEqual(initialY + 12);
});
