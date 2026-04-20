import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const screenshotOutputDirectory = path.join(projectRoot, "docs/assets/readme");
const screenshotViewport = { width: 1600, height: 1024 };

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

const closeServer = async (server) => {
  await new Promise((resolve, reject) => {
    server.close((closeError) => {
      if (closeError instanceof Error) {
        reject(closeError);
        return;
      }

      resolve();
    });
  });
};

const getContentType = (filePath) => {
  const extension = path.extname(filePath);

  return contentTypes[extension] ?? "application/octet-stream";
};

const isAddressInfo = (address) => {
  return typeof address === "object" && address !== null && "port" in address;
};

const isInsideDirectory = (rootDirectory, candidatePath) => {
  const relativePath = path.relative(rootDirectory, candidatePath);

  return (
    relativePath.startsWith("..") === false &&
    path.isAbsolute(relativePath) === false
  );
};

const serveBuiltPreview = async () => {
  const tempRootDirectory = mkdtempSync(path.join(tmpdir(), "nesdot-readme-"));
  const buildOutputDirectory = path.join(tempRootDirectory, "build-output");

  execFileSync(
    "pnpm",
    [
      "exec",
      "vite",
      "build",
      "--outDir",
      buildOutputDirectory,
      "--emptyOutDir",
    ],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        VITE_BASE_PATH: "/",
      },
      stdio: "inherit",
    },
  );

  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const relativePath =
      requestUrl.pathname === "/"
        ? "index.html"
        : requestUrl.pathname.replace(/^\/+/, "");
    const candidatePath = path.resolve(buildOutputDirectory, relativePath);

    if (isInsideDirectory(buildOutputDirectory, candidatePath) === false) {
      response.writeHead(403);
      response.end();
      return;
    }

    try {
      const body = readFileSync(candidatePath);

      response.writeHead(200, {
        "Content-Type": getContentType(candidatePath),
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });

  const port = await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve(
        isAddressInfo(server.address()) === true ? server.address().port : 0,
      );
    });
  });

  if (typeof port !== "number" || port <= 0) {
    await closeServer(server);
    rmSync(tempRootDirectory, { recursive: true, force: true });
    throw new Error("Failed to start static preview server");
  }

  return {
    dispose: async () => {
      await closeServer(server);
      rmSync(tempRootDirectory, { recursive: true, force: true });
    },
    url: `http://127.0.0.1:${port}/`,
  };
};

const openMode = async (page, modeName) => {
  await page.getByRole("menuitem", { name: "作業モード", exact: true }).click();
  await page.getByRole("menuitem", { name: modeName, exact: true }).click();
};

const openApp = async (page, url) => {
  await page.goto(url);
  await page.locator("body").waitFor({ state: "visible" });
};

const clickLogicalCanvasPixel = async (
  page,
  locator,
  pixelX,
  pixelY,
  logicalWidth,
  logicalHeight,
) => {
  const rect = await locator.boundingBox();

  if (rect instanceof Object === false) {
    throw new Error("Canvas bounds were not available");
  }

  const clientX = rect.x + (pixelX + 0.5) * (rect.width / logicalWidth);
  const clientY = rect.y + (pixelY + 0.5) * (rect.height / logicalHeight);

  await page.mouse.move(clientX, clientY);
  await page.mouse.down();
  await page.mouse.up();
};

const paintShowcaseSprite = async (page) => {
  const spriteCanvas = page.getByLabel("スプライト編集キャンバス", {
    exact: true,
  });
  const showcasePixels = [
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 5],
    [1, 5],
    [5, 1],
    [3, 1],
    [3, 5],
  ];

  await spriteCanvas.waitFor({ state: "visible" });

  for (const [pixelX, pixelY] of showcasePixels) {
    await clickLogicalCanvasPixel(page, spriteCanvas, pixelX, pixelY, 8, 8);
  }
};

const createCharacterSet = async (page, setName) => {
  await page.getByRole("button", { name: "セットを作成" }).click();

  const createDialog = page.getByRole("dialog", {
    name: "キャラクターセットを作成",
  });

  await createDialog.waitFor({ state: "visible" });
  await createDialog
    .getByRole("textbox", { name: "新規セット名" })
    .fill(setName);
  await createDialog.getByRole("button", { name: "作成する" }).click();
  await createDialog.waitFor({ state: "hidden" });
};

const dragLibraryItemToStage = async (
  libraryItem,
  stage,
  pointerId,
  dropAt,
) => {
  const [sourceRect, destinationRect] = await Promise.all([
    libraryItem.boundingBox(),
    stage.boundingBox(),
  ]);

  if (
    sourceRect instanceof Object === false ||
    destinationRect instanceof Object === false
  ) {
    throw new Error("Drag source or destination bounds were not available");
  }

  const sourceClientX = sourceRect.x + sourceRect.width / 2;
  const sourceClientY = sourceRect.y + sourceRect.height / 2;
  const destinationClientX = destinationRect.x + dropAt.x;
  const destinationClientY = destinationRect.y + dropAt.y;

  await libraryItem.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: sourceClientX,
    clientY: sourceClientY,
  });
  await libraryItem.dispatchEvent("pointermove", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: destinationClientX,
    clientY: destinationClientY,
  });
  await libraryItem.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    buttons: 0,
    clientX: destinationClientX,
    clientY: destinationClientY,
  });
};

const populateCharacterSet = async (page) => {
  const characterStage = page.getByLabel("キャラクターステージ", {
    exact: true,
  });
  const characterLibrarySprite = page.getByRole("button", {
    name: "ライブラリスプライト 0",
    exact: true,
  });

  await characterStage.waitFor({ state: "visible" });
  await characterLibrarySprite.waitFor({ state: "visible" });
  await dragLibraryItemToStage(characterLibrarySprite, characterStage, 17, {
    x: 120,
    y: 96,
  });
};

const captureSpriteMode = async (browser, baseUrl) => {
  const page = await browser.newPage({ viewport: screenshotViewport });

  await openApp(page, baseUrl);
  await paintShowcaseSprite(page);
  await page.getByLabel("スプライト番号").fill("0");
  await page.getByRole("button", { name: "ツールを開く" }).click();
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(screenshotOutputDirectory, "sprite-mode.png"),
  });

  await page.close();
};

const captureCharacterMode = async (browser, baseUrl) => {
  const page = await browser.newPage({ viewport: screenshotViewport });

  await openApp(page, baseUrl);
  await paintShowcaseSprite(page);
  await openMode(page, "キャラクター編集");
  await createCharacterSet(page, "Hero");
  await populateCharacterSet(page);
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(screenshotOutputDirectory, "character-mode.png"),
  });

  await page.close();
};

const captureScreenMode = async (browser, baseUrl) => {
  const page = await browser.newPage({ viewport: screenshotViewport });

  await openApp(page, baseUrl);
  await paintShowcaseSprite(page);
  await openMode(page, "キャラクター編集");
  await createCharacterSet(page, "Hero");
  await populateCharacterSet(page);
  await openMode(page, "画面配置");
  await dragLibraryItemToStage(
    page.getByRole("button", {
      name: "スクリーンライブラリスプライト 0",
      exact: true,
    }),
    page.getByLabel("スクリーン配置ステージ", { exact: true }),
    21,
    { x: 120, y: 104 },
  );
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(screenshotOutputDirectory, "screen-mode.png"),
  });

  await page.close();
};

const run = async () => {
  mkdirSync(screenshotOutputDirectory, { recursive: true });

  const preview = await serveBuiltPreview();

  try {
    const browser = await chromium.launch();

    try {
      await captureSpriteMode(browser, preview.url);
      await captureCharacterMode(browser, preview.url);
      await captureScreenMode(browser, preview.url);
    } finally {
      await browser.close();
    }
  } finally {
    await preview.dispose();
  }
};

await run();
