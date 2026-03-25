import { expect, test } from "@playwright/test";

test("captures browser console and page errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    const line = `[browser:${message.type()}] ${message.text()}`;
    // Print browser-side console logs in terminal so the agent can inspect them.
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

  if (consoleErrors.length > 0) {
    console.log(`[summary] console error count: ${consoleErrors.length}`);
  }

  expect(pageErrors).toEqual([]);
});
