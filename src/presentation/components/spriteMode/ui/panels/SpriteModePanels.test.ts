import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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

describe("SpriteModePanels", () => {
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
        },
      }),
    );

    expect(markup).toContain("canvas-surface");
    expect(markup).toContain("スプライトキャンバスパネル");
    expect(markup).toContain('aria-label="パレット"');
    expect(markup).toContain("rt-SelectTrigger");
    expect(markup).not.toContain("現在のスロット");
    expect(markup).toContain("パレット0");
    expect(markup).not.toContain("パレット 0");
    expect(markup).not.toContain("app-panel");
    expect(markup).not.toContain("app-canvas-viewport");
  });
});
