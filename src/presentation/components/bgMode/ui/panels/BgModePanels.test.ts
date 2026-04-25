import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { type NesBackgroundPalettes } from "../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../domain/project/projectV2";

type ColorIndexOfPalette = 0 | 1 | 2 | 3;

const createEmptyPixelRow = (): ReadonlyArray<ColorIndexOfPalette> =>
  Array.from({ length: 8 }, () => 0);

const createEmptyPixels = (): ReadonlyArray<
  ReadonlyArray<ColorIndexOfPalette>
> => Array.from({ length: 8 }, createEmptyPixelRow);

vi.mock("../../../common/ui/preview/BackgroundTilePreview", () => {
  return {
    BackgroundTilePreview: () => React.createElement("div", {}, "preview"),
  };
});

vi.mock("../canvas/BgModeTileEditorCanvas", () => {
  return {
    BgModeTileEditorCanvas: () =>
      React.createElement("canvas", { "aria-label": "BGタイル編集キャンバス" }),
  };
});

vi.mock("../menu/BgModeToolMenu", () => {
  return {
    BgModeToolMenu: () => React.createElement("div", {}, "bg-tool-menu"),
  };
});

import { BgModeEditorPanel } from "./BgModeEditorPanel";
import { BgModeLibraryPanel } from "./BgModeLibraryPanel";

const backgroundPalettes: NesBackgroundPalettes = [
  [0, 1, 2, 3],
  [0, 1, 2, 3],
  [0, 1, 2, 3],
  [0, 1, 2, 3],
];

const createBackgroundTile = (): BackgroundTile => ({
  width: 8,
  height: 8,
  pixels: createEmptyPixels(),
});

describe("BgModePanels", () => {
  it("renders the library panel without legacy tool-button wrapper classes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(BgModeLibraryPanel, {
        libraryPanelState: {
          activePaletteIndex: 0,
          backgroundPalettes,
          handleSelectTile: vi.fn(),
          selectedTileIndex: 0,
          tiles: [createBackgroundTile()],
          universalBackgroundColor: 0,
        },
      }),
    );

    expect(markup).toContain("BG編集");
    expect(markup).toContain("preview");
    expect(markup).toContain('data-accent-color="teal"');
    expect(markup).toContain("rt-variant-solid");
    expect(markup).not.toContain("app-tool-button");
  });

  it("renders the editor panel overlay without legacy collapse wrapper classes", () => {
    const markup = renderToStaticMarkup(
      React.createElement(BgModeEditorPanel, {
        editorPanelState: {
          canvasState: {
            activePaletteIndex: 0,
            backgroundPalettes,
            handlePaintPixel: vi.fn(),
            selectedTile: createBackgroundTile(),
            universalBackgroundColor: 0,
          },
          handleToolMenuToggle: vi.fn(),
          isToolMenuOpen: true,
          toolMenuState: {
            activePaletteIndex: 0,
            handlePaletteChange: vi.fn(),
            handleToolChange: vi.fn(),
            tool: "eraser",
          },
        },
      }),
    );

    expect(markup).toContain("bg-tool-menu");
    expect(markup).toContain("BGタイル編集キャンバス");
    expect(markup).toContain('data-accent-color="teal"');
    expect(markup).toContain("rt-variant-solid");
    expect(markup).not.toContain("app-collapse-toggle");
    expect(markup).toContain('aria-expanded="true"');
  });
});
