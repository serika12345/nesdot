import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useCharacterModeProjectActions: vi.fn(),
    useCharacterModeWorkspaceEvents: vi.fn(),
  };
});

vi.mock("./CharacterModeStateProvider", () => {
  return {
    useCharacterModeProjectActions: mockedHooks.useCharacterModeProjectActions,
    useCharacterModeWorkspaceEvents:
      mockedHooks.useCharacterModeWorkspaceEvents,
  };
});

vi.mock("../decomposition/CharacterModeDecompositionRegionMenu", () => {
  return {
    CharacterModeDecompositionRegionMenu: () =>
      React.createElement("div", {}, "decomposition-region-menu"),
  };
});

vi.mock("../menu/CharacterModeSpriteMenu", () => {
  return {
    CharacterModeSpriteMenu: () =>
      React.createElement("div", {}, "sprite-menu"),
  };
});

vi.mock("./CharacterModeWorkspace", () => {
  return {
    CharacterModeWorkspace: () =>
      React.createElement("div", {}, "character-workspace"),
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
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useCharacterModeProjectActions.mockReturnValue({
      projectActions: [],
    });
    mockedHooks.useCharacterModeWorkspaceEvents.mockReturnValue({
      handleWorkspacePointerDownCapture: vi.fn(),
      handleWorkspacePointerMove: vi.fn(),
      handleWorkspacePointerEnd: vi.fn(),
    });
  });

  it("renders the outer screen shell without app-panel", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterModeScreen, {
        onFileMenuStateChange: vi.fn(),
      }),
    );

    expect(markup).toContain("character-workspace");
    expect(markup).toContain("editor-mode-card");
    expect(markup).toContain("MuiPaper-outlined");
    expect(markup).not.toContain("app-panel");
  });
});
