import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useSpriteModeCanvasPanelState: vi.fn(),
    useSpriteModeEditorPanelState: vi.fn(),
  };
});

vi.mock("../../logic/spriteModeCanvasState", () => {
  return {
    useSpriteModeCanvasPanelState: mockedHooks.useSpriteModeCanvasPanelState,
  };
});

vi.mock("../../logic/spriteModeEditorState", () => {
  return {
    useSpriteModeEditorPanelState: mockedHooks.useSpriteModeEditorPanelState,
  };
});

vi.mock("../panels/SpriteModeCanvasPanel", () => {
  return {
    SpriteModeCanvasPanel: () =>
      React.createElement("div", {}, "sprite-canvas-panel"),
  };
});

vi.mock("../panels/SpriteModeEditorPanel", () => {
  return {
    SpriteModeEditorPanel: () =>
      React.createElement("div", {}, "sprite-editor-panel"),
  };
});

import { SpriteModeScreen } from "./SpriteModeScreen";

describe("SpriteModeScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useSpriteModeEditorPanelState.mockReturnValue({
      projectSpriteSize: 8,
      selectionFields: {
        activePalette: 0,
        activeSprite: 0,
        handlePaletteChange: vi.fn(),
        handleSpriteChange: vi.fn(),
        palettes: [
          [0, 1, 2, 3],
          [0, 1, 2, 3],
          [0, 1, 2, 3],
          [0, 1, 2, 3],
        ],
      },
    });
    mockedHooks.useSpriteModeCanvasPanelState.mockReturnValue({
      canvasSurface: {
        activePalette: 0,
        activeSlot: 1,
        activeSprite: 0,
        handleTileChange: vi.fn(),
        isChangeOrderMode: false,
        tool: "pen",
      },
      paletteSlots: {
        activePalette: 0,
        activeSlot: 1,
        handlePaletteClick: vi.fn(),
        palettes: [
          [0, 1, 2, 3],
          [0, 1, 2, 3],
          [0, 1, 2, 3],
          [0, 1, 2, 3],
        ],
      },
      toolOverlay: {
        handleToggleTools: vi.fn(),
        isToolsOpen: false,
        toolMenu: {
          handleClearSprite: vi.fn(),
          handleToggleChangeOrderMode: vi.fn(),
          handleToolChange: vi.fn(),
          isChangeOrderMode: false,
          tool: "pen",
        },
      },
    });
  });

  it("renders both sprite mode panels through the screen boundary", () => {
    const markup = renderToStaticMarkup(React.createElement(SpriteModeScreen));

    expect(markup).toContain("sprite-editor-panel");
    expect(markup).toContain("sprite-canvas-panel");
  });
});
