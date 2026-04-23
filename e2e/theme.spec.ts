import { expect, test } from "@playwright/test";
import { getMenuTrigger, getVisibleMenuItem, gotoApp } from "./support/app";

test("switches theme preference from the View menu and persists the selected radio item", async ({
  page,
}) => {
  await gotoApp(page);

  await getMenuTrigger(page, "表示").click();
  await expect(getVisibleMenuItem(page, "ライト")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await expect(getVisibleMenuItem(page, "ダーク")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await expect(getVisibleMenuItem(page, "システムに合わせる")).toHaveAttribute(
    "aria-checked",
    "true",
  );

  await getVisibleMenuItem(page, "ダーク").click();
  await expect
    .poll(async () =>
      page.evaluate(
        () => window.getComputedStyle(document.documentElement).colorScheme,
      ),
    )
    .toBe("dark");

  await page.reload();
  await getMenuTrigger(page, "表示").click();
  await expect(getVisibleMenuItem(page, "ダーク")).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("follows the system color scheme when the system preference is selected", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await gotoApp(page);

  await getMenuTrigger(page, "表示").click();
  await getVisibleMenuItem(page, "システムに合わせる").click();

  await expect
    .poll(async () =>
      page.evaluate(
        () => window.getComputedStyle(document.documentElement).colorScheme,
      ),
    )
    .toBe("dark");

  await page.emulateMedia({ colorScheme: "light" });

  await expect
    .poll(async () =>
      page.evaluate(
        () => window.getComputedStyle(document.documentElement).colorScheme,
      ),
    )
    .toBe("light");
});
