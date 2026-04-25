import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useSpriteModeCanvasPanelState: vi.fn(),
    useSpriteModeLibraryPanelState: vi.fn(),
  };
});

vi.mock("../../logic/spriteModeCanvasState", () => {
  return {
    useSpriteModeCanvasPanelState: mockedHooks.useSpriteModeCanvasPanelState,
  };
});

vi.mock("../../logic/spriteModeLibraryState", () => {
  return {
    useSpriteModeLibraryPanelState: mockedHooks.useSpriteModeLibraryPanelState,
  };
});

vi.mock("../panels/SpriteModeCanvasPanel", () => {
  return {
    SpriteModeCanvasPanel: () =>
      React.createElement("div", {}, "sprite-canvas-panel"),
  };
});

vi.mock("../panels/SpriteModeLibraryPanel", () => {
  return {
    SpriteModeLibraryPanel: () =>
      React.createElement("div", {}, "sprite-library-panel"),
  };
});

import { SpriteModeScreen } from "./SpriteModeScreen";

describe("SpriteModeScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useSpriteModeLibraryPanelState.mockReturnValue({
      activeSprite: 0,
      handleSpriteSelect: vi.fn(),
      projectSpriteSize: 8,
      spritePalettes: [
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
      ],
      sprites: [
        {
          height: 8,
          paletteIndex: 0,
          pixels: [[0]],
          width: 8,
        },
      ],
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
        handlePaletteChange: vi.fn(),
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

    expect(markup).toContain("sprite-library-panel");
    expect(markup).toContain("sprite-canvas-panel");
    expect(markup).not.toContain("sprite-editor-panel");
  });
});
