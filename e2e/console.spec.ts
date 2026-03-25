import { expect, test } from "@playwright/test";

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

  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await page.waitForTimeout(500);

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("layout follows window resize", async ({ page }) => {
  await page.goto("/");

  await page.setViewportSize({ width: 900, height: 700 });

  const bodyMinWidth = await page.evaluate(
    () => window.getComputedStyle(document.body).minWidth,
  );

  await expect(page.getByRole("heading", { name: "作業モード" })).toBeVisible();
  expect(bodyMinWidth).toBe("0px");
});
