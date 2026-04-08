import { expect, test } from "@playwright/test";

test("shows desktop auto-update dialog flow in preview mode", async ({
  page,
}) => {
  await page.goto(
    "/?__debug-update-dialog-state=downloading&__debug-update-dialog-version=0.1.7&__debug-update-dialog-progress=42",
  );

  const downloadingDialog = page.getByRole("dialog", {
    name: "アップデートをダウンロード中",
  });
  await expect(downloadingDialog).toBeVisible();
  await expect(downloadingDialog.getByText("42%")).toBeVisible();
  await expect(
    downloadingDialog.getByRole("button", {
      name: "ダウンロード中...",
    }),
  ).toBeDisabled();

  await page.goto(
    "/?__debug-update-dialog-state=ready&__debug-update-dialog-version=0.1.7",
  );

  const readyDialog = page.getByRole("dialog", {
    name: "アップデートの準備が完了しました",
  });
  await expect(readyDialog).toBeVisible();
  await expect(
    readyDialog.getByRole("button", {
      name: "今すぐ再起動",
    }),
  ).toBeVisible();
  await expect(
    readyDialog.getByRole("button", {
      name: "あとで",
    }),
  ).toBeVisible();

  await page.goto(
    "/?__debug-update-dialog-state=failed&__debug-update-dialog-error=%E7%BD%B2%E5%90%8D%E6%A4%9C%E8%A8%BC%E3%81%AB%E5%A4%B1%E6%95%97%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F",
  );

  const failedDialog = page.getByRole("dialog", {
    name: "アップデートに失敗しました",
  });
  await expect(failedDialog).toBeVisible();
  await expect(failedDialog.getByText("署名検証に失敗しました")).toBeVisible();
  await failedDialog
    .getByRole("button", {
      name: "閉じる",
    })
    .click();
  await expect(failedDialog).toBeHidden();
});

test("desktop auto-update dialog respects per-state dismissal rules", async ({
  page,
}) => {
  await page.goto(
    "/?__debug-update-dialog-state=downloading&__debug-update-dialog-version=0.1.7&__debug-update-dialog-progress=42",
  );

  const downloadingDialog = page.getByRole("dialog", {
    name: "アップデートをダウンロード中",
  });

  await expect(downloadingDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(downloadingDialog).toBeVisible();

  await page.goto(
    "/?__debug-update-dialog-state=ready&__debug-update-dialog-version=0.1.7",
  );

  const readyDialog = page.getByRole("dialog", {
    name: "アップデートの準備が完了しました",
  });

  await expect(readyDialog).toBeVisible();
  await readyDialog.getByRole("button", { name: "あとで" }).click();
  await expect(readyDialog).toBeHidden();
});
