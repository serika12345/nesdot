import * as O from "fp-ts/Option";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useCharacterModeProjectActions: vi.fn(),
  };
});

vi.mock("./CharacterModeStateProvider", () => {
  return {
    CharacterModeStateProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, {}, children),
    useCharacterModeProjectActions: mockedHooks.useCharacterModeProjectActions,
  };
});

vi.mock("./CharacterModeScreen", () => {
  return {
    CharacterModeScreen: () =>
      React.createElement("div", {}, "character-mode-screen"),
  };
});

import { CharacterMode } from "./CharacterMode";

describe("CharacterMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useCharacterModeProjectActions.mockReturnValue({
      projectActions: [
        {
          id: "share-export-character-json",
          label: "JSON",
          onSelect: vi.fn(),
        },
      ],
    });
  });

  it("renders the screen while exposing file menu state during render", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterMode, {
        render: ({ fileMenuState, panel }) =>
          React.createElement(
            React.Fragment,
            {},
            React.createElement(
              "div",
              {},
              `share:${fileMenuState.shareActions.length} restore:${O.isSome(fileMenuState.restoreAction)}`,
            ),
            panel,
          ),
      }),
    );

    expect(markup).toContain("share:1 restore:false");
    expect(markup).toContain("character-mode-screen");
  });
});
