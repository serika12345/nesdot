import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectState } from "../../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../../application/state/workbenchStore";
import { type NesBackgroundPalettes } from "../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../domain/project/projectV2";

const mockedModules = vi.hoisted(() => {
  return {
    useBgModeTileEditorState: vi.fn(),
  };
});

type ColorIndexOfPalette = 0 | 1 | 2 | 3;

const createEmptyPixelRow = (): ReadonlyArray<ColorIndexOfPalette> =>
  Array.from({ length: 8 }, () => 0);

const createEmptyPixels = (): ReadonlyArray<
  ReadonlyArray<ColorIndexOfPalette>
> => Array.from({ length: 8 }, createEmptyPixelRow);

vi.mock("../../logic/bgModeWorkspaceEditingState", () => {
  return {
    useBgModeTileEditorState: mockedModules.useBgModeTileEditorState,
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

const initialProjectState = useProjectState.getState();
const initialWorkbenchState = useWorkbenchState.getState();

describe("BgModeWorkspacePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useProjectState.setState({
      ...initialProjectState,
      nes: {
        ...initialProjectState.nes,
        backgroundPalettes,
        universalBackgroundColor: 0,
      },
    });

    useWorkbenchState.setState({
      ...initialWorkbenchState,
      bgMode: {
        ...initialWorkbenchState.bgMode,
        activePaletteIndex: 0,
        isToolMenuOpen: true,
        selectedTileIndex: 5,
        tool: "eraser",
      },
    });

    mockedModules.useBgModeTileEditorState.mockReturnValue({
      handlePaintPixel: vi.fn(),
      selectedTile: createBackgroundTile(),
      visibleBackgroundTiles: [createBackgroundTile()],
    });
  });

  it("renders bg controls without the legacy tool-button wrapper class", () => {
    const markup = renderToStaticMarkup(
      React.createElement(BgModeWorkspacePanel),
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
