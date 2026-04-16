import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useSpriteModePaletteSlots: vi.fn(),
    useSpriteModeProjectSpriteSize: vi.fn(),
    useSpriteModeSelection: vi.fn(),
  };
});

vi.mock("../core/SpriteModeStateProvider", () => {
  return {
    useSpriteModePaletteSlots: mockedHooks.useSpriteModePaletteSlots,
    useSpriteModeProjectSpriteSize: mockedHooks.useSpriteModeProjectSpriteSize,
    useSpriteModeSelection: mockedHooks.useSpriteModeSelection,
  };
});

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
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useSpriteModeProjectSpriteSize.mockReturnValue({
      projectSpriteSize: 8,
    });
    mockedHooks.useSpriteModeSelection.mockReturnValue({
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
    });
    mockedHooks.useSpriteModePaletteSlots.mockReturnValue({
      activePalette: 0,
      activeSlot: 0,
      palettes: [
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
      ],
      handlePaletteClick: vi.fn(),
    });
  });

  it("renders the editor panel without app panel shell classes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SpriteModeEditorPanel),
    );

    expect(markup).toContain("スプライト編集");
    expect(markup).toContain("MuiPaper-outlined");
    expect(markup).not.toContain("app-panel");
  });

  it("renders the canvas panel without app panel or viewport shell classes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(SpriteModeCanvasPanel),
    );

    expect(markup).toContain("palette");
    expect(markup).toContain("canvas-surface");
    expect(markup).toContain("MuiPaper-outlined");
    expect(markup).not.toContain("app-panel");
    expect(markup).not.toContain("app-canvas-viewport");
  });
});
