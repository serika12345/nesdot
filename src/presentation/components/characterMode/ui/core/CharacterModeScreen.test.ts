import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./CharacterModeGestureWorkspace", () => {
  return {
    CharacterModeGestureWorkspace: () =>
      React.createElement("div", {}, "character-gesture-workspace"),
  };
});

vi.mock("../set/CharacterModeSetDraftFields", () => {
  return {
    CharacterModeSetDraftFields: () =>
      React.createElement("div", {}, "set-draft-fields"),
  };
});

vi.mock("../set/CharacterModeSetSelectionFields", () => {
  return {
    CharacterModeSetSelectionFields: () =>
      React.createElement("div", {}, "set-selection-fields"),
  };
});

vi.mock("../sidebar/CharacterModeSidebarEditorModeCard", () => {
  return {
    CharacterModeSidebarEditorModeCard: () =>
      React.createElement("div", {}, "editor-mode-card"),
  };
});

vi.mock("../sidebar/CharacterModeSidebarSpriteSizeCard", () => {
  return {
    CharacterModeSidebarSpriteSizeCard: () =>
      React.createElement("div", {}, "sprite-size-card"),
  };
});

import { CharacterModeScreen } from "./CharacterModeScreen";

describe("CharacterModeScreen", () => {
  it("renders the outer screen shell without app-panel", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterModeScreen),
    );

    expect(markup).toContain("character-gesture-workspace");
    expect(markup).toContain("editor-mode-card");
    expect(markup).toContain("screenRoot");
    expect(markup).not.toContain("app-panel");
  });
});
