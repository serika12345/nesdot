import { expect, test } from "@playwright/test";

test("shows desktop auto-update dialog flow in preview mode", async ({
  page,
}) => {
  await page.goto("/?__debug-update-dialog-state=checking");

  const checkingDialog = page.getByRole("dialog", {
    name: "更新を確認中",
  });
  await expect(checkingDialog).toBeVisible();
  await expect(
    checkingDialog.getByRole("button", {
      name: "確認中...",
    }),
  ).toBeDisabled();

  await page.goto(
    "/?__debug-update-dialog-state=available&__debug-update-dialog-version=0.1.7",
  );

  const availableDialog = page.getByRole("dialog", {
    name: "新しい更新を利用できます",
  });
  await expect(availableDialog).toBeVisible();
  await expect(
    availableDialog.getByRole("button", {
      name: "今すぐ更新",
    }),
  ).toBeVisible();
  await expect(
    availableDialog.getByRole("button", {
      name: "あとで",
    }),
  ).toBeVisible();

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

  await page.goto("/?__debug-update-dialog-state=up-to-date");

  const upToDateDialog = page.getByRole("dialog", {
    name: "最新の状態です",
  });
  await expect(upToDateDialog).toBeVisible();
  await expect(
    upToDateDialog.getByText("利用可能な更新は見つかりませんでした。"),
  ).toBeVisible();
  await expect(
    upToDateDialog.getByRole("button", {
      name: "閉じる",
    }),
  ).toBeVisible();

  await page.goto(
    "/?__debug-update-dialog-state=failed&__debug-update-dialog-version=0.1.7&__debug-update-dialog-operation=download-install&__debug-update-dialog-error=%E7%BD%B2%E5%90%8D%E6%A4%9C%E8%A8%BC%E3%81%AB%E5%A4%B1%E6%95%97%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F",
  );

  const failedDialog = page.getByRole("dialog", {
    name: "アップデートに失敗しました",
  });
  await expect(failedDialog).toBeVisible();
  await expect(
    failedDialog.getByText(
      "ダウンロードまたはインストール処理で問題が発生しました。",
    ),
  ).toBeVisible();
  await expect(failedDialog.getByText("対象バージョン")).toBeVisible();
  await expect(failedDialog.getByText("0.1.7")).toBeVisible();
  await expect(failedDialog.getByText("処理段階")).toBeVisible();
  await expect(
    failedDialog.getByText("ダウンロード / インストール"),
  ).toBeVisible();
  await expect(failedDialog.getByText("技術詳細")).toBeVisible();
  await expect(failedDialog.getByText("署名検証に失敗しました")).toBeVisible();
  await expect(failedDialog.getByText("対処")).toBeVisible();
  await expect(
    failedDialog.getByText(
      "ネットワーク接続、配布ファイル、署名を確認してから再度お試しください。",
    ),
  ).toBeVisible();
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
  await page.goto("/?__debug-update-dialog-state=checking");

  const checkingDialog = page.getByRole("dialog", {
    name: "更新を確認中",
  });

  await expect(checkingDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(checkingDialog).toBeVisible();

  await page.goto(
    "/?__debug-update-dialog-state=available&__debug-update-dialog-version=0.1.7",
  );

  const availableDialog = page.getByRole("dialog", {
    name: "新しい更新を利用できます",
  });

  await expect(availableDialog).toBeVisible();
  await availableDialog.getByRole("button", { name: "あとで" }).click();
  await expect(availableDialog).toBeHidden();

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

  await page.goto("/?__debug-update-dialog-state=up-to-date");

  const upToDateDialog = page.getByRole("dialog", {
    name: "最新の状態です",
  });

  await expect(upToDateDialog).toBeVisible();
  await upToDateDialog.getByRole("button", { name: "閉じる" }).click();
  await expect(upToDateDialog).toBeHidden();
});

test("shows pwa update dialog flow in preview mode", async ({ page }) => {
  await page.goto("/?__debug-pwa-update-state=available");

  const availableDialog = page.getByRole("dialog", {
    name: "新しい更新を利用できます",
  });
  await expect(availableDialog).toBeVisible();
  await expect(
    availableDialog.getByRole("button", {
      name: "今すぐ更新",
    }),
  ).toBeVisible();
  await expect(
    availableDialog.getByRole("button", {
      name: "あとで",
    }),
  ).toBeVisible();

  await page.goto("/?__debug-pwa-update-state=applying");

  const applyingDialog = page.getByRole("dialog", {
    name: "更新を適用中",
  });
  await expect(applyingDialog).toBeVisible();
  await expect(
    applyingDialog.getByRole("button", {
      name: "更新中...",
    }),
  ).toBeDisabled();

  await page.goto(
    "/?__debug-pwa-update-state=failed&__debug-pwa-update-error=%E6%9B%B4%E6%96%B0%E3%81%AE%E9%81%A9%E7%94%A8%E3%81%AB%E5%A4%B1%E6%95%97%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F",
  );

  const failedDialog = page.getByRole("dialog", {
    name: "更新に失敗しました",
  });
  await expect(failedDialog).toBeVisible();
  await expect(
    failedDialog.getByText("更新の適用に失敗しました"),
  ).toBeVisible();
  await failedDialog
    .getByRole("button", {
      name: "閉じる",
    })
    .click();
  await expect(failedDialog).toBeHidden();
});

test("pwa update dialog respects per-state dismissal rules", async ({
  page,
}) => {
  await page.goto("/?__debug-pwa-update-state=applying");

  const applyingDialog = page.getByRole("dialog", {
    name: "更新を適用中",
  });

  await expect(applyingDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(applyingDialog).toBeVisible();

  await page.goto("/?__debug-pwa-update-state=available");

  const availableDialog = page.getByRole("dialog", {
    name: "新しい更新を利用できます",
  });

  await expect(availableDialog).toBeVisible();
  await availableDialog.getByRole("button", { name: "あとで" }).click();
  await expect(availableDialog).toBeHidden();
});
