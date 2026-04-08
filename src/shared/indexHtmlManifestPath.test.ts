import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const readIndexHtml = (): string => {
  return readFileSync(new URL("../index.html", import.meta.url), "utf8");
};

describe("index.html manifest link", () => {
  test("uses the Vite base placeholder for the manifest href", () => {
    const indexHtml = readIndexHtml();

    expect(indexHtml).toContain(
      '<link rel="manifest" href="%BASE_URL%manifest.webmanifest" />',
    );
  });
});
