import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./SpriteModeScreen", () => {
  return {
    SpriteModeScreen: () =>
      React.createElement("div", {}, "sprite-mode-screen"),
  };
});

import { SpriteMode } from "./SpriteMode";

describe("SpriteMode", () => {
  it("renders the sprite mode screen", () => {
    const markup = renderToStaticMarkup(React.createElement(SpriteMode));

    expect(markup).toContain("sprite-mode-screen");
  });
});
