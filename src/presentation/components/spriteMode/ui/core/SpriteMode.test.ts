import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../panels/SpriteModeEditorPanel", () => {
  return {
    SpriteModeEditorPanel: () =>
      React.createElement("div", {}, "sprite-editor-panel"),
  };
});

vi.mock("../panels/SpriteModeCanvasPanel", () => {
  return {
    SpriteModeCanvasPanel: () =>
      React.createElement("div", {}, "sprite-canvas-panel"),
  };
});

import { SpriteMode } from "./SpriteMode";

describe("SpriteMode", () => {
  it("renders both panels", () => {
    const markup = renderToStaticMarkup(React.createElement(SpriteMode));

    expect(markup).toContain("sprite-editor-panel");
    expect(markup).toContain("sprite-canvas-panel");
  });
});
