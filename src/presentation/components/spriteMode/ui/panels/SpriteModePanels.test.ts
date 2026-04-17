import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../forms/SpriteModePaletteSlots", () => {
  return {
    SpriteModePaletteSlots: () => React.createElement("div", {}, "palette"),
  };
});

vi.mock("../canvas/SpriteModeCanvasSurface", () => {
  return {
    SpriteModeCanvasSurface: () =>
      React.createElement("div", {}, "canvas-surface"),
  };
});

vi.mock("../overlay/SpriteModeToolOverlay", () => {
  return {
    SpriteModeToolOverlay: () => React.createElement("div", {}, "tool-overlay"),
  };
});

import { SpriteModeCanvasPanel } from "./SpriteModeCanvasPanel";
import { SpriteModeEditorPanel } from "./SpriteModeEditorPanel";

describe("SpriteModePanels", () => {
  it("renders the editor panel without app panel shell classes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SpriteModeEditorPanel, {
        editorPanelState: {
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
        },
      }),
    );

    expect(markup).toContain("スプライト編集");
    expect(markup).toContain("MuiPaper-outlined");
    expect(markup).not.toContain("app-panel");
  });

  it("renders the canvas panel without app panel or viewport shell classes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SpriteModeCanvasPanel, {
        canvasPanelState: {
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
        },
      }),
    );

    expect(markup).toContain("palette");
    expect(markup).toContain("canvas-surface");
    expect(markup).toContain("MuiPaper-outlined");
    expect(markup).not.toContain("app-panel");
    expect(markup).not.toContain("app-canvas-viewport");
  });
});
