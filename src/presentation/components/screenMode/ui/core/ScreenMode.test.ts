import * as O from "fp-ts/Option";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedHooks = vi.hoisted(() => {
  return {
    useScreenModeState: vi.fn(),
  };
});

vi.mock("../../logic/useScreenModeState", () => {
  return {
    useScreenModeState: mockedHooks.useScreenModeState,
  };
});

vi.mock("../panels/ScreenModeWorkspacePanel", () => {
  return {
    ScreenModeWorkspacePanel: () =>
      React.createElement("div", {}, "screen-mode-panel"),
  };
});

import { ScreenMode } from "./ScreenMode";

describe("ScreenMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedHooks.useScreenModeState.mockReturnValue({
      handleImport: vi.fn(),
      projectActions: [
        {
          id: "share-export-png",
          label: "PNG",
          onSelect: vi.fn(),
        },
      ],
    });
  });

  it("renders the panel while exposing file menu state during render", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ScreenMode, {
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

    expect(markup).toContain("share:1 restore:true");
    expect(markup).toContain("screen-mode-panel");
  });
});
