import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProjectState } from "../../../../../../application/state/projectStore";
import { useWorkbenchState } from "../../../../../../application/state/workbenchStore";
import { type NesBackgroundPalettes } from "../../../../../../domain/nes/nesProject";
import { type BackgroundTile } from "../../../../../../domain/project/projectV2";

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

vi.mock("../../../logic/bgModeWorkspaceEditingState", () => {
  return {
    useBgModeTileEditorState: mockedModules.useBgModeTileEditorState,
  };
});

vi.mock("../../panels/BgModeLibraryPanel", () => {
  return {
    BgModeLibraryPanel: () =>
      React.createElement("div", {}, "bg-library-panel"),
  };
});

vi.mock("../../panels/BgModeEditorPanel", () => {
  return {
    BgModeEditorPanel: () => React.createElement("div", {}, "bg-editor-panel"),
  };
});

import { BgModeScreen } from ".";

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

describe("BgModeScreen", () => {
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
        isToolMenuOpen: false,
        selectedTileIndex: 5,
        tool: "pen",
      },
    });

    mockedModules.useBgModeTileEditorState.mockReturnValue({
      handlePaintPixel: vi.fn(),
      selectedTile: createBackgroundTile(),
      visibleBackgroundTiles: [createBackgroundTile()],
    });
  });

  it("renders the bg mode panels through the screen boundary", () => {
    const markup = renderToStaticMarkup(React.createElement(BgModeScreen));

    expect(markup).toContain("bg-library-panel");
    expect(markup).toContain("bg-editor-panel");
  });
});
