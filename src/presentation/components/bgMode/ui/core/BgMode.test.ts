import * as O from "fp-ts/Option";
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

vi.mock("../panels/BgModeWorkspacePanel", () => {
  return {
    BgModeWorkspacePanel: () => React.createElement("div", {}, "bg-panel"),
  };
});

import { BgMode } from "./BgMode";

describe("BgMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedModules.useBgModeWorkspaceEditingState.mockReturnValue({
      activePaletteIndex: 2,
      selectedTile: { tileId: "tile" },
      selectedTileIndex: 7,
    });
    mockedModules.useExportImage.mockReturnValue({
      exportChr: vi.fn(),
      exportPng: vi.fn(),
      exportSvgSimple: vi.fn(),
    });
    mockedModules.createBgModeWorkspaceProjectActions.mockReturnValue([
      {
        id: "share-export-chr",
        label: "CHR",
        onSelect: vi.fn(),
      },
    ]);
  });

  it("renders the panel while exposing file menu state during render", () => {
    const markup = renderToStaticMarkup(
      React.createElement(BgMode, {
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

    expect(markup).toContain("share:1 restore:false");
    expect(markup).toContain("bg-panel");
  });
});
