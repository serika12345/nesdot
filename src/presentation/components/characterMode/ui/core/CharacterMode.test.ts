import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./CharacterModeScreen", () => {
  return {
    CharacterModeScreen: () =>
      React.createElement("div", {}, "character-mode-screen"),
  };
});

import { CharacterMode } from "./CharacterMode";

describe("CharacterMode", () => {
  it("renders the screen", () => {
    const markup = renderToStaticMarkup(React.createElement(CharacterMode));

    expect(markup).toContain("character-mode-screen");
  });
});
