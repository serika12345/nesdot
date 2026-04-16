import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedModules = vi.hoisted(() => {
  return {
    createBgModeWorkspaceProjectActions: vi.fn(),
    useBgModeWorkspaceEditingState: vi.fn(),
    useExportImage: vi.fn(),
  };
});

const createEmptyPixels = () =>
  Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0));

vi.mock("../../../../../infrastructure/browser/useExportImage", () => {
  return {
    default: mockedModules.useExportImage,
  };
});

vi.mock("../../logic/bgModeWorkspaceEditingState", () => {
  return {
    useBgModeWorkspaceEditingState:
      mockedModules.useBgModeWorkspaceEditingState,
  };
});

vi.mock("../../logic/bgModeWorkspaceProjectActions", () => {
  return {
    createBgModeWorkspaceProjectActions:
      mockedModules.createBgModeWorkspaceProjectActions,
  };
});

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

import { BgModeWorkspacePanel } from "./BgModeWorkspacePanel";

describe("BgModeWorkspacePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedModules.useExportImage.mockReturnValue({
      exportChr: vi.fn(),
      exportPng: vi.fn(),
      exportSvgSimple: vi.fn(),
    });
    mockedModules.createBgModeWorkspaceProjectActions.mockReturnValue([]);
    mockedModules.useBgModeWorkspaceEditingState.mockReturnValue({
      activePaletteIndex: 0,
      backgroundPalettes: [
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
        [0, 1, 2, 3],
      ],
      handlePaintPixel: vi.fn(),
      isToolMenuOpen: true,
      selectedTile: {
        width: 8,
        height: 8,
        pixels: createEmptyPixels(),
      },
      selectedTileIndex: 5,
      setActivePaletteIndex: vi.fn(),
      setIsToolMenuOpen: vi.fn(),
      setSelectedTileIndex: vi.fn(),
      setTool: vi.fn(),
      tool: "eraser",
      universalBackgroundColor: 0,
      visibleBackgroundTiles: [
        {
          width: 8,
          height: 8,
          pixels: createEmptyPixels(),
        },
      ],
    });
  });

  it("renders bg controls without the legacy tool-button wrapper class", () => {
    const markup = renderToStaticMarkup(
      React.createElement(BgModeWorkspacePanel, {
        onFileMenuStateChange: vi.fn(),
      }),
    );

    expect(markup).toContain("BG編集");
    expect(markup).toContain("MuiButton-outlined");
    expect(markup).toContain("MuiButton-contained");
    expect(markup).not.toContain("app-collapse-toggle");
    expect(markup).not.toContain("app-tool-button");
    expect(markup).not.toMatch(/data-open=/);
    expect(markup).not.toMatch(/data-active=/);
    expect(markup).not.toMatch(/data-tone=/);
  });
});
