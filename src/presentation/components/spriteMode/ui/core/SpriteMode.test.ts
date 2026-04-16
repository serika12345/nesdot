import * as O from "fp-ts/Option";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useSpriteModeProjectActions: vi.fn(),
  };
});

vi.mock("./SpriteModeStateProvider", () => {
  return {
    SpriteModeStateProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, {}, children),
    useSpriteModeProjectActions: mockedHooks.useSpriteModeProjectActions,
  };
});

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
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useSpriteModeProjectActions.mockReturnValue({
      handleImport: vi.fn(),
      projectActions: [
        {
          id: "share-export-chr",
          label: "CHR",
          onSelect: vi.fn(),
        },
      ],
    });
  });

  it("renders both panels while exposing file menu state during render", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SpriteMode, {
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

    expect(markup).toContain("share:1 restore:true");
    expect(markup).toContain("sprite-editor-panel");
    expect(markup).toContain("sprite-canvas-panel");
  });
});
